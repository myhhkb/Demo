import axios, { AxiosInstance } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  avatar: string;
  created_at: string;
}

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

export interface DashboardData {
  stats: {
    totalCourses: number;
    publishedCourses: number;
    totalStudents: number;
    activeStudents: number;
  };
  charts: {
    enrollment: Array<{ name: string; value: number }>;
    activity: Array<{ date: string; label: string; students: number; activeStudents: number; duration: number }>;
    statusDist: Array<{ name: string; value: number }>;
    categoryDist: Array<{ name: string; value: number }>;
  };
}

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    api.post<any, ApiResponse<{ token: string; user: User }>>('/auth/login', { username, password }),
  getMe: () =>
    api.get<any, ApiResponse<User>>('/auth/me'),
};

// Dashboard
export const dashboardApi = {
  getDashboard: () =>
    api.get<any, ApiResponse<DashboardData>>('/dashboard'),
};

// Courses
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

// Students
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

// Summary
export const summaryApi = {
  getSummary: () =>
    api.get<any, ApiResponse<{ content: string }>>('/summary'),
};

export default api;
