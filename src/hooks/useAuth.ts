import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { syncAuthTokens } from '../utils/cookieUtils';
import { getTokenInfo, hasValidTokens } from '../services/tokenInfoService';

/**
 * User interface representing authenticated user information
 */
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Authentication hook to manage user authentication state
 * Provides current user info and authentication methods
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Helper function to recover a user profile from a token
   */
  const recoverUserProfileFromToken = async (token: string) => {
    console.log('Found access token but no user data, attempting profile recovery');
    try {
      const response = await apiClient.get<{ user: User }>('/auth/profile');
      if (response.data.user) {
        // Save the recovered user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        console.log('User profile recovered successfully');
      }
    } catch (profileError) {
      console.error('Error recovering user profile:', profileError);
      // If profile fetch fails, tokens might be invalid - clean up
      if (apiClient.isUnauthorizedError(profileError)) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
  };
  
  // Load user from localStorage or try to retrieve from API if tokens exist
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Sync cookies to localStorage if needed
        syncAuthTokens();
        
        // First try to load from localStorage
        const userJson = localStorage.getItem('user');
        const accessToken = localStorage.getItem('accessToken');
        
        if (userJson) {
          setUser(JSON.parse(userJson));
        } 
        // If we have a token but no user, try to retrieve the profile from API
        else if (accessToken) {
          await recoverUserProfileFromToken(accessToken);
        } 
        // Check if we have HttpOnly cookies with tokens
        else {
          const tokenInfo = await getTokenInfo();
          
          if (tokenInfo.hasAccessToken) {
            console.log('Found HttpOnly cookie token but no user data, attempting profile recovery');
            try {
              const response = await apiClient.get<{ user: User }>('/auth/profile');
              if (response.data.user) {
                // Save the recovered user data
                localStorage.setItem('user', JSON.stringify(response.data.user));
                setUser(response.data.user);
                console.log('User profile recovered successfully from HttpOnly cookies');
              }
            } catch (profileError) {
              console.error('Error recovering user profile from HttpOnly cookies:', profileError);
            }
          }
        }
      } catch (err) {
        console.error('Error loading user from localStorage:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);
  
  /**
   * Check if user is authenticated
   */
  const isAuthenticated = !!user;
  
  /**
   * Login user with email and password
   */
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', {
        email,
        password
      });
      
      // Save tokens and user
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      setUser(response.data.user);
      return true;
    } catch (err) {
      setError(apiClient.getErrorMessage(err) || 'Failed to login');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Register a new user
   */
  const register = useCallback(async (userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', userData);
      
      // Save tokens and user
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      setUser(response.data.user);
      return true;
    } catch (err) {
      setError(apiClient.getErrorMessage(err) || 'Failed to register');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Logout the current user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        // Try to invalidate token on server (ignore errors)
        await apiClient.post('/auth/logout', { refreshToken }).catch(() => {});
      }
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      // Clear local storage and state regardless of server response
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);
  
  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (profileData: Partial<User>): Promise<boolean> => {
    if (!user) {
      setError('Not authenticated');
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.put<{ user: User }>(`/api/user-profile/${user.id}`, profileData);
      
      // Update local storage and state
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return true;
    } catch (err) {
      setError(apiClient.getErrorMessage(err) || 'Failed to update profile');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback((role: string): boolean => {
    return user?.role === role;
  }, [user]);
  
  /**
   * Refresh user data from the server
   */
  const refreshUserData = useCallback(async (): Promise<boolean> => {
    if (!user) {
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get<{ user: User }>(`/api/user-profile/${user.id}`);
      
      // Update local storage and state
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return true;
    } catch (err) {
      console.error('Error refreshing user data:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    hasRole,
    refreshUserData
  };
}
