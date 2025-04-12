import React, { createContext, useContext, useState, useEffect } from 'react';
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

// Constants
const AUTH_CHECK_INTERVAL = 10 * 60 * 1000; // Increased to 10 minutes
const AUTH_PERSIST_KEY = 'auth-state';

// Prevent too frequent auth checks
let lastAuthCheck = 0;
let isRefreshing = false;
let isCheckingAuth = false;

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
  
  // Avoid too many updates
  const safeSetAuthState = (newState: Partial<AuthState>) => {
    setAuthState(prev => {
      // Don't update if nothing changed
      if (Object.entries(newState).every(([key, value]) => 
        prev[key as keyof AuthState] === value)
      ) {
        return prev;
      }
      return { ...prev, ...newState };
    });
  };
  
  const fetchWithRetry = async (endpoint: string, options: RequestInit, maxRetries = 3) => {
    let retryCount = 0;

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
        if (retryCount === maxRetries - 1) throw error;
        
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        retryCount++;
      }
    }

    throw new Error('Max retries exceeded');
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

  const checkAuthStatus = async (force: boolean = false) => {
    // Prevent overlapping auth checks
    if (isCheckingAuth) {
      console.log('Auth check already in progress, skipping');
      return;
    }
    
    // Rate limit auth checks
    const now = Date.now();
    if (!force && now - lastAuthCheck < 10000) {
      console.log('Auth check too frequent, skipping');
      return;
    }
    
    lastAuthCheck = now;
    isCheckingAuth = true;
    
    // Skip check if recently verified
    if (!force && authState.lastVerified && now - authState.lastVerified < AUTH_CHECK_INTERVAL) {
      console.log('Skipping auth check - recently verified');
      isCheckingAuth = false;
      return;
    }

    // Only set loading if this is the initial check
    if (!authState.initialCheckDone) {
      safeSetAuthState({ isLoading: true });
    }

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
          const refreshed = await refreshToken();
          if (refreshed) {
            const retryResponse = await fetchWithRetry(
              API_ENDPOINTS.AUTH.PROFILE,
              {
                method: 'GET',
                headers: {
                  'Cache-Control': 'no-cache',
                }
              }
            );

            if (retryResponse.ok) {
              try {
                const text = await retryResponse.text();
                const userData = JSON.parse(text);
                safeSetAuthState({
                  isAuthenticated: true,
                  isLoading: false,
                  lastVerified: now,
                  user: userData,
                  initialCheckDone: true
                });
                isCheckingAuth = false;
                return;
              } catch (e) {
                console.error('Error parsing retried profile response', e);
              }
            }
          }
        }
        throw new Error('Failed to fetch profile');
      }

      try {
        const text = await response.text();
        const userData = JSON.parse(text);
        safeSetAuthState({
          isAuthenticated: true,
          isLoading: false,
          lastVerified: now,
          user: userData,
          initialCheckDone: true
        });
      } catch (e) {
        console.error('Error parsing profile response', e);
        throw new Error('Failed to parse profile data');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      safeSetAuthState({
        isAuthenticated: false,
        isLoading: false,
        lastVerified: now,
        user: null,
        initialCheckDone: true
      });
    } finally {
      isCheckingAuth = false;
    }
  };

  // Persist auth state to localStorage
  useEffect(() => {
    if (authState.initialCheckDone) {
      localStorage.setItem(AUTH_PERSIST_KEY, JSON.stringify({
        isAuthenticated: authState.isAuthenticated,
        isLoading: false,
        lastVerified: authState.lastVerified,
        user: authState.user,
        initialCheckDone: true
      }));
    }
  }, [authState]);

  // One-time auth check on mount
  useEffect(() => {
    // Add significant delay to break render cycles
    const timer = setTimeout(() => {
      checkAuthStatus(true);
    }, 500); // Increased to 500ms
    
    return () => clearTimeout(timer);
  }, []); // Empty dependency array, run once on mount

  // Periodic auth check with much higher interval
  useEffect(() => {
    if (!authState.initialCheckDone) return;

    const interval = setInterval(() => {
      checkAuthStatus(false);
    }, AUTH_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [authState.initialCheckDone]);

  const login = async (userData: User) => {
    console.log('Login called with user data:', userData);
    safeSetAuthState({
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
      safeSetAuthState({
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