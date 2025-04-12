import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_ENDPOINTS, getApiUrl } from '@/config/api';
import { User } from '@/types/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  lastVerified: number | null;
  user: User | null;
  initialCheckDone: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Prevent token refresh recursion
let isRefreshing = false;

// Constants
const AUTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
const AUTH_PERSIST_KEY = 'auth-state';

// Load persisted auth state from localStorage
const loadPersistedAuthState = (): AuthState => {
  try {
    const saved = localStorage.getItem(AUTH_PERSIST_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Only restore if not too old (e.g., within last 24 hours)
      if (parsed.lastVerified && Date.now() - parsed.lastVerified < 24*60*60*1000) {
        console.log('Restored auth state from localStorage');
        return {
          ...parsed,
          isLoading: true, // Still need to verify
          initialCheckDone: false
        };
      }
    }
  } catch (e) {
    console.error('Failed to parse persisted auth state', e);
  }
  
  return {
    isAuthenticated: false,
    isLoading: true,
    lastVerified: null,
    user: null,
    initialCheckDone: false
  };
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(loadPersistedAuthState());
  const navigate = useNavigate();
  const location = useLocation();

  const fetchWithRetry = async (endpoint: string, options: RequestInit, maxRetries = 3) => {
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount < maxRetries) {
      try {
        const response = await fetch(getApiUrl(endpoint), {
          ...options,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          }
        });
        
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCount++;
          continue;
        }

        return response;
      } catch (error) {
        lastError = error as Error;
        if (retryCount === maxRetries - 1) throw error;
        
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        retryCount++;
      }
    }

    throw lastError || new Error('Max retries exceeded');
  };

  const refreshToken = async () => {
    if (isRefreshing) return false;
    isRefreshing = true;

    try {
      console.log('Attempting token refresh');
      const refreshResponse = await fetchWithRetry(
        API_ENDPOINTS.AUTH.REFRESH,
        {
          method: 'POST',
        }
      );

      if (!refreshResponse.ok) {
        throw new Error('Token refresh failed');
      }

      console.log('Token refresh successful');
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    } finally {
      isRefreshing = false;
    }
  };

  const checkAuthStatus = useCallback(async (force: boolean = false) => {
    console.log('Checking auth status:', {
      force,
      currentState: {
        isLoading: authState.isLoading,
        lastVerified: authState.lastVerified,
        initialCheckDone: authState.initialCheckDone,
        timeSinceLastVerification: authState.lastVerified ? Date.now() - authState.lastVerified : null
      }
    });

    // Skip check if recently verified (within last 5 minutes) unless forced
    if (!force && authState.lastVerified && Date.now() - authState.lastVerified < AUTH_CHECK_INTERVAL) {
      console.log('Skipping auth check - recently verified');
      return;
    }

    // Don't set loading state if this is a periodic check
    if (!authState.initialCheckDone || force) {
      setAuthState(prev => ({ ...prev, isLoading: true }));
    }

    console.log('Starting auth check');

    try {
      const response = await fetchWithRetry(
        API_ENDPOINTS.AUTH.PROFILE,
        {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Profile fetch failed with 401, attempting token refresh');
          const refreshed = await refreshToken();
          if (refreshed) {
            console.log('Token refreshed, retrying profile fetch');
            const retryResponse = await fetchWithRetry(
              API_ENDPOINTS.AUTH.PROFILE,
              {
                method: 'GET',
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
                }
              }
            );

            if (retryResponse.ok) {
              try {
                const responseText = await retryResponse.text();
                console.log('Raw profile response after refresh:', responseText);
                
                if (responseText && responseText.trim()) {
                  const userData = JSON.parse(responseText);
                  console.log('Profile data after refresh:', userData);
                  
                  setAuthState({
                    isAuthenticated: true,
                    isLoading: false,
                    lastVerified: Date.now(),
                    user: userData,
                    initialCheckDone: true
                  });
                  return;
                }
              } catch (parseError) {
                console.error('Error parsing profile response:', parseError);
              }
            }
          }
        }
        throw new Error('Failed to fetch user profile');
      }

      // Get the raw text first, then parse it
      const responseText = await response.text();
      console.log('Raw profile response:', responseText);
      
      if (responseText && responseText.trim()) {
        try {
          const userData = JSON.parse(responseText);
          console.log('Profile data:', userData);
          
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            lastVerified: Date.now(),
            user: userData,
            initialCheckDone: true
          });
        } catch (parseError) {
          console.error('Error parsing profile JSON:', parseError);
          throw new Error('Failed to parse profile data');
        }
      } else {
        console.warn('Empty profile response');
        throw new Error('Empty profile response');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        lastVerified: Date.now(),
        user: null,
        initialCheckDone: true
      });
    }
  }, [authState.isLoading, authState.lastVerified, authState.initialCheckDone]);

  // Persist auth state to localStorage whenever it changes
  useEffect(() => {
    if (authState.initialCheckDone) {
      console.log('Persisting auth state to localStorage');
      localStorage.setItem(AUTH_PERSIST_KEY, JSON.stringify({
        isAuthenticated: authState.isAuthenticated,
        isLoading: false,
        lastVerified: authState.lastVerified,
        user: authState.user,
        initialCheckDone: true
      }));
    }
  }, [authState]);

  // Initial auth check on mount
  useEffect(() => {
    console.log('Initial auth check on mount');
    checkAuthStatus(true);
  }, [checkAuthStatus]);

  // Periodic auth check
  useEffect(() => {
    if (!authState.initialCheckDone) return;

    console.log('Setting up periodic auth check');
    const interval = setInterval(() => {
      checkAuthStatus();
    }, AUTH_CHECK_INTERVAL);

    return () => {
      console.log('Cleaning up periodic auth check');
      clearInterval(interval);
    };
  }, [checkAuthStatus, authState.initialCheckDone]);

  const login = async (userData: User) => {
    console.log('Login called with user data:', userData);
    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      lastVerified: Date.now(),
      user: userData,
      initialCheckDone: true
    });
    
    // Store the attempted URL if it exists
    const attemptedUrl = sessionStorage.getItem('attemptedUrl');
    if (attemptedUrl) {
      console.log('Redirecting to attempted URL:', attemptedUrl);
      sessionStorage.removeItem('attemptedUrl');
      navigate(attemptedUrl);
    } else {
      console.log('Redirecting to dashboard');
      navigate('/dashboard');
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out');
      await fetchWithRetry(
        API_ENDPOINTS.AUTH.LOGOUT,
        {
          method: 'POST',
        }
      );
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        lastVerified: null,
        user: null,
        initialCheckDone: true
      });
      navigate('/sign-in');
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated: authState.isAuthenticated,
        isLoading: authState.isLoading,
        user: authState.user,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider };
export default useAuth;