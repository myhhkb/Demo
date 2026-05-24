import { useState } from 'react';
import { api } from '../api';

interface LoginProps {
  onLogin: (user: { id: number; username: string }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = isRegister
        ? await api.register(username, password)
        : await api.login(username, password);
      onLogin(res.user);
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-[400px] bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">在线海报设计器</h1>
          <p className="text-gray-500 mt-2">{isRegister ? '创建新账号' : '登录您的账号'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="请输入用户名"
              required
              minLength={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="请输入密码"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '处理中...' : isRegister ? '注册' : '登录'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
          </button>
        </div>
      </div>
    </div>
  );
}
