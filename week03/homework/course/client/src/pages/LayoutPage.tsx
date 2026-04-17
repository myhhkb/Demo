import React, { useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, Button } from 'antd';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { User } from '../api';
import DashboardPage from './DashboardPage';
import CoursesPage from './CoursesPage';
import StudentsPage from './StudentsPage';
import SummaryPage from './SummaryPage';

// LayoutPage 接收当前登录用户信息，
// 用来显示顶部头像、用户名，以及主系统界面。
interface LayoutPageProps {
  user: User;
}

const LayoutPage: React.FC<LayoutPageProps> = ({ user }) => {
  // collapsed 控制左侧边栏是展开还是收起。
  const [collapsed, setCollapsed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // 退出登录：清空 token，并跳回登录页。
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // 根据当前地址，计算左侧菜单应该高亮哪一项。
  const getSelectedKey = () => {
    if (location.pathname === '/') return '/';
    return location.pathname;
  };

  // 顶部右上角用户下拉菜单。
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" disabled>
        <span>{user.name}</span>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  // 左侧导航菜单配置。
  const menuItems = [
    {
      key: '/',
      label: '工作台',
      icon: '📊',
      onClick: () => navigate('/'),
    },
    {
      key: '/courses',
      label: '课程管理',
      icon: '📚',
      onClick: () => navigate('/courses'),
    },
    {
      key: '/students',
      label: '学生管理',
      icon: '👥',
      onClick: () => navigate('/students'),
    },
    {
      key: '/summary',
      label: '学习总结',
      icon: '📝',
      onClick: () => navigate('/summary'),
    },
  ];

  // 根据边栏收缩状态动态计算主区域左边距。
  const siderWidth = collapsed ? 80 : 160;

  return (
    <Layout className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      {/* 左侧固定边栏 */}
      <Layout.Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={160}
        collapsedWidth={80}
        style={{
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E0E0E0',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          height: '100vh',
          zIndex: 1000,
          overflow: 'auto',
        }}
      >
        {/* Logo / 平台名称区域 */}
        <div className="p-4 border-b" style={{ borderColor: '#E0E0E0' }}>
          <div className="flex items-center justify-center gap-2">
            <span style={{ fontSize: '20px' }}>🎓</span>
            {!collapsed && (
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#333333',
              }}>
                学习管理平台
              </span>
            )}
          </div>
        </div>

        {/* 左侧菜单列表 */}
        <div style={{ paddingTop: '8px' }}>
          {menuItems.map((item) => (
            <div
              key={item.key}
              onClick={item.onClick}
              style={{
                padding: '12px 16px',
                margin: '4px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: getSelectedKey() === item.key ? '#E3F2FD' : 'transparent',
                border: getSelectedKey() === item.key ? '2px solid #5B9BD5' : 'none',
                color: getSelectedKey() === item.key ? '#5B9BD5' : '#666666',
                fontSize: '14px',
                fontWeight: getSelectedKey() === item.key ? 600 : 400,
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                if (getSelectedKey() !== item.key) {
                  e.currentTarget.style.backgroundColor = '#F5F5F5';
                }
              }}
              onMouseLeave={(e) => {
                if (getSelectedKey() !== item.key) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </div>
          ))}
        </div>
      </Layout.Sider>

      {/* 右侧主体布局 */}
      <Layout
        style={{
          marginLeft: siderWidth,
          transition: 'margin-left 0.2s ease',
        }}
      >
        {/* 顶部导航栏 */}
        <Layout.Header
          style={{
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E0E0E0',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
          }}
        >
          {/* 左上角收起/展开按钮 */}
          <Button
            type="text"
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '18px',
              color: '#666666',
            }}
          >
            ☰
          </Button>

          {/* 右上角用户信息和下拉菜单 */}
          <Dropdown overlay={userMenu} trigger={['click']}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '4px',
                transition: 'background-color 0.3s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Avatar style={{ backgroundColor: '#5B9BD5' }}>
                {user.name.charAt(0)}
              </Avatar>
              <span style={{ fontSize: '14px', color: '#333333' }}>
                {user.name}
              </span>
              <span style={{ fontSize: '12px', color: '#999999' }}>▼</span>
            </div>
          </Dropdown>
        </Layout.Header>

        {/* 页面内容区域 */}
        <Layout.Content
          style={{
            padding: '24px',
            backgroundColor: '#F5F5F5',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {/* 子页面路由 */}
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
