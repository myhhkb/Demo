import React, { useEffect, useState } from 'react';
import {
Input,
Button,
Modal,
Form,
Select,
Space,
message,
Popconfirm,
Tag,
Pagination,
Checkbox,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { studentsApi, coursesApi, Student, Course } from '../api';
const StudentsPage: React.FC = () => {
const [students, setStudents] = useState<Student[]>([]);
const [total, setTotal] = useState(0);
const [loading, setLoading] = useState(false);
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
const [classes, setClasses] = useState<string[]>([]);
const [courses, setCourses] = useState<Course[]>([]);
const [modalVisible, setModalVisible] = useState(false);
const [editingStudent, setEditingStudent] = useState<Student | null>(null);
const [form] = Form.useForm();
const [filters, setFilters] = useState({
keyword: '',
className: '',
status: '',
});
useEffect(() => {
loadStudents();
loadClasses();
loadCourses();
}, [page, pageSize, filters]);
const loadStudents = async () => {
setLoading(true);
try {
  const res = await studentsApi.getStudents({
    page,
    pageSize,
    ...filters,
  });
  setStudents(res.data.list);
  setTotal(res.data.total);
} catch (error: any) {
  message.error(error.msg || '加载学生失败');
} finally {
  setLoading(false);
}
};
const loadClasses = async () => {
try {
  const res = await studentsApi.getClasses();
  setClasses(res.data);
} catch (error) {
  console.error('加载班级失败', error);
}
};
const loadCourses = async () => {
try {
  const res = await coursesApi.getCourses({ pageSize: 1000 });
  setCourses(res.data.list);
} catch (error) {
  console.error('加载课程失败', error);
}
};
const handleAdd = () => {
setEditingStudent(null);
form.resetFields();
setModalVisible(true);
};
const handleEdit = (student: Student) => {
setEditingStudent(student);
form.setFieldsValue(student);
setModalVisible(true);
};
const handleDelete = async (id: number) => {
try {
  await studentsApi.deleteStudent(id);
  message.success('删除成功');
  loadStudents();
} catch (error: any) {
  message.error(error.msg || '删除失败');
}
};
const handleSubmit = async (values: any) => {
try {
  if (editingStudent) {
    await studentsApi.updateStudent(editingStudent.id, values);
    message.success('更新成功');
  } else {
    await studentsApi.createStudent(values);
    message.success('创建成功');
  }
  setModalVisible(false);
  loadStudents();
} catch (error: any) {
  message.error(error.msg || '操作失败');
}
};
return (
<div>
  {/* 页面标题 */}
  <div className="flex items-center justify-between mb-6">
    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333333', margin: 0 }}>
      学生管理
    </h1>
    <Button
      type="primary"
      icon={<PlusOutlined />}
      onClick={handleAdd}
      style={{
        backgroundColor: '#5B9BD5',
        borderColor: '#5B9BD5',
        fontSize: '14px',
      }}
    >
      新增学生
    </Button>
  </div>
  {/* 搜索和筛选 */}
  <div
    className="border-2 rounded-lg p-4 mb-6"
    style={{
      borderColor: '#D0D0D0',
      backgroundColor: '#FFFFFF',
    }}
  >
    <div className="flex gap-3 items-center flex-wrap">
      <Input
        placeholder="搜索姓名/学号"
        prefix={<SearchOutlined />}
        style={{ width: '200px' }}
        value={filters.keyword}
        onChange={(e) => {
          setFilters({ ...filters, keyword: e.target.value });
          setPage(1);
        }}
      />
      <Select
        placeholder="全部班级"
        style={{ width: '120px' }}
        allowClear
        value={filters.className || undefined}
        onChange={(value) => {
          setFilters({ ...filters, className: value });
          setPage(1);
        }}
        options={classes.map((cls) => ({ label: cls, value: cls }))}
      />
      <Select
        placeholder="全部状态"
        style={{ width: '120px' }}
        allowClear
        value={filters.status || undefined}
        onChange={(value) => {
          setFilters({ ...filters, status: value });
          setPage(1);
        }}
        options={[
          { label: '活跃', value: 'active' },
          { label: '非活跃', value: 'inactive' },
        ]}
      />
      <Button
        type="primary"
        icon={<SearchOutlined />}
        onClick={() => loadStudents()}
        style={{
          backgroundColor: '#5B9BD5',
          borderColor: '#5B9BD5',
        }}
      >
        搜索
      </Button>
    </div>
  </div>
  {/* 表格 */}
  <div
    className="border-2 rounded-lg overflow-hidden"
    style={{
      borderColor: '#D0D0D0',
      backgroundColor: '#FFFFFF',
    }}
  >
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ backgroundColor: '#F5F5F5', borderBottom: '2px solid #000000' }}>
          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#333333' }}>
            姓名
          </th>
          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#333333' }}>
            学号
          </th>
          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#333333' }}>
            班级
          </th>
          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#333333' }}>
            联系方式
          </th>
          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#333333' }}>
            已选课程
          </th>
          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#333333' }}>
            状态
          </th>
          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#333333' }}>
            操作
          </th>
        </tr>
      </thead>
      <tbody>
        {students.map((student, index) => (
          <tr
            key={student.id}
            style={{
              borderBottom: '1px solid #E8E8E8',
              backgroundColor: '#FFFFFF',
            }}
          >
            <td style={{ padding: '12px 16px', color: '#333333', fontWeight: 500 }}>
              {student.name}
            </td>
            <td style={{ padding: '12px 16px', color: '#333333' }}>
              {student.student_no}
            </td>
            <td style={{ padding: '12px 16px', color: '#666666' }}>
              <Tag>{student.class_name}</Tag>
            </td>
            <td style={{ padding: '12px 16px', color: '#666666' }}>
              <div>{student.phone}</div>
              <div style={{ fontSize: '12px', color: '#999999' }}>{student.email}</div>
            </td>
            <td style={{ padding: '12px 16px', color: '#666666' }}>
              {student.enrolledCourses?.map((course) => course.name).join('、') || '-'}
            </td>
            <td style={{ padding: '12px 16px' }}>
              <Tag color={student.status === 'active' ? 'green' : 'orange'}>
                {student.status === 'active' ? '活跃' : '非活跃'}
              </Tag>
            </td>
            <td style={{ padding: '12px 16px' }}>
              <Space size="small">
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(student)}
                  style={{ color: '#FF7A45' }}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确定删除？"
                  onConfirm={() => handleDelete(student.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    type="link"
                    size="small"
                    icon={<DeleteOutlined />}
                    style={{ color: '#FF6B6B' }}
                  >
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {/* 分页 */}
    <div style={{ padding: '16px', textAlign: 'right', borderTop: '1px solid #E8E8E8' }}>
      <span style={{ marginRight: '16px', color: '#666666' }}>
        共 {total} 条 {page} / {Math.ceil(total / pageSize)}
      </span>
      <Pagination
        current={page}
        pageSize={pageSize}
        total={total}
        onChange={setPage}
        onShowSizeChange={(_, size) => setPageSize(size)}
        showSizeChanger
        pageSizeOptions={['10', '20', '50']}
      />
    </div>
  </div>
  {/* 新增/编辑对话框 */}
  <Modal
    title={editingStudent ? '编辑学生' : '新增学生'}
    open={modalVisible}
    onOk={() => form.submit()}
    onCancel={() => setModalVisible(false)}
    width={500}
    okText="保存"
    cancelText="取消"
  >
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      {/* 第一行：姓名、学号 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Form.Item
          name="name"
          label="姓名"
          rules={[{ required: true, message: '请输入姓名' }]}
        >
          <Input placeholder="陈明选" />
        </Form.Item>
        <Form.Item
          name="student_no"
          label="学号"
          rules={[{ required: true, message: '请输入学号' }]}
        >
          <Input placeholder="20240001" disabled={!!editingStudent} />
        </Form.Item>
      </div>
      {/* 第二行：班级、状态 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Form.Item
          name="class_name"
          label="班级"
        >
          <Select
            placeholder="前端2401班"
            options={classes.map((cls) => ({ label: cls, value: cls }))}
          />
        </Form.Item>
        <Form.Item
          name="status"
          label="状态"
          initialValue="active"
        >
          <Select
            placeholder="活跃"
            options={[
              { label: '活跃', value: 'active' },
              { label: '非活跃', value: 'inactive' },
            ]}
          />
        </Form.Item>
      </div>
      {/* 第三行：手机号、邮箱 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Form.Item
          name="phone"
          label="手机号"
        >
          <Input placeholder="13805425354" />
        </Form.Item>
        <Form.Item
          name="email"
          label="邮箱"
        >
          <Input type="email" placeholder="student1@..." />
        </Form.Item>
      </div>
      {/* 课程选择 */}
      <Form.Item
        name="course_ids"
        label="课程"
      >
        <Checkbox.Group style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {courses.map((course) => (
            <Checkbox key={course.id} value={course.id}>
              {course.name}
            </Checkbox>
          ))}
        </Checkbox.Group>
      </Form.Item>
    </Form>
  </Modal>
</div>
);
};
export default StudentsPage;