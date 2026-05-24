const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE_URL + url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  register(username: string, password: string) {
    return request<{ user: { id: number; username: string } }>('/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  login(username: string, password: string) {
    return request<{ user: { id: number; username: string } }>('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  getUser() {
    return request<{ user: { id: number; username: string } }>('/user');
  },

  logout() {
    return request<{ message: string }>('/logout', { method: 'POST' });
  },

  savePosters(data: { title: string; width: number; height: number; data: string }, id?: number) {
    const url = id ? `/posters?id=${id}` : '/posters';
    return request<{ poster: any }>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPosters() {
    return request<{ posters: any[] }>('/posters');
  },

  getPoster(id: number) {
    return request<{ poster: any }>(`/posters/${id}`);
  },

  deletePoster(id: number) {
    return request<{ message: string }>(`/posters/${id}`, { method: 'DELETE' });
  },

  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(BASE_URL + '/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: '上传失败' }));
      throw new Error(data.error || '上传失败');
    }
    return res.json() as Promise<{ url: string }>;
  },

  generateImage(prompt: string) {
    return request<{ url: string }>('/ai/generate-image', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  },
};
