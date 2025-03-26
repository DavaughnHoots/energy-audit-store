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
      // Add auth headers and credentials to each request
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        }
      });
      
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
