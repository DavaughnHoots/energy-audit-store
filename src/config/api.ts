// src/config/api.ts

// Base URL will be relative since we're using Vite's proxy
const API_BASE_URL = '';

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
    ENERGY: '/api/settings/energy'
  }
} as const;

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

export { API_BASE_URL };
