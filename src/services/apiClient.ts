import axios from 'axios';

// Default API URL based on environment - can be overridden in environment variables
const API_URL = import.meta.env.VITE_API_URL || 
                process.env.VITE_API_URL || 
                'https://energy-audit-store.herokuapp.com/api';

/**
 * Axios instance configured for API requests
 * This instance handles auth tokens and common headers
 */
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookie/session auth
});

// Request interceptor to add auth token if available
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage if available
    const token = localStorage.getItem('accessToken');
    
    // Add authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 Unauthorized errors by refreshing token or redirecting to login
apiClient.interceptors.response.use(
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
            originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
            
            // Retry the original request
            return apiClient(originalRequest);
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

export default apiClient;