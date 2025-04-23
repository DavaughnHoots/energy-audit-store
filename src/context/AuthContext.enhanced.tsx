import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCookie, setCookie, removeCookie, syncAuthTokens, resetAuthState, isValidToken } from '@/utils/cookieUtils.enhanced';

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
  resetAuth: () => void; // New method for emergency auth reset
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

  // Enhanced token refresh with better storage verification
  const refreshToken = async () => {
    if (isRefreshing) return false;
    isRefreshing = true;

    try {
      console.log('🔄 Attempting token refresh');
      const refreshResponse = await fetchWithRetry(
        API_ENDPOINTS.AUTH.REFRESH,
        {
          method: 'POST',
        }
      );

      if (!refreshResponse.ok) {
        console.error(`❌ Token refresh failed with status ${refreshResponse.status}`);
        throw new Error(`Token refresh failed with status ${refreshResponse.status}`);
      }
      
      // Parse the response to get the new tokens
      const data = await refreshResponse.json();
      console.log('Token refresh response structure:', Object.keys(data).join(', '));
      
      // Handle access token - check if token field exists and is valid
      let tokensStored = false;
      if (data?.token && isValidToken(data.token)) {
        const newAccessToken = data.token;
        console.log('✅ Received valid access token, storing it');
        
        // Try to set the cookie - synchronous operation
        const cookieSet = setCookie('accessToken', newAccessToken, { maxAge: 15 * 60 });
        
        // Also store in localStorage as backup
        try {
          localStorage.setItem('accessToken', newAccessToken);
          console.log('✅ Access token stored in localStorage');
          tokensStored = true;
        } catch (e) {
          console.error('❌ Failed to store access token in localStorage:', e);
        }
      } else {
        // Log what we received for debugging
        console.warn('⚠️ Invalid or missing token in refresh response');
      }
      
      // Handle refresh token - similarly with strict validation
      if (data?.refreshToken && isValidToken(data.refreshToken)) {
        console.log('✅ Received valid refresh token, storing it');
        const cookieSet = setCookie('refreshToken', data.refreshToken, { maxAge: 7 * 24 * 60 * 60 });
        
        // Also store in localStorage as backup
        try {
          localStorage.setItem('refreshToken', data.refreshToken);
          console.log('✅ Refresh token stored in localStorage');
          tokensStored = true;
        } catch (e) {
          console.error('❌ Failed to store refresh token in localStorage:', e);
        }
      } else {
        console.warn('⚠️ Invalid or missing refreshToken in refresh response');
      }
      
      // Force sync to ensure consistent state between cookies and localStorage
      console.log('🔄 Forcing token synchronization...');
      syncAuthTokens(true);
      
      // Verify we have valid tokens
      const verifiedAccessToken = getCookie('accessToken');
      const verifiedRefreshToken = getCookie('refreshToken');
      
      if (isValidToken(verifiedAccessToken) || isValidToken(verifiedRefreshToken)) {
        console.log('✅ Token refresh and verification successful');
        return true;
      } else {
        console.error('❌ Token refresh completed but no valid tokens available after sync');
        if (tokensStored) {
          console.log('🔄 Tokens exist in localStorage but not in cookies - possible cookie settings issue');
          return true; // Still return true as localStorage tokens might work
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return false;
    } finally {
      isRefreshing = false;
    }
  };

  const checkAuthStatus = async (force: boolean = false) => {
    // Prevent check if already in progress
    if (window.checkingAuthStatus) {
      console.log('Auth check already in progress, skipping');
      return;
    }
    
    window.checkingAuthStatus = true;
    
    // Add a debug counter to track how often this is called
    console.log('Auth check call count:', (window as any).authCheckCounter = ((window as any).authCheckCounter || 0) + 1);
    
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
      window.checkingAuthStatus = false;
      return;
    }

    // Don't set loading state if this is a periodic check
    if (!authState.initialCheckDone || force) {
      setAuthState(prev => ({ ...prev, isLoading: true }));
    }

    console.log('Starting auth check');

    try {
      // Always force a token sync before auth check
      syncAuthTokens();
      
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
              const responseText = await retryResponse.text();
              console.log('Raw profile response after refresh:', responseText);
              
              if (responseText && responseText.trim()) {
                try {
                  // Parse the response text
                  const userData = JSON.parse(responseText);
                  console.log('Profile data after refresh:', userData);
                  
                  // Ensure we have a valid user object with fallbacks
                  const validatedUserData = {
                    id: userData.id || userData.userId || null,
                    email: userData.email || '',
                    fullName: userData.fullName || userData.full_name || '',
                    role: userData.role || 'user',
                  };
                  
                  // Only proceed with authentication if we have at least id and email
                  if (validatedUserData.id && validatedUserData.email) {
                    console.log('Valid user data extracted:', validatedUserData);
                    
                    setAuthState({
                      isAuthenticated: true,
                      isLoading: false,
                      lastVerified: Date.now(),
                      user: validatedUserData,
                      initialCheckDone: true
                    });
                    window.checkingAuthStatus = false;
                    return;
                  }
                } catch (parseError) {
                  console.error('Error parsing retry profile response:', parseError);
                }
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
          // Parse the response text
          const userData = JSON.parse(responseText);
          console.log('Profile data:', userData);
          
          // Ensure we have a valid user object with fallbacks
          const validatedUserData = {
            id: userData.id || userData.userId || null,
            email: userData.email || '',
            fullName: userData.fullName || userData.full_name || '',
            role: userData.role || 'user',
          };
          
          // Only proceed with authentication if we have at least id and email
          if (validatedUserData.id && validatedUserData.email) {
            console.log('Valid user data extracted:', validatedUserData);
            
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              lastVerified: Date.now(),
              user: validatedUserData,
              initialCheckDone: true
            });
          } else {
            console.error('User data missing required fields:', validatedUserData);
            throw new Error('Invalid user data structure');
          }
        } catch (parseError) {
          console.error('Error parsing profile JSON:', parseError);
          console.error('Raw response that failed parsing:', responseText);
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
    } finally {
      // Release the lock
      window.checkingAuthStatus = false;
    }
  };

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
    // Using a setTimeout to break potential render cycles
    setTimeout(() => {
      // Ensure we have synced tokens before checking auth
      syncAuthTokens(true);
      checkAuthStatus(true);
    }, 500); // Add significant delay to break render cycles
  }, []); // Intentionally empty to run only once on mount

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
  }, [authState.initialCheckDone]);

  // Enhanced login function that ensures token storage
  const login = async (userData: User) => {
    console.log('Login called with user data:', userData);
    
    // Force token sync to ensure cookies and localStorage are in sync
    syncAuthTokens(true);
    
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
      // Complete auth reset
      resetAuthState();
      
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
  
  // Method to force complete auth reset - accessible to users
  const performAuthReset = () => {
    console.log('Performing emergency auth reset');
    resetAuthState();
    
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      lastVerified: null,
      user: null,
      initialCheckDone: true
    });
    
    // Force page reload to clear any other state
    window.location.href = '/sign-in';
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated: authState.isAuthenticated,
        isLoading: authState.isLoading,
        user: authState.user,
        login,
        logout,
        resetAuth: performAuthReset
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
