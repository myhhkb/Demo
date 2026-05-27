import { useState } from 'react';
import { api } from '../api';

interface LoginProps {
  onLogin: (user: { id: number; username: string }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await api.register(username, password);
        const res = await api.login(username, password);
        onLogin(res.user);
      } else {
        const res = await api.login(username, password);
        onLogin(res.user);
      }
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-purple-50">
      <div className="w-[420px] bg-white rounded-2xl shadow-lg p-10">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-gray-900">在线海报设计</h1>
          <p className="text-[14px] text-gray-400 mt-2">登录后编辑内容将自动保存到服务器</p>
        </div>

        <div className="flex h-11 rounded-full bg-gray-100 p-1 mb-8">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 rounded-full text-[15px] font-medium transition-all ${
              !isRegister ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 rounded-full text-[15px] font-medium transition-all ${
              isRegister ? 'bg-white text-blue-500 shadow-sm' : 'text-gray-500'
            }`}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[14px] font-medium text-gray-800 mb-2">
              <span className="text-red-500 mr-1">*</span>用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-11 px-4 bg-blue-50/60 border-none rounded-lg text-[14px] text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 outline-none transition"
              placeholder="请输入用户名"
              required
              minLength={3}
            />
          </div>

          <div>
            <label className="block text-[14px] font-medium text-gray-800 mb-2">
              <span className="text-red-500 mr-1">*</span>密码
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-4 pr-10 bg-blue-50/60 border-none rounded-lg text-[14px] text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 outline-none transition"
                placeholder="请输入密码"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-[13px] bg-red-50 p-3 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white text-[15px] font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? '处理中...' : isRegister ? '注册并登录' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
