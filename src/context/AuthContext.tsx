import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { User } from '../types/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Prevent token refresh recursion
let isRefreshing = false;

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication status on mount and route changes, with debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const debouncedCheck = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkAuthStatus, 1000);
    };

    debouncedCheck();

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  // Prevent multiple simultaneous auth checks
  const [isChecking, setIsChecking] = useState(false);

  const refreshToken = async () => {
    if (isRefreshing) return false;
    isRefreshing = true;

    try {
      const refreshResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!refreshResponse.ok) {
        throw new Error('Token refresh failed');
      }

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    } finally {
      isRefreshing = false;
    }
  };

  const checkAuthStatus = async () => {
    if (isChecking) return;
    setIsChecking(true);

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.PROFILE}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          const refreshed = await refreshToken();
          if (refreshed) {
            // Retry the profile fetch once with new token
            const retryResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.PROFILE}`, {
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            });

            if (retryResponse.ok) {
              const userData = await retryResponse.json();
              setUser(userData);
              setIsAuthenticated(true);
              return;
            }
          }
        }
        throw new Error('Failed to fetch user profile');
      }

      const userData = await response.json();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsChecking(false);
    }
  };

  const login = async (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    navigate('/dashboard');
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      navigate('/sign-in');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
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
