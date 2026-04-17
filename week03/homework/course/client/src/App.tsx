import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { authApi, User } from './api';
import LoginPage from './pages/LoginPage';
import LayoutPage from './pages/LayoutPage';
import './index.css';

// App 是整个课程管理系统前端的根组件。
// 它主要负责：
// 1. 初始化用户登录状态
// 2. 在登录页和系统主界面之间做路由切换
const App: React.FC = () => {
  // user 用来保存当前登录用户信息。
  const [user, setUser] = useState<User | null>(null);

  // loading 表示页面是否仍在做“自动登录校验”。
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 先从本地存储中取出 token。
    const token = localStorage.getItem('token');

    if (token) {
      // 如果本地有 token，就向后端请求当前用户信息，验证 token 是否还有效。
      authApi.getMe()
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          // 如果 token 失效，就把它清掉，避免后续继续误用。
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // 如果本地没有 token，就直接结束加载状态。
      setLoading(false);
    }
  }, []);

  // 在自动校验登录状态时，先显示一个加载中动画。
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          // 如果用户已经登录，再访问登录页时就直接跳首页。
          element={user ? <Navigate to="/" /> : <LoginPage onLogin={setUser} />}
        />
        <Route
          path="/*"
          // 主应用区域需要登录后才能进入；否则统一跳去登录页。
          element={user ? <LayoutPage user={user} /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
