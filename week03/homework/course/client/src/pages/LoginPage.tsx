import React, { useState } from 'react';
import { Input, Button, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { authApi, User } from '../api';

// 登录页组件接收一个 onLogin 回调：
// 当登录成功后，父组件会用它来保存当前用户信息。
interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  // loading：表示当前是否正在请求登录接口。
  const [loading, setLoading] = useState(false);

  // username / password：保存输入框内容。
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // focusedField：记录当前聚焦的是哪个输入框，用来切换边框高亮样式。
  const [focusedField, setFocusedField] = useState<'username' | 'password' | null>('username');

  // handleLogin 负责执行登录流程。
  const handleLogin = async () => {
    // 如果用户名或密码为空，先给出提示，不发请求。
    if (!username || !password) {
      message.error('请输入用户名和密码');
      return;
    }

    setLoading(true);
    try {
      // 调用登录接口。
      const res = await authApi.login(username, password);

      // 登录成功后，把 token 保存到本地，方便后续接口自动携带。
      localStorage.setItem('token', res.data.token);

      // 把用户信息交给父组件保存。
      onLogin(res.data.user);
      message.success('登录成功');
    } catch (error: any) {
      // 如果登录失败，显示后端返回的错误信息。
      message.error(error.msg || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  // 支持按 Enter 键直接触发登录。
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
        {/* 登录卡片主体 */}
        <div className="bg-white rounded-lg shadow-md p-12" style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}>
          {/* 顶部圆形头像/标志区域 */}
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

          {/* 页面标题 */}
          <h1 className="text-center text-2xl font-bold mb-2" style={{
            color: '#333333',
            fontFamily: '"Source Han Sans CN", "Hiragino Sans GB", sans-serif',
          }}>
            在线学习管理平台
          </h1>

          {/* 表单区域。
              Spin 会在 loading 为 true 时显示加载动画，防止用户重复点击。 */}
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

          {/* 底部测试账号提示 */}
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
