import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization Bearer token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hrms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// API Helper Endpoints
export const authApi = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  register: (credentials: any) => api.post('/auth/register', credentials),
  getMe: () => api.get('/auth/me'),
  getDemoAccounts: () => api.get('/auth/demo-accounts'),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

export const employeeApi = {
  getAll: (params?: any) => api.get('/employees', { params }),
  getById: (id: string) => api.get(`/employees/${id}`),
  create: (data: any) => api.post('/employees', data),
  update: (id: string, data: any) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
};

export const departmentApi = {
  getDepartments: () => api.get('/departments'),
  createDepartment: (data: any) => api.post('/departments', data),
  updateDepartment: (id: string, data: any) => api.put(`/departments/${id}`, data),
  deleteDepartment: (id: string) => api.delete(`/departments/${id}`),
  getPositions: (params?: any) => api.get('/positions', { params }),
  createPosition: (data: any) => api.post('/positions', data),
};

export const attendanceApi = {
  getLogs: (params?: any) => api.get('/attendance', { params }),
  clockIn: () => api.post('/attendance/clock-in'),
  clockOut: () => api.post('/attendance/clock-out'),
};

export const leaveApi = {
  getTypes: () => api.get('/leave/types'),
  getRequests: (params?: any) => api.get('/leave/requests', { params }),
  getBalances: (employeeId?: string) => api.get('/leave/balances', { params: { employeeId } }),
  requestLeave: (data: any) => api.post('/leave/requests', data),
  updateStatus: (id: string, data: any) => api.put(`/leave/requests/${id}/status`, data),
};

export const payrollApi = {
  getPayrolls: () => api.get('/payroll'),
  runPayroll: (data: any) => api.post('/payroll/run', data),
  getPayslips: (params?: any) => api.get('/payslips', { params }),
  markPaid: (id: string) => api.put(`/payslips/${id}/pay`),
};

export const workReportApi = {
  getAll: () => api.get('/work-reports'),
  submit: (data: any) => api.post('/work-reports', data),
  updateStatus: (id: string, data: any) => api.put(`/work-reports/${id}/status`, data),
};

export const recruitmentApi = {
  getJobs: (params?: any) => api.get('/jobs', { params }),
  createJob: (data: any) => api.post('/jobs', data),
  getCandidates: (params?: any) => api.get('/candidates', { params }),
  updateStage: (id: string, data: any) => api.put(`/candidates/${id}/stage`, data),
  scheduleInterview: (data: any) => api.post('/interviews', data),
};

export const performanceApi = {
  getReviews: (params?: any) => api.get('/performance/reviews', { params }),
  createReview: (data: any) => api.post('/performance/reviews', data),
  getGoals: (params?: any) => api.get('/performance/goals', { params }),
  createGoal: (data: any) => api.post('/performance/goals', data),
  updateGoalProgress: (id: string, data: any) => api.put(`/performance/goals/${id}/progress`, data),
};
