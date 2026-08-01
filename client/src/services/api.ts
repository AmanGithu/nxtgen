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
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const res = await axios.post('http://localhost:3001/api/auth/refresh', { refreshToken });
          if (res.data?.accessToken) {
            localStorage.setItem('token', res.data.accessToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`;
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
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

export const iAssistAPI = {
  getAssistants: () => api.get('/iassist/assistants'),
  createAssistant: (data: any) => api.post('/iassist/assistants', data),
  updateAssistant: (id: string, data: any) => api.put(`/iassist/assistants/${id}`, data),
  deleteAssistant: (id: string) => api.delete(`/iassist/assistants/${id}`),
  addMaterial: (assistantId: string, data: any) => api.post(`/iassist/assistants/${assistantId}/materials`, data),
  removeMaterial: (assistantId: string, materialId: string) => api.delete(`/iassist/assistants/${assistantId}/materials/${materialId}`),

  getDocuments: (search?: string) => api.get('/iassist/documents', { params: { search } }),
  getDocument: (id: string) => api.get(`/iassist/documents/${id}`),
  uploadDocument: (formData: FormData) => api.post('/iassist/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  createDocument: (data: any) => api.post('/iassist/documents', data),
  deleteDocument: (id: string) => api.delete(`/iassist/documents/${id}`),

  getSessions: (period?: string) => api.get('/iassist/sessions', { params: { period } }),
  getSession: (id: string) => api.get(`/iassist/sessions/${id}`),
};

export default api;
