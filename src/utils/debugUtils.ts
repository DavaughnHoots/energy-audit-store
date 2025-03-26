import { API_ENDPOINTS, getApiUrl } from '../config/api';

/**
 * Debug function for troubleshooting authentication issues
 * Can be called from browser console: debugAuth()
 */
export const debugAuth = () => {
  console.group('Auth Debugging');
  console.log('Cookies:', document.cookie);
  console.log('LocalStorage auth state:', localStorage.getItem('auth-state'));
  console.log('Session storage:', Object.keys(sessionStorage));
  
  // Test auth endpoints
  fetch(getApiUrl(API_ENDPOINTS.AUTH.PROFILE), {
    credentials: 'include',
  }).then(r => {
    console.log('Auth status check result:', {
      status: r.status,
      ok: r.ok
    });
    return r.text();
  }).then(text => {
    try {
      console.log('Auth response:', JSON.parse(text));
    } catch (e) {
      console.log('Auth raw response:', text);
    }
  }).catch(e => {
    console.error('Auth debug request failed:', e);
  });
  console.groupEnd();
};

// Make it available globally in development
if (process.env.NODE_ENV !== 'production') {
  (window as any).debugAuth = debugAuth;
}
