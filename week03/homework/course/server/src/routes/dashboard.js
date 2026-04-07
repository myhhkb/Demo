import Router from '@koa/router';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { success } from '../utils/response.js';

const router = new Router();

router.get('/', authenticateToken, async (ctx) => {
  backfillRecentLearningRecords();

  const totalCourses = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
  const publishedCourses = db.prepare("SELECT COUNT(*) as count FROM courses WHERE status = 'published'").get().count;
  const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
  const activeStudents = db.prepare("SELECT COUNT(*) as count FROM students WHERE status = 'active'").get().count;

  const enrollment = db.prepare(`
    SELECT c.name, c.student_count as value
    FROM courses c
    WHERE c.status = 'published'
    ORDER BY c.student_count DESC
    LIMIT 8
  `).all();

  const today = new Date();
  const activity = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const record = db.prepare(`
      SELECT COUNT(DISTINCT student_id) as students, COALESCE(SUM(duration), 0) as duration
      FROM learning_records WHERE date = ?
    `).get(dateStr);

    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const durationHours = Math.round(record.duration / 60);
    const students = Number(record.students || 0);

    activity.push({
      date: dateStr,
      label: weekDays[date.getDay()],
      students,
      duration: durationHours,
    });
  }

  const statusDist = [
    { name: '活跃学生', value: activeStudents },
    { name: '非活跃学生', value: totalStudents - activeStudents },
  ];

  const categoryDist = db.prepare(`
    SELECT category as name, COUNT(*) as value FROM courses
    WHERE category != '' GROUP BY category ORDER BY value DESC
  `).all();

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

function backfillRecentLearningRecords() {
  const studentRows = db.prepare('SELECT id FROM students').all();
  const courseRows = db.prepare('SELECT id FROM courses').all();
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

    const existingCount = countByDateStmt.get(dateStr).count;
    if (existingCount > 0) continue;

    const recordCount = Math.floor(Math.random() * 10) + 5;
    for (let i = 0; i < recordCount; i++) {
      const studentId = studentIds[Math.floor(Math.random() * studentIds.length)];
      const courseId = courseIds[Math.floor(Math.random() * courseIds.length)];
      const duration = Math.floor(Math.random() * 90) + 10;
      insertRecord.run(studentId, courseId, dateStr, duration);
    }

    // 确保“学习时长（小时）-学习人数”随机落在 1~7
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
