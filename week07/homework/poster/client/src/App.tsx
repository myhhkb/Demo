import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from './api';
import Login from './pages/Login';
import Editor from './pages/Editor';

function App() {
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUser()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />}
        />
        <Route
          path="/"
          element={user ? <Editor user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
