let consecutive401 = 0; // Counter to prevent infinite refresh loops

import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getCookie, setCookie, syncAuthTokens } from '../utils/cookieUtils';

/**
 * Enhanced apiClient with improved cross-domain support
 * This implementation:
 * 1. Dynamically determines the API URL based on the current domain
 * 2. Properly handles authorization tokens across domains
 * 3. Provides improved error handling and retry mechanisms
 */

// Determine the appropriate API URL based on the current environment
const determineApiUrl = (): string => {
  // If URL is specified in environment variables, use that (highest priority)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // If running in browser, try to determine API URL based on current domain
  if (typeof window !== 'undefined') {
    const currentDomain = window.location.hostname;
    
    // Use relative URLs when on Heroku domain to avoid CORS issues
    if (currentDomain === 'energy-audit-store-e66479ed4f2b.herokuapp.com') {
      return '/api';
    }
    
    // If running on localhost, default to local API
    if (currentDomain === 'localhost') {
      return 'http://localhost:5000/api';
    }
  }
  
  // Default fallback (lowest priority)
  // Use the domain with the unique identifier
  return 'https://energy-audit-store-e66479ed4f2b.herokuapp.com/api';
};

// Get the API URL
const API_URL = determineApiUrl();
console.log(`Using API URL: ${API_URL}`);

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
    try {
      // Synchronize tokens between cookies and localStorage
      syncAuthTokens();
    } catch (error) {
      console.error('Error syncing auth tokens:', error);
    }
    
    // Get token from localStorage if available
    let token = localStorage.getItem('accessToken');
    
    // If no token in localStorage, try cookies
    if (!token) {
      try {
        token = getCookie('accessToken');
        if (token) {
          localStorage.setItem('accessToken', token);
          console.log('Retrieved access token from cookies and saved to localStorage');
        }
      } catch (error) {
        console.error('Error accessing cookies:', error);
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

// Implement exponential backoff for requests
const getRetryDelay = (retryCount: number): number => {
  return Math.min(100 * Math.pow(2, retryCount), 5000); // Max 5 seconds delay
};

// Handle 401 Unauthorized errors by refreshing token or redirecting to login
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Network errors (e.g., CORS issues) should be handled specially
    if (error.message === 'Network Error') {
      console.error('Network error detected (possibly CORS):', error);
      return Promise.reject({
        ...error,
        isNetworkError: true,
        possibleCorsIssue: true,
        userMessage: 'Unable to connect to the server. This may be due to a connection issue.'
      });
    }
    
    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          // Call token refresh endpoint
          const response = await axios.post(`${API_URL}/auth/refresh-token`, { 
            refreshToken 
          });
          
          // If refresh successful, update tokens
          if (response.data?.accessToken) {
            // Update both localStorage and cookies
            localStorage.setItem('accessToken', response.data.accessToken);
            setCookie('accessToken', response.data.accessToken, { maxAge: 15 * 60 }); // 15 minutes
            
            if (response.data.refreshToken) {
              localStorage.setItem('refreshToken', response.data.refreshToken);
              setCookie('refreshToken', response.data.refreshToken, { maxAge: 7 * 24 * 60 * 60 }); // 7 days
            }
            
            console.log('Updated tokens in both localStorage and cookies during refresh');
            
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
        // Store the current URL to redirect back after login
        localStorage.setItem('authRedirect', window.location.pathname);
        window.location.href = '/sign-in';
      }
    }
    
    // For server errors (5xx), implement retry with exponential backoff
    if (error.response?.status >= 500 && error.response?.status < 600) {
      originalRequest._retryCount = originalRequest._retryCount || 0;
      
      if (originalRequest._retryCount < 3) { // Max 3 retries
        originalRequest._retryCount++;
        
        // Wait with exponential backoff
        const delay = getRetryDelay(originalRequest._retryCount);
        console.log(`Retrying request after ${delay}ms (attempt ${originalRequest._retryCount})`);
        
        return new Promise(resolve => {
          setTimeout(() => resolve(axiosInstance(originalRequest)), delay);
        });
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
      // For requests that may be affected by CORS/caching issues
      if (url.includes('/token-info')) {
        // Add cache busting to prevent 304 responses
        const cacheBustingConfig = {
          ...config,
          headers: {
            ...config?.headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'If-None-Match': ''
          },
          params: {
            ...config?.params,
            _t: Date.now() // Add timestamp to bust cache
          }
        };
        return await axiosInstance.get<T>(url, cacheBustingConfig);
      }
      
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
   * Check if the error might be related to CORS
   */
  isPossibleCorsError: (error: any): boolean => {
    return error.message === 'Network Error' || error.possibleCorsIssue === true;
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
    // Check for our enhanced network error
    if (error.possibleCorsIssue) {
      return 'Unable to connect to the server. This may be a CORS issue.';
    }
    
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
