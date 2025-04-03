// src/config/api.ts
import axios from 'axios';

// In production, API calls will be made to the Heroku backend
// In development, we use Vite's proxy
const API_BASE_URL = 'https://energy-audit-store-e66479ed4f2b.herokuapp.com';

// Create an axios instance for API requests
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const API_ENDPOINTS = {
  AUTH: {
    SIGNIN: '/api/auth/signin',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile',
    REFRESH: '/api/auth/refresh'
  },
  ADMIN: {
    LOGIN: '/api/admin/login',
    LOGOUT: '/api/admin/logout',
    STATUS: '/api/admin/status',
    ANALYTICS_METRICS: '/api/admin/analytics/metrics',
    ANALYTICS_SESSIONS: '/api/admin/analytics/sessions',
    SESSION_EVENTS: (sessionId: string) => `/api/admin/analytics/sessions/${sessionId}/events`
  },
  EMAIL: {
    VERIFY: '/api/email/verify',
    SEND_VERIFICATION: '/api/email/send-verification'
  },
  PRODUCTS: '/api/products',
  ENERGY_AUDIT: '/api/energy-audit',
  AUDIT_HISTORY: '/api/energy-audit/history',
  REPORT_DATA: (auditId: string) => `/api/energy-audit/${auditId}/report-data`,
  DASHBOARD: {
    STATS: '/api/dashboard/stats',
    PRODUCT_HISTORY: '/api/dashboard/product-history',
    AUDIT_STATS: (auditId: string) => `/api/dashboard/audit-stats/${auditId}`
  },
  SETTINGS: {
    PROPERTY: '/api/settings/property',
    WINDOWS: '/api/settings/property/windows',
    WEATHERIZATION: '/api/settings/property/weatherization'
  },
  USER_PROFILE: '/api/user-profile',
  RECOMMENDATIONS: {
    UPDATE_STATUS: (id: string) => `/api/recommendations/${id}/status`,
    UPDATE_SAVINGS: (id: string) => `/api/recommendations/${id}/savings`,
    UPDATE_PRIORITY: (id: string) => `/api/recommendations/${id}/priority`,
    UPDATE_DETAILS: (id: string) => `/api/recommendations/${id}/implementation-details`,
    GET_PRODUCT_DETAIL: (id: string) => `/api/recommendations/products/${id}`
  },
  COMPARISONS: {
    BASE: '/api/comparisons',
    GET_BY_ID: (id: string) => `/api/comparisons/${id}`,
    ANALYZE: '/api/comparisons/analyze'
  }
} as const;

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

export { API_BASE_URL, api };
