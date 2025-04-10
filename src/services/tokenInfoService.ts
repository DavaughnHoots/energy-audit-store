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
    const response = await apiClient.get<any>('/auth-token/token-info');
    console.log('Raw token info response:', response);
    
    // Extract data, handling both direct and wrapped responses
    const data = response.data?.data || response.data;
    
    // Ensure Boolean values for token presence and create a well-formed response
    // This handles cases where the values might be truthy but not strictly boolean
    const result: TokenInfo = {
      hasAccessToken: Boolean(data?.hasAccessToken),
      hasRefreshToken: Boolean(data?.hasRefreshToken),
      userId: data?.userId || null,
      tokenInfo: data?.tokenInfo || null
    };
    
    console.log('Processed token info:', result);
    return result;
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
