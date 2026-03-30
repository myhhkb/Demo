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
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SwapOutlined } from '@ant-design/icons';
import { coursesApi, Course } from '../api';

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [categories, setCategories] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
    category: '',
  });

  useEffect(() => {
    loadCourses();
    loadCategories();
  }, [page, pageSize, filters]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await coursesApi.getCourses({
        page,
        pageSize,
        ...filters,
      });
      setCourses(res.data.list);
      setTotal(res.data.total);
    } catch (error: any) {
      message.error(error.msg || '加载课程失败');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await coursesApi.getCategories();
      setCategories(res.data);
    } catch (error) {
      console.error('加载分类失败', error);
    }
  };

  const handleAdd = () => {
    setEditingCourse(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    form.setFieldsValue(course);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await coursesApi.deleteCourse(id);
      message.success('删除成功');
      loadCourses();
    } catch (error: any) {
      message.error(error.msg || '删除失败');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await coursesApi.toggleCourseStatus(id);
      message.success('状态已切换');
      loadCourses();
    } catch (error: any) {
      message.error(error.msg || '操作失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingCourse) {
        await coursesApi.updateCourse(editingCourse.id, values);
        message.success('更新成功');
      } else {
        await coursesApi.createCourse(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadCourses();
    } catch (error: any) {
      message.error(error.msg || '操作失败');
    }
  };

  const columns = [
    {
      title: '课程名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '讲师',
      dataIndex: 'instructor',
      key: 'instructor',
      width: 120,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'published' ? 'green' : 'orange'}>
          {status === 'published' ? '已发布' : '草稿'}
        </Tag>
      ),
    },
    {
      title: '学生数',
      dataIndex: 'student_count',
      key: 'student_count',
      width: 80,
    },
    {
      title: '课时数',
      dataIndex: 'lesson_count',
      key: 'lesson_count',
      width: 80,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Course) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            size="small"
            icon={<SwapOutlined />}
            onClick={() => handleToggleStatus(record.id)}
          >
            切换状态
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
            placeholder="搜索课程名或讲师"
            style={{ width: 200 }}
            value={filters.keyword}
            onChange={(e) => {
              setFilters({ ...filters, keyword: e.target.value });
              setPage(1);
            }}
          />
          <Select
            placeholder="选择分类"
            style={{ width: 150 }}
            allowClear
            value={filters.category || undefined}
            onChange={(value) => {
              setFilters({ ...filters, category: value });
              setPage(1);
            }}
            options={categories.map((cat) => ({ label: cat, value: cat }))}
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
              { label: '已发布', value: 'published' },
              { label: '草稿', value: 'draft' },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增课程
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={courses}
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
        title={editingCourse ? '编辑课程' : '新增课程'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="课程名称"
            rules={[{ required: true, message: '请输入课程名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="课程描述"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="instructor"
            label="讲师"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
          >
            <Select
              options={categories.map((cat) => ({ label: cat, value: cat }))}
            />
          </Form.Item>

          <Form.Item
            name="lesson_count"
            label="课时数"
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            initialValue="draft"
          >
            <Select
              options={[
                { label: '草稿', value: 'draft' },
                { label: '已发布', value: 'published' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CoursesPage;
