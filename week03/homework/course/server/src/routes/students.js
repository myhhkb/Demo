import Router from '@koa/router';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { success, fail } from '../utils/response.js';

const router = new Router();

router.get('/', authenticateToken, async (ctx) => {
  const { keyword = '', className = '', status = '', courseId = '', page = 1, pageSize = 10 } = ctx.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let where = 'WHERE 1=1';
  const params = [];

  if (keyword) {
    where += ' AND (name LIKE ? OR student_no LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (className) {
    where += ' AND class_name = ?';
    params.push(className);
  }
  if (status) {
    where += ' AND status = ?';
    params.push(status);
  }

  let rows = db.prepare(`SELECT * FROM students ${where} ORDER BY created_at DESC`).all(...params);

  if (courseId) {
    rows = rows.filter(s => {
      const ids = JSON.parse(s.course_ids || '[]');
      return ids.includes(Number(courseId));
    });
  }

  const total = rows.length;
  const allCourses = db.prepare('SELECT id, name FROM courses').all();
  const list = rows.slice(offset, offset + Number(pageSize)).map(s => {
    const courseIds = JSON.parse(s.course_ids || '[]');
    const enrolledCourses = allCourses.filter(c => courseIds.includes(c.id));
    return { ...s, course_ids: courseIds, enrolledCourses };
  });

  success(ctx, { list, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/classes', authenticateToken, async (ctx) => {
  const classes = db.prepare("SELECT DISTINCT class_name FROM students WHERE class_name != '' ORDER BY class_name")
    .all()
    .map(r => r.class_name);
  success(ctx, classes);
});

router.get('/:id', authenticateToken, async (ctx) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(ctx.params.id);
  if (!student) {
    return fail(ctx, 404, '学生不存在');
  }
  student.course_ids = JSON.parse(student.course_ids || '[]');

  const courses = db.prepare('SELECT id, name FROM courses').all();
  const enrolledCourses = courses.filter(c => student.course_ids.includes(c.id));

  success(ctx, { ...student, enrolledCourses });
});

router.post('/', authenticateToken, async (ctx) => {
  const { name, student_no, class_name, phone, email, status, course_ids } = ctx.request.body;

  if (!name || !name.trim()) {
    return fail(ctx, 400, '学生姓名不能为空');
  }
  if (!student_no) {
    return fail(ctx, 400, '学号不能为空');
  }
  if (!/^\d{8}$/.test(student_no)) {
    return fail(ctx, 400, '学号必须是8位纯数字');
  }
  if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
    return fail(ctx, 400, '手机号格式不正确（11位，以1开头）');
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail(ctx, 400, '邮箱格式不正确');
  }

  const existing = db.prepare('SELECT * FROM students WHERE student_no = ?').get(student_no);
  if (existing) {
    return fail(ctx, 400, '学号已存在');
  }

  const result = db.prepare(`
    INSERT INTO students (name, student_no, class_name, phone, email, status, course_ids)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(),
    student_no,
    class_name || '',
    phone || '',
    email || '',
    status || 'active',
    JSON.stringify(course_ids || [])
  );

  updateCourseCounts();

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
  student.course_ids = JSON.parse(student.course_ids || '[]');
  ctx.status = 201;
  success(ctx, student);
});

router.put('/:id', authenticateToken, async (ctx) => {
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(ctx.params.id);
  if (!existing) {
    return fail(ctx, 404, '学生不存在');
  }

  const { name, student_no, class_name, phone, email, status, course_ids } = ctx.request.body;

  // 验证字段格式
  if (name && !name.trim()) {
    return fail(ctx, 400, '学生姓名不能为空');
  }
  if (student_no && !/^\d{8}$/.test(student_no)) {
    return fail(ctx, 400, '学号必须是8位纯数字');
  }
  if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
    return fail(ctx, 400, '手机号格式不正确（11位，以1开头）');
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail(ctx, 400, '邮箱格式不正确');
  }

  // 检查学号唯一性（如果修改了学号）
  if (student_no && student_no !== existing.student_no) {
    const duplicate = db.prepare('SELECT * FROM students WHERE student_no = ?').get(student_no);
    if (duplicate) {
      return fail(ctx, 400, '学号已存在');
    }
  }

  db.prepare(`
    UPDATE students SET name = ?, student_no = ?, class_name = ?, phone = ?, email = ?, status = ?, course_ids = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name ? name.trim() : existing.name,
    student_no ?? existing.student_no,
    class_name ?? existing.class_name,
    phone ?? existing.phone,
    email ?? existing.email,
    status ?? existing.status,
    course_ids !== undefined ? JSON.stringify(course_ids) : existing.course_ids,
    ctx.params.id
  );

  updateCourseCounts();

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(ctx.params.id);
  student.course_ids = JSON.parse(student.course_ids || '[]');
  success(ctx, student);
});

router.delete('/:id', authenticateToken, async (ctx) => {
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(ctx.params.id);
  if (!existing) {
    return fail(ctx, 404, '学生不存在');
  }

  db.prepare('DELETE FROM students WHERE id = ?').run(ctx.params.id);
  updateCourseCounts();
  success(ctx, null, '删除成功');
});

function updateCourseCounts() {
  const courses = db.prepare('SELECT id FROM courses').all();
  const students = db.prepare('SELECT course_ids FROM students').all();

  for (const course of courses) {
    const count = students.filter(s => {
      const ids = JSON.parse(s.course_ids || '[]');
      return ids.includes(course.id);
    }).length;
    db.prepare('UPDATE courses SET student_count = ? WHERE id = ?').run(count, course.id);
  }
}

export default router;
