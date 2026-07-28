import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const res = await api.post('/auth/refresh', { refreshToken });
          localStorage.setItem('token', res.data.accessToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  googleAuth: (code: string) => api.post('/auth/google', { code }),
  githubAuth: (code: string) => api.post('/auth/github', { code }),
  getMe: () => api.get('/auth/me'),
  refreshToken: (token: string) => api.post('/auth/refresh', { refreshToken: token }),
};

export const coursesAPI = {
  getAll: (category?: string) => api.get('/courses', { params: { category } }),
  getBySlug: (slug: string) => api.get(`/courses/${slug}`),
};

export const certificationsAPI = {
  getAll: (params?: { search?: string; provider?: string; page?: number; limit?: number }) =>
    api.get('/certifications', { params }),
  submitInquiry: (data: any) => api.post('/certifications/inquire', data),
};

export const internshipsAPI = {
  getAll: () => api.get('/internships'),
  apply: (data: any) => api.post('/internships/apply', data),
};

export const upcomingAPI = {
  getAll: () => api.get('/upcoming-batches'),
};

export const corporateAPI = {
  getAll: () => api.get('/corporate'),
  inquire: (data: any) => api.post('/corporate/inquire', data),
};

export default api;
