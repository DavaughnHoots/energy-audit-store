import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Default API URL based on environment - can be overridden in environment variables
const API_URL = import.meta.env.VITE_API_URL || 
                process.env.VITE_API_URL || 
                'https://energy-audit-store.herokuapp.com/api';

// Check if the cookieUtils module is available
let syncAuthTokens: (() => void) | undefined;
let getCookie: ((name: string) => string | null) | undefined;

try {
  // Try to dynamically import cookieUtils functions if they exist
  const cookieUtils = require('../utils/cookieUtils');
  syncAuthTokens = cookieUtils.syncAuthTokens;
  getCookie = cookieUtils.getCookie;
} catch (e) {
  // If cookieUtils is not available, provide fallback implementations
  console.log('Cookie utils not available, using fallbacks');
  syncAuthTokens = () => {};
  getCookie = () => null;
}

/**
 * Axios instance configured for API requests
 * This instance handles auth tokens and common headers
 */
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookie/session auth
});

// Request interceptor to add auth token if available
axiosInstance.interceptors.request.use(
  (config) => {
    // Sync tokens from cookies if that functionality exists
    if (syncAuthTokens) {
      syncAuthTokens();
    }
    
    // Get token from localStorage if available
    let token = localStorage.getItem('accessToken');
    
    // If no token in localStorage but getCookie is available, try cookies
    if (!token && getCookie) {
      token = getCookie('accessToken');
      if (token) {
        localStorage.setItem('accessToken', token);
      }
    }
    
    // Add authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 Unauthorized errors by refreshing token or redirecting to login
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          // Call token refresh endpoint
          const response = await axios.post(`${API_URL}/auth/refresh`, { 
            refreshToken 
          });
          
          // If refresh successful, update tokens
          if (response.data?.accessToken) {
            localStorage.setItem('accessToken', response.data.accessToken);
            
            if (response.data.refreshToken) {
              localStorage.setItem('refreshToken', response.data.refreshToken);
            }
            
            // Update auth header with new token
            axiosInstance.defaults.headers.common.Authorization = `Bearer ${response.data.accessToken}`;
            originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
            
            // Retry the original request
            return axiosInstance(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
      
      // If refresh failed or no refresh token, redirect to login
      if (typeof window !== 'undefined') {
        console.log('Auth failed, redirecting to login');
        // Optional: Store the current URL to redirect back after login
        localStorage.setItem('authRedirect', window.location.pathname);
        window.location.href = '/sign-in';
      }
    }
    
    return Promise.reject(error);
  }
);

// Type for API response
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: any[];
}

// Export API client methods
export const apiClient = {
  /**
   * Make a GET request
   */
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    try {
      return await axiosInstance.get<T>(url, config);
    } catch (error) {
      console.error(`GET request failed to ${url}:`, error);
      throw error;
    }
  },
  
  /**
   * Make a POST request
   */
  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    try {
      return await axiosInstance.post<T>(url, data, config);
    } catch (error) {
      console.error(`POST request failed to ${url}:`, error);
      throw error;
    }
  },
  
  /**
   * Make a PUT request
   */
  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    try {
      return await axiosInstance.put<T>(url, data, config);
    } catch (error) {
      console.error(`PUT request failed to ${url}:`, error);
      throw error;
    }
  },
  
  /**
   * Make a DELETE request
   */
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    try {
      return await axiosInstance.delete<T>(url, config);
    } catch (error) {
      console.error(`DELETE request failed to ${url}:`, error);
      throw error;
    }
  },
  
  /**
   * Check if the error is a network error
   */
  isNetworkError: (error: any): boolean => {
    return axios.isAxiosError(error) && !error.response;
  },
  
  /**
   * Check if the error is a 401 (Unauthorized) error
   */
  isUnauthorizedError: (error: any): boolean => {
    return axios.isAxiosError(error) && error.response?.status === 401;
  },
  
  /**
   * Get error message from error object (formatted for display)
   */
  getErrorMessage: (error: any): string => {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        return 'Network error. Please check your internet connection.';
      }
      
      // Handle structured error responses from our API
      if (error.response.data) {
        if (error.response.data.message) {
          return error.response.data.message;
        }
        
        if (error.response.data.error) {
          return error.response.data.error;
        }
        
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          return error.response.data.errors.map((e: any) => e.message || e).join(', ');
        }
      }
      
      // Fall back to HTTP status text
      return error.response.statusText || 'An error occurred';
    }
    
    // For non-Axios errors
    return error.message || 'An unknown error occurred';
  }
};

export default apiClient;
