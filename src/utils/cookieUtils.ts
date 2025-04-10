/**
 * Utility functions for working with cookies
 * Used to synchronize authentication between cookies and localStorage
 */

/**
 * Parse a cookie string and return an object with key-value pairs
 * @param cookieStr - The cookie string to parse (defaults to document.cookie)
 * @returns Record of cookie key-value pairs
 */
export function parseCookies(cookieStr: string = document.cookie): Record<string, string> {
  return cookieStr
    .split(';')
    .map(v => v.trim())
    .reduce((acc, current) => {
      const [name, ...value] = current.split('=');
      if (name) acc[name] = decodeURIComponent(value.join('='));
      return acc;
    }, {} as Record<string, string>);
}

/**
 * Get a specific cookie by name
 * @param name - The name of the cookie to retrieve
 * @returns The cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  const cookies = parseCookies();
  return cookies[name] || null;
}

/**
 * Synchronize auth tokens between cookies and localStorage
 * This ensures both authentication methods work
 */
export function syncAuthTokens(): void {
  // Check for tokens in cookies that might be missing from localStorage
  const cookies = parseCookies();
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  // If tokens are in cookies but not in localStorage, copy them to localStorage
  if (cookies.accessToken && !accessToken) {
    localStorage.setItem('accessToken', cookies.accessToken);
    console.log('Synchronized accessToken from cookie to localStorage');
  }
  
  if (cookies.refreshToken && !refreshToken) {
    localStorage.setItem('refreshToken', cookies.refreshToken);
    console.log('Synchronized refreshToken from cookie to localStorage');
  }
  
  // Add optional logic to sync from localStorage to cookies if needed
  // This would require setting document.cookie and may be more complex due to 
  // domain/security requirements
}
