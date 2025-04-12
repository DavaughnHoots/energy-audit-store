import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Add global window property for auth check locking
declare global {
  interface Window {
    checkingAuthStatus?: boolean;
    authCheckCounter?: number;
  }
}
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
        console.error('Auth check failed:', error);
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          lastVerified: Date.now(),
          user: null,
          initialCheckDone: true
        });
      } finally {
        // Release the lock
        window.checkingAuthStatus = false;
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
  }, []);

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
