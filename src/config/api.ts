// src/config/api.ts
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// In production, API calls will be made to the Heroku backend
// In development, we use Vite's proxy
const API_BASE_URL = 'https://energy-audit-store-e66479ed4f2b.herokuapp.com';

export const API_ENDPOINTS = {
  AUTH: {
    SIGNIN: '/api/auth/signin',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile',
    REFRESH: '/api/auth/refresh'
  },
  EMAIL: {
    VERIFY: '/api/email/verify',
    SEND_VERIFICATION: '/api/email/send-verification'
  },
  PRODUCTS: '/api/products',
  ENERGY_AUDIT: '/api/energy-audit',
  DASHBOARD: {
    STATS: '/api/dashboard/stats'
  },
  SETTINGS: {
    PROPERTY: '/api/settings/property',
    WINDOWS: '/api/settings/property/windows',
    WEATHERIZATION: '/api/settings/property/weatherization'
  },
  USER_PROFILE: '/api/user-profile',
  RECOMMENDATIONS: {
    UPDATE_STATUS: (id: string) => `/api/recommendations/${id}/status`,
    UPDATE_SAVINGS: (id: string) => `/api/recommendations/${id}/savings`
  }
} as const;

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // Handle token refresh or other error handling here
    if (error.response?.status === 401) {
      // Handle unauthorized error
      // Could redirect to login or attempt token refresh
      console.error('Unauthorized request:', error);
    }
    return Promise.reject(error);
  }
);

export { API_BASE_URL };
