import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Popconfirm,
  Tag,
  Card,
  Drawer,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
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
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
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

  const handleView = async (id: number) => {
    try {
      const res = await studentsApi.getStudent(id);
      setSelectedStudent(res.data);
      setDrawerVisible(true);
    } catch (error: any) {
      message.error(error.msg || '加载学生详情失败');
    }
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

  const columns = [
    {
      title: '学号',
      dataIndex: 'student_no',
      key: 'student_no',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '班级',
      dataIndex: 'class_name',
      key: 'class_name',
      width: 150,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>
          {status === 'active' ? '活跃' : '非活跃'}
        </Tag>
      ),
    },
    {
      title: '选课数',
      dataIndex: 'course_ids',
      key: 'course_ids',
      width: 80,
      render: (ids: number[]) => ids.length,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: Student) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record.id)}
          >
            查看
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <Space className="w-full flex-wrap">
          <Input
            placeholder="搜索学号或姓名"
            style={{ width: 200 }}
            value={filters.keyword}
            onChange={(e) => {
              setFilters({ ...filters, keyword: e.target.value });
              setPage(1);
            }}
          />
          <Select
            placeholder="选择班级"
            style={{ width: 150 }}
            allowClear
            value={filters.className || undefined}
            onChange={(value) => {
              setFilters({ ...filters, className: value });
              setPage(1);
            }}
            options={classes.map((cls) => ({ label: cls, value: cls }))}
          />
          <Select
            placeholder="选择状态"
            style={{ width: 120 }}
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增学生
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={students}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: setPage,
            onShowSizeChange: (_, size) => setPageSize(size),
          }}
        />
      </Card>

      <Modal
        title={editingStudent ? '编辑学生' : '新增学生'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="student_no"
            label="学号"
            rules={[{ required: true, message: '请输入学号' }]}
          >
            <Input disabled={!!editingStudent} />
          </Form.Item>

          <Form.Item
            name="class_name"
            label="班级"
          >
            <Select
              options={classes.map((cls) => ({ label: cls, value: cls }))}
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="电话"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
          >
            <Input type="email" />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            initialValue="active"
          >
            <Select
              options={[
                { label: '活跃', value: 'active' },
                { label: '非活跃', value: 'inactive' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="course_ids"
            label="选课"
          >
            <Select
              mode="multiple"
              placeholder="选择课程"
              options={courses.map((course) => ({ label: course.name, value: course.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="学生详情"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={500}
      >
        {selectedStudent && (
          <div className="space-y-4">
            <div>
              <span className="font-semibold">姓名：</span>
              <span>{selectedStudent.name}</span>
            </div>
            <div>
              <span className="font-semibold">学号：</span>
              <span>{selectedStudent.student_no}</span>
            </div>
            <div>
              <span className="font-semibold">班级：</span>
              <span>{selectedStudent.class_name}</span>
            </div>
            <div>
              <span className="font-semibold">电话：</span>
              <span>{selectedStudent.phone}</span>
            </div>
            <div>
              <span className="font-semibold">邮箱：</span>
              <span>{selectedStudent.email}</span>
            </div>
            <div>
              <span className="font-semibold">状态：</span>
              <Tag color={selectedStudent.status === 'active' ? 'green' : 'orange'}>
                {selectedStudent.status === 'active' ? '活跃' : '非活跃'}
              </Tag>
            </div>
            <div>
              <span className="font-semibold">选课：</span>
              <div className="mt-2 space-y-1">
                {selectedStudent.enrolledCourses?.map((course) => (
                  <Tag key={course.id}>{course.name}</Tag>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default StudentsPage;
