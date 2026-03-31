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
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SwapOutlined, SearchOutlined } from '@ant-design/icons';
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

  return (
    <div>
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333333', margin: 0 }}>
          课程管理
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
          新增课程
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
            placeholder="搜索课程名/讲师"
            prefix={<SearchOutlined />}
            style={{ width: '200px' }}
            value={filters.keyword}
            onChange={(e) => {
              setFilters({ ...filters, keyword: e.target.value });
              setPage(1);
            }}
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
              { label: '已发布', value: 'published' },
              { label: '草稿', value: 'draft' },
            ]}
          />
          <Select
            placeholder="全部分类"
            style={{ width: '120px' }}
            allowClear
            value={filters.category || undefined}
            onChange={(value) => {
              setFilters({ ...filters, category: value });
              setPage(1);
            }}
            options={categories.map((cat) => ({ label: cat, value: cat }))}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => loadCourses()}
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
            <tr style={{ backgroundColor: '#F5F5F5', borderBottom: '2px solid #D0D0D0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#333333' }}>
                课程名称
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#333333' }}>
                讲师
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#333333' }}>
                分类
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#333333' }}>
                课时
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#333333' }}>
                选课人数
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
            {courses.map((course, index) => (
              <tr
                key={course.id}
                style={{
                  borderBottom: '1px solid #E8E8E8',
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                }}
              >
                <td style={{ padding: '12px 16px', color: '#333333' }}>
                  <div style={{ fontWeight: 500 }}>{course.name}</div>
                  <div style={{ fontSize: '12px', color: '#999999', marginTop: '4px' }}>
                    {course.description?.substring(0, 30)}...
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: '#666666' }}>{course.instructor}</td>
                <td style={{ padding: '12px 16px' }}>
                  <Tag color="blue">{course.category}</Tag>
                </td>
                <td style={{ padding: '12px 16px', color: '#666666' }}>{course.lesson_count}</td>
                <td style={{ padding: '12px 16px', color: '#666666' }}>{course.student_count}</td>
                <td style={{ padding: '12px 16px' }}>
                  <Tag color={course.status === 'published' ? 'green' : 'orange'}>
                    {course.status === 'published' ? '已发布' : '草稿'}
                  </Tag>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Space size="small">
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(course)}
                      style={{ color: '#FF7A45' }}
                    >
                      编辑
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      icon={<SwapOutlined />}
                      onClick={() => handleToggleStatus(course.id)}
                      style={{ color: '#5B9BD5' }}
                    >
                      {course.status === 'published' ? '下架' : '发布'}
                    </Button>
                    <Popconfirm
                      title="确定删除？"
                      onConfirm={() => handleDelete(course.id)}
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
        title={editingCourse ? '编辑课程' : '新增课程'}
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
          <Form.Item
            name="name"
            label="课程名称"
            rules={[{ required: true, message: '请输入课程名称' }]}
          >
            <Input placeholder="请输入课程名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="课程描述"
          >
            <Input.TextArea placeholder="请输入课程描述" rows={3} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="instructor"
              label="讲师"
            >
              <Input placeholder="请输入" />
            </Form.Item>

            <Form.Item
              name="category"
              label="分类"
            >
              <Select
                placeholder="请选择"
                options={categories.map((cat) => ({ label: cat, value: cat }))}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="lesson_count"
              label="课时数"
              rules={[
                { pattern: /^\d+$/, message: '课时数必须是正整数' },
              ]}
              validateTrigger="onBlur"
            >
              <Input type="number" placeholder="0" min={0} />
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
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CoursesPage;
