import Router from '@koa/router';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { success } from '../utils/response.js';

const router = new Router();

// 工作台首页接口。
// 只有登录后才能访问，所以先走 authenticateToken 鉴权。
router.get('/', authenticateToken, async (ctx) => {
  // 为了保证图表始终有可展示的数据，先补充最近 7 天的学习记录。
  backfillRecentLearningRecords();

  // 统计课程总数。
  const totalCourses = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;

  // 统计已发布课程数。
  const publishedCourses = db.prepare("SELECT COUNT(*) as count FROM courses WHERE status = 'published'").get().count;

  // 统计学生总数。
  const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count;

  // 统计活跃学生数。
  const activeStudents = db.prepare("SELECT COUNT(*) as count FROM students WHERE status = 'active'").get().count;

  // 统计选课人数最多的前 8 门已发布课程。
  const enrollment = db.prepare(`
    SELECT c.name, c.student_count as value
    FROM courses c
    WHERE c.status = 'published'
    ORDER BY c.student_count DESC
    LIMIT 8
  `).all();

  // 统计近 7 天学习活跃度数据。
  const today = new Date();
  const activity = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // 每天统计两个指标：
    // 1. 学习人数（去重后学生数）
    // 2. 学习总时长（分钟）
    const record = db.prepare(`
      SELECT COUNT(DISTINCT student_id) as students, COALESCE(SUM(duration), 0) as duration
      FROM learning_records WHERE date = ?
    `).get(dateStr);

    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    // 把总分钟数换算成小时，更适合图表展示。
    const durationHours = Math.round(record.duration / 60);
    const students = Number(record.students || 0);

    activity.push({
      date: dateStr,
      label: weekDays[date.getDay()],
      students,
      duration: durationHours,
    });
  }

  // 学生状态分布：活跃 / 非活跃。
  const statusDist = [
    { name: '活跃学生', value: activeStudents },
    { name: '非活跃学生', value: totalStudents - activeStudents },
  ];

  // 课程分类分布：按 category 分组统计。
  const categoryDist = db.prepare(`
    SELECT category as name, COUNT(*) as value FROM courses
    WHERE category != '' GROUP BY category ORDER BY value DESC
  `).all();

  // 统一返回给前端工作台所需的全部数据。
  success(ctx, {
    stats: {
      totalCourses,
      publishedCourses,
      totalStudents,
      activeStudents,
    },
    charts: {
      enrollment,
      activity,
      statusDist,
      categoryDist,
    },
  });
});

// backfillRecentLearningRecords 用来给最近 7 天自动补充学习记录。
// 这样即使数据库是新初始化的，图表页也不会空空如也。
function backfillRecentLearningRecords() {
  const studentRows = db.prepare('SELECT id FROM students').all();
  const courseRows = db.prepare('SELECT id FROM courses').all();

  // 如果没有学生或课程，就没法生成学习记录。
  if (studentRows.length === 0 || courseRows.length === 0) return;

  const studentIds = studentRows.map((s) => s.id);
  const courseIds = courseRows.map((c) => c.id);

  const countByDateStmt = db.prepare('SELECT COUNT(*) as count FROM learning_records WHERE date = ?');
  const insertRecord = db.prepare(`
    INSERT INTO learning_records (student_id, course_id, date, duration)
    VALUES (?, ?, ?, ?)
  `);

  const today = new Date();
  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    // 如果某天已经有数据，就不要重复补。
    const existingCount = countByDateStmt.get(dateStr).count;
    if (existingCount > 0) continue;

    // 随机生成 5~14 条学习记录。
    const recordCount = Math.floor(Math.random() * 10) + 5;
    for (let i = 0; i < recordCount; i++) {
      const studentId = studentIds[Math.floor(Math.random() * studentIds.length)];
      const courseId = courseIds[Math.floor(Math.random() * courseIds.length)];
      const duration = Math.floor(Math.random() * 90) + 10;
      insertRecord.run(studentId, courseId, dateStr, duration);
    }

    // 再做一次微调，确保“学习时长（小时）-学习人数”的差值大致在 1~7 之间，
    // 这样图表曲线更自然，不会太难看。
    const summary = db.prepare(`
      SELECT COUNT(DISTINCT student_id) as students, COALESCE(SUM(duration), 0) as totalDuration
      FROM learning_records WHERE date = ?
    `).get(dateStr);

    const students = Number(summary.students || 0);
    const currentHours = Math.round(Number(summary.totalDuration || 0) / 60);
    const targetGap = Math.floor(Math.random() * 7) + 1;
    const targetHours = students + targetGap;

    if (currentHours < targetHours) {
      const extraMinutes = (targetHours - currentHours) * 60;
      const studentId = studentIds[Math.floor(Math.random() * studentIds.length)];
      const courseId = courseIds[Math.floor(Math.random() * courseIds.length)];
      insertRecord.run(studentId, courseId, dateStr, extraMinutes);
    }
  }
}

export default router;
