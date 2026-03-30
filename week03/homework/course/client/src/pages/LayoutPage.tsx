import React, { useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, message } from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  UserOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { User } from '../api';
import DashboardPage from './DashboardPage';
import CoursesPage from './CoursesPage';
import StudentsPage from './StudentsPage';
import SummaryPage from './SummaryPage';

interface LayoutPageProps {
  user: User;
}

const LayoutPage: React.FC<LayoutPageProps> = ({ user }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    message.success('已退出登录');
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '工作台',
      onClick: () => navigate('/'),
    },
    {
      key: '/courses',
      icon: <BookOutlined />,
      label: '课程管理',
      onClick: () => navigate('/courses'),
    },
    {
      key: '/students',
      icon: <UserOutlined />,
      label: '学生管理',
      onClick: () => navigate('/students'),
    },
    {
      key: '/summary',
      icon: <FileTextOutlined />,
      label: '学习总结',
      onClick: () => navigate('/summary'),
    },
  ];

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" disabled>
        <span>{user.name}</span>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout className="min-h-screen">
      <Layout.Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={200}
        className="bg-white border-r border-gray-200"
      >
        <div className="p-4 text-center border-b border-gray-200">
          <h2 className={`font-bold text-lg transition-all ${collapsed ? 'hidden' : ''}`}>
            学习平台
          </h2>
        </div>
        <Menu
          mode="inline"
          items={menuItems}
          className="border-r-0"
        />
      </Layout.Sider>

      <Layout>
        <Layout.Header className="bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-xl cursor-pointer hover:text-blue-500 transition-colors"
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>

          <Dropdown overlay={userMenu} trigger={['click']}>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <Avatar icon={<UserOutlined />} />
              <span className="text-sm">{user.name}</span>
            </div>
          </Dropdown>
        </Layout.Header>

        <Layout.Content className="p-6 bg-gray-50">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/summary" element={<SummaryPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout.Content>
      </Layout>
    </Layout>
  );
};

export default LayoutPage;
