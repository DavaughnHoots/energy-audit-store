// src/config/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  AUTH: {
    SIGNIN: '/auth/signin',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    REFRESH: '/auth/refresh'
  },
  EMAIL: {
    VERIFY: '/email/verify',
    SEND_VERIFICATION: '/email/send-verification'
  },
  PRODUCTS: '/products',
  ENERGY_AUDIT: '/energy-audit'
} as const;
