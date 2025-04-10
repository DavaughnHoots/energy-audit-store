/**
 * Service for retrieving token information from the server
 * Used to access HttpOnly cookies that can't be directly accessed by JavaScript
 */

import { apiClient } from './apiClient';

export interface TokenInfo {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  userId: string | null;
  tokenInfo: {
    userId: string;
    email: string;
    role: string;
    exp: number;
  } | null;
}

/**
 * Fetch token information from the server
 * This allows JavaScript to see information about HttpOnly cookies
 * that would otherwise be invisible to the frontend
 */
export async function getTokenInfo(): Promise<TokenInfo> {
  try {
    const response = await apiClient.get<TokenInfo>('/auth-token/token-info');
    return response.data;
  } catch (error) {
    console.error('Error fetching token info:', error);
    return {
      hasAccessToken: false,
      hasRefreshToken: false,
      userId: null,
      tokenInfo: null
    };
  }
}

/**
 * Check if there are valid tokens available (either in localStorage or HttpOnly cookies)
 * @returns True if valid tokens are available
 */
export async function hasValidTokens(): Promise<boolean> {
  // First check localStorage
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    return true;
  }
  
  // If not found in localStorage, check with the server (for HttpOnly cookies)
  try {
    const tokenInfo = await getTokenInfo();
    return tokenInfo.hasAccessToken;
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
}
