import React, { useState } from 'react';
import { Input, Button, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { authApi, User } from '../api';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<'username' | 'password' | null>('username');

  const handleLogin = async () => {
    if (!username || !password) {
      message.error('请输入用户名和密码');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login(username, password);
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.user);
      message.success('登录成功');
    } catch (error: any) {
      message.error(error.msg || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, #F8F9FA 0%, #F5F7FA 100%)',
      backgroundImage: `
        repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(200, 200, 200, 0.03) 10px,
          rgba(200, 200, 200, 0.03) 20px
        )
      `,
    }}>
      <div className="w-full max-w-md">
        {/* 登录卡片 */}
        <div className="bg-white rounded-lg shadow-md p-12" style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}>
          {/* 顶部圆形标志 */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{
              backgroundColor: '#E6E6FA',
            }}>
              <UserOutlined style={{
                fontSize: '40px',
                color: '#4B0082',
              }} />
            </div>
          </div>

          {/* 标题 */}
          <h1 className="text-center text-2xl font-bold mb-2" style={{
            color: '#333333',
            fontFamily: '"Source Han Sans CN", "Hiragino Sans GB", sans-serif',
          }}>
            在线学习管理平台
          </h1>

          {/* 表单容器 */}
          <Spin spinning={loading}>
            <div className="space-y-4 mt-8">
              {/* 用户名输入框 */}
              <div>
                <Input
                  size="large"
                  placeholder="请输入用户名"
                  prefix={<UserOutlined style={{ color: '#666666' }} />}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  onKeyPress={handleKeyPress}
                  style={{
                    borderRadius: '4px',
                    borderColor: focusedField === 'username' ? '#D1E9FF' : '#E8E8E8',
                    backgroundColor: '#FFFFFF',
                  }}
                  className={focusedField === 'username' ? 'border-2' : ''}
                />
              </div>

              {/* 密码输入框 */}
              <div>
                <Input.Password
                  size="large"
                  placeholder="请输入密码"
                  prefix={<LockOutlined style={{ color: '#666666' }} />}
                  iconRender={(visible) => (visible ? <EyeTwoTone style={{ color: '#666666' }} /> : <EyeInvisibleOutlined style={{ color: '#666666' }} />)}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  onKeyPress={handleKeyPress}
                  style={{
                    borderRadius: '4px',
                    borderColor: focusedField === 'password' ? '#D1E9FF' : '#E8E8E8',
                    backgroundColor: '#FFFFFF',
                  }}
                  className={focusedField === 'password' ? 'border-2' : ''}
                />
              </div>

              {/* 登录按钮 */}
              <Button
                type="primary"
                size="large"
                block
                onClick={handleLogin}
                loading={loading}
                style={{
                  backgroundColor: '#D1E9FF',
                  borderColor: '#D1E9FF',
                  color: '#0050B3',
                  fontWeight: 600,
                  marginTop: '24px',
                  borderRadius: '4px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#BAE0FF';
                  e.currentTarget.style.borderColor = '#BAE0FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#D1E9FF';
                  e.currentTarget.style.borderColor = '#D1E9FF';
                }}
              >
                登录
              </Button>
            </div>
          </Spin>

          {/* 底部备注文本 */}
          <div className="text-center mt-8 pt-6 border-t border-gray-100">
            <p style={{
              color: '#888888',
              fontSize: '12px',
              fontFamily: '"Source Han Sans CN", "Hiragino Sans GB", sans-serif',
            }}>
              测试账号：admin/admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
