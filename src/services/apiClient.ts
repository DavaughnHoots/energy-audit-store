import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getCookie, syncAuthTokens } from '../utils/cookieUtils';

/**
 * Base API client for making HTTP requests to the backend
 * Handles common concerns like authentication headers, base URL, error handling
 */

// Get API URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach authentication token
axiosInstance.interceptors.request.use((config) => {
  // First try to sync cookies to localStorage (only if needed)
  syncAuthTokens();
  
  // Get token from local storage
  let token = localStorage.getItem('accessToken');
  
  // If no token in localStorage, try to get from cookies as fallback
  if (!token) {
    token = getCookie('accessToken');
    if (token) {
      // Save to localStorage for future requests
      localStorage.setItem('accessToken', token);
      console.log('Retrieved accessToken from cookies and saved to localStorage');
    }
  }
  
  // If token exists, add it to the Authorization header
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Check if the error is due to an expired token (status 401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { 
            refreshToken 
          });
          
          if (response.data.accessToken) {
            // Save new tokens
            localStorage.setItem('accessToken', response.data.accessToken);
            if (response.data.refreshToken) {
              localStorage.setItem('refreshToken', response.data.refreshToken);
            }
            
            // Update the Authorization header with the new token
            axiosInstance.defaults.headers.common.Authorization = `Bearer ${response.data.accessToken}`;
            
            // Retry the original request with the new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
            }
            return axiosInstance(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        
        // If token refresh fails, redirect to login page
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Check if we're in a browser environment before redirecting
        if (typeof window !== 'undefined') {
          window.location.href = '/login?session=expired';
        }
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
