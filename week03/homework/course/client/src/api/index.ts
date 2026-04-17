import axios, { AxiosInstance } from 'axios';

// 创建 axios 实例，统一配置接口请求行为。
const api: AxiosInstance = axios.create({
  // 所有请求默认都会拼接到 /api 下。
  baseURL: '/api',

  // 超时时间设置为 10 秒。
  timeout: 10000,
});

// 请求拦截器：每次发送请求前，自动把 token 带上。
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一处理接口返回结果和错误。
api.interceptors.response.use(
  // 成功时，直接返回 response.data，减少页面层的取值层级。
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    // 如果除了登录接口以外的请求返回 401，
    // 说明当前 token 失效，需要清掉 token 并跳回登录页。
    // 但登录接口自己返回 401 时，不要全局跳转，
    // 因为登录页自己要显示“用户名或密码错误”。
    if (status === 401 && !requestUrl.includes('/auth/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error.response?.data || error);
  }
);

// 通用接口响应结构。
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

// 用户类型定义。
export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  avatar: string;
  created_at: string;
}

// 课程类型定义。
export interface Course {
  id: number;
  name: string;
  description: string;
  instructor: string;
  cover: string;
  category: string;
  status: 'published' | 'draft';
  student_count: number;
  lesson_count: number;
  created_at: string;
  updated_at: string;
}

// 学生类型定义。
export interface Student {
  id: number;
  name: string;
  student_no: string;
  class_name: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  course_ids: number[];
  enrolledCourses?: Course[];
  created_at: string;
  updated_at: string;
}

// 仪表盘数据类型定义。
export interface DashboardData {
  stats: {
    totalCourses: number;
    publishedCourses: number;
    totalStudents: number;
    activeStudents: number;
  };
  charts: {
    enrollment: Array<{ name: string; value: number }>;
    activity: Array<{ date: string; label: string; students: number; duration: number }>;
    statusDist: Array<{ name: string; value: number }>;
    categoryDist: Array<{ name: string; value: number }>;
  };
}

// ---------------- Auth 模块接口 ----------------
export const authApi = {
  // 登录接口。
  login: (username: string, password: string) =>
    api.post<any, ApiResponse<{ token: string; user: User }>>('/auth/login', { username, password }),

  // 获取当前登录用户信息。
  getMe: () =>
    api.get<any, ApiResponse<User>>('/auth/me'),
};

// ---------------- Dashboard 模块接口 ----------------
export const dashboardApi = {
  getDashboard: () =>
    api.get<any, ApiResponse<DashboardData>>('/dashboard'),
};

// ---------------- Courses 模块接口 ----------------
export const coursesApi = {
  getCourses: (params: any) =>
    api.get<any, ApiResponse<{ list: Course[]; total: number; page: number; pageSize: number }>>('/courses', { params }),
  getCategories: () =>
    api.get<any, ApiResponse<string[]>>('/courses/categories'),
  getCourse: (id: number) =>
    api.get<any, ApiResponse<Course>>(`/courses/${id}`),
  createCourse: (data: Partial<Course>) =>
    api.post<any, ApiResponse<Course>>('/courses', data),
  updateCourse: (id: number, data: Partial<Course>) =>
    api.put<any, ApiResponse<Course>>(`/courses/${id}`, data),
  deleteCourse: (id: number) =>
    api.delete<any, ApiResponse<null>>(`/courses/${id}`),
  toggleCourseStatus: (id: number) =>
    api.patch<any, ApiResponse<Course>>(`/courses/${id}/status`),
};

// ---------------- Students 模块接口 ----------------
export const studentsApi = {
  getStudents: (params: any) =>
    api.get<any, ApiResponse<{ list: Student[]; total: number; page: number; pageSize: number }>>('/students', { params }),
  getClasses: () =>
    api.get<any, ApiResponse<string[]>>('/students/classes'),
  getStudent: (id: number) =>
    api.get<any, ApiResponse<Student>>(`/students/${id}`),
  createStudent: (data: Partial<Student>) =>
    api.post<any, ApiResponse<Student>>('/students', data),
  updateStudent: (id: number, data: Partial<Student>) =>
    api.put<any, ApiResponse<Student>>(`/students/${id}`, data),
  deleteStudent: (id: number) =>
    api.delete<any, ApiResponse<null>>(`/students/${id}`),
};

// ---------------- Summary 模块接口 ----------------
export const summaryApi = {
  getSummary: () =>
    api.get<any, ApiResponse<{ content: string }>>('/summary'),
};

export default api;
