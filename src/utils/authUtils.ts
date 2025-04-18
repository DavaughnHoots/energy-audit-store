import useAuth from '../context/AuthContext';
import React from 'react';
import { API_ENDPOINTS, getApiUrl } from '../config/api';

/**
 * Get authorization headers with the current auth token
 */
export const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAccessToken()}`
  };
};

/**
 * Extract the access token from cookies
 */
export const getAccessToken = (): string => {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('accessToken='))
    ?.split('=')[1] || '';
};

/**
 * Get a cookie value by name
 * @param name The name of the cookie
 * @returns The cookie value or empty string if not found
 */
export const getCookieValue = (name: string): string => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match && match[2] ? match[2] : '';
};

/**
 * Fetch with authentication and retry logic for failed requests
 * @param url The URL to fetch
 * @param options Fetch options
 * @param maxRetries Maximum number of retries
 */
export const fetchWithAuth = async (
  url: string, 
  options: RequestInit = {}, 
  maxRetries = 3
): Promise<Response> => {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      // Create headers with auth headers and any custom headers
      const headers: HeadersInit = {
        ...getAuthHeaders(),
        ...(options.headers as Record<string, string> || {})
      };
      
      // Add CSRF token for non-GET requests
      const method = options.method || 'GET';
      if (method !== 'GET') {
        // First try to get the token from cookies
        let csrfToken = getCookieValue('XSRF-TOKEN');
        
        // If no token exists in cookies, create a temporary one
        if (!csrfToken) {
          try {
            // Attempt to fetch a CSRF token first
            const tokenResponse = await fetch(url.includes('/api') ? '/api/auth/csrf-token' : '/auth/csrf-token', {
              method: 'GET',
              credentials: 'include',
            });
            
            // The token should now be in cookies if the endpoint exists and works
            csrfToken = getCookieValue('XSRF-TOKEN');
          } catch (error) {
            // Silently continue if the endpoint doesn't exist
            console.log('Could not fetch CSRF token, proceeding without it');
          }
        }
        
        // If we have a token, add it to headers
        if (csrfToken) {
          headers['x-xsrf-token'] = csrfToken;
        }
      }
      
      // Prepare request options with proper typing
      const requestOptions: RequestInit = {
        ...options,
        credentials: 'include' as RequestCredentials,
        headers
      };
      
      // Make the request with auth and CSRF protection
      const response = await fetch(url, requestOptions);
      
      if (response.ok) return response;
      
      // Handle 401 unauthorized errors with automatic token refresh
      if (response.status === 401 && attempt < maxRetries - 1) {
        console.log('Unauthorized, attempting token refresh...');
        const refreshed = await refreshAuthToken();
        if (refreshed) {
          console.log('Token refreshed, retrying request');
          attempt++;
          continue;
        }
      }
      
      // For other errors, throw
      console.error(`Request failed with status ${response.status}:`, response.statusText);
      return response;
    }
    catch (err) {
      console.error(`Fetch attempt ${attempt + 1} failed:`, err);
      attempt++;
      if (attempt >= maxRetries) throw err;
      
      // Exponential backoff between retries
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  throw new Error(`Max retries (${maxRetries}) exceeded`);
};

/**
 * Attempt to refresh the authentication token
 * @returns true if refresh was successful, false otherwise
 */
export const refreshAuthToken = async (): Promise<boolean> => {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.AUTH.REFRESH), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

/**
 * Hook for use with localStorage to persist data between sessions
 * @param key Storage key
 * @param initialValue Default value if nothing exists in storage
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Get from local storage then parse stored json or return initialValue
  const storedValue = localStorage.getItem(key);
  const initial = storedValue ? JSON.parse(storedValue) : initialValue;
  
  // State to store our value
  const [value, setValue] = React.useState<T>(initial);
  
  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setStoredValue = (value: T) => {
    setValue(value);
    localStorage.setItem(key, JSON.stringify(value));
  };
  
  return [value, setStoredValue];
}
