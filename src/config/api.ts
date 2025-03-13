// src/config/api.ts

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
    STATS: '/api/dashboard/stats',
    PRODUCT_HISTORY: '/api/dashboard/product-history'
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

export { API_BASE_URL };
