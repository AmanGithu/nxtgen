import axios from 'axios';

// Falls back to a relative path so the Vite dev proxy (and same-origin
// deployments) work even when VITE_API_URL is unset.
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
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

    /* A plan limit is a product moment, not a failure. Raise it once here so
       every call site gets the upgrade prompt instead of each one having to
       tell "blocked by plan" apart from "request failed" — which is how a
       limit ended up surfacing as a generic error toast. */
    if (error.response?.status === 402 && error.response?.data?.code === 'LIMIT_REACHED') {
      window.dispatchEvent(
        new CustomEvent('nxtgen:limit-reached', { detail: error.response.data })
      );
    }
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
          // Bare axios (not `api`) so this request skips the interceptor and
          // cannot recurse if the refresh itself 401s.
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
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

/** Public site configuration — admin-editable nav and hero banners. */
export const siteAPI = {
  getMenu: () => api.get('/site/menu'),
  getBanners: () => api.get('/site/banners'),
};

export const adminMenuAPI = {
  getAll: () => api.get('/admin/menu'),
  create: (data: any) => api.post('/admin/menu', data),
  update: (id: string, data: any) => api.patch(`/admin/menu/${id}`, data),
  remove: (id: string) => api.delete(`/admin/menu/${id}`),
};

export const adminBannersAPI = {
  getAll: () => api.get('/admin/banners'),
  create: (data: any) => api.post('/admin/banners', data),
  update: (id: string, data: any) => api.patch(`/admin/banners/${id}`, data),
  remove: (id: string) => api.delete(`/admin/banners/${id}`),
};

export const adminTemplatesAPI = {
  getAll: () => api.get('/admin/templates'),
  create: (data: any) => api.post('/admin/templates', data),
  update: (id: string, data: any) => api.patch(`/admin/templates/${id}`, data),
  deactivate: (id: string) => api.delete(`/admin/templates/${id}`),
};

export const adminLogsAPI = {
  getAll: () => api.get('/admin/logs'),
  getToolUsage: (params?: { toolName?: string; page?: number; limit?: number }) =>
    api.get('/admin/tool-usage', { params }),
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
  updateDocument: (id: string, data: any) => api.patch(`/iassist/documents/${id}`, data),
  deleteDocument: (id: string) => api.delete(`/iassist/documents/${id}`),

  getAnalytics: () => api.get('/iassist/analytics'),
  getSessions: (period?: string) => api.get('/iassist/sessions', { params: { period } }),
  getSession: (id: string) => api.get(`/iassist/sessions/${id}`),

  authorizeDesktop: (state: string) => api.post('/iassist/desktop/authorize', { state }),
};

export default api;

export const adminInternshipsAPI = {
  getAll: () => api.get('/admin/internships'),
  create: (data: any) => api.post('/admin/internships', data),
  update: (id: string, data: any) => api.patch(`/admin/internships/${id}`, data),
  deactivate: (id: string) => api.delete(`/admin/internships/${id}`),
};

export const adminCorporateAPI = {
  getAll: () => api.get('/admin/corporate'),
  add: (data: any) => api.post('/admin/corporate', data),
  update: (id: string, data: any) => api.patch(`/admin/corporate/${id}`, data),
  remove: (id: string) => api.delete(`/admin/corporate/${id}`),
};

export const adminCoursesAPI = {
  getAll: () => api.get('/admin/courses'),
  create: (data: any) => api.post('/admin/courses', data),
  update: (id: string, data: any) => api.patch(`/admin/courses/${id}`, data),
  retire: (id: string) => api.delete(`/admin/courses/${id}`),
};
