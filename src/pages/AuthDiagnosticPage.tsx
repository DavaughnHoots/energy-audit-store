/**
 * Authentication Diagnostic Page
 *
 * This page provides diagnostic information about the current authentication state,
 * including device detection, token storage, and token validation. It's useful for
 * debugging authentication issues, particularly on mobile devices.
 *
 * NOTE: This page should only be exposed in non-production environments.
 */

import React, { useEffect, useState } from 'react';
import { getCookie } from '@/utils/cookieUtils';
import { isValidToken } from '@/utils/tokenUtils';

const AuthDiagnosticPage: React.FC = () => {
  const [diagnosticData, setDiagnosticData] = useState({
    device: 'Detecting...',
    cookies: {},
    localStorage: {},
    tokenDetails: {}
  });
  
  useEffect(() => {
    // Get device info
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const deviceInfo = {
      userAgent: navigator.userAgent,
      isMobile,
      cookiesEnabled: navigator.cookieEnabled,
      platform: navigator.platform
    };
    
    // Get cookie info
    const accessTokenCookie = getCookie('accessToken');
    const refreshTokenCookie = getCookie('refreshToken');
    const xsrfTokenCookie = getCookie('XSRF-TOKEN');
    
    // Get localStorage info
    let accessTokenLS, refreshTokenLS;
    try {
      accessTokenLS = localStorage.getItem('accessToken');
      refreshTokenLS = localStorage.getItem('refreshToken');
    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }
    
    // Parse token info if available
    const tokenDetails = {};
    if (accessTokenCookie || accessTokenLS) {
      try {
        const token = accessTokenCookie || accessTokenLS;
        const [header, payload] = token.split('.');
        if (header && payload) {
          tokenDetails['header'] = JSON.parse(atob(header));
          tokenDetails['payload'] = JSON.parse(atob(payload));
          tokenDetails['isValid'] = isValidToken(token);
        } else {
          tokenDetails['isValid'] = false;
          tokenDetails['error'] = 'Invalid JWT format';
        }
      } catch (e) {
        tokenDetails['isValid'] = false;
        tokenDetails['error'] = e.message;
      }
    } else {
      tokenDetails['isValid'] = false;
      tokenDetails['error'] = 'No token available';
    }
    
    setDiagnosticData({
      device: deviceInfo,
      cookies: {
        accessToken: accessTokenCookie || 'Not set',
        refreshToken: refreshTokenCookie ? '[Present]' : 'Not set',
        xsrfToken: xsrfTokenCookie ? '[Present]' : 'Not set'
      },
      localStorage: {
        accessToken: accessTokenLS || 'Not set',
        refreshToken: refreshTokenLS ? '[Present]' : 'Not set'
      },
      tokenDetails
    });
  }, []);
  
  // Add a manual test functionality
  const testAuthHeader = async () => {
    try {
      const response = await fetch('/api/auth/test-header', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      alert(`Auth Header Test: ${data.success ? 'Success' : 'Failed'}
${data.message}`);
    } catch (e) {
      alert(`Error testing auth header: ${e.message}`);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Authentication Diagnostics</h1>
      
      <div className="bg-blue-50 p-4 rounded mb-4">
        <h2 className="text-xl font-semibold">Device Information</h2>
        <p>Type: {diagnosticData.device.isMobile ? 'Mobile' : 'Desktop'}</p>
        <p>User Agent: {diagnosticData.device.userAgent}</p>
        <p>Cookies Enabled: {diagnosticData.device.cookiesEnabled ? 'Yes' : 'No'}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-green-50 p-4 rounded">
          <h2 className="text-xl font-semibold">Cookie Storage</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded mt-2">
            {JSON.stringify(diagnosticData.cookies, null, 2)}
          </pre>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded">
          <h2 className="text-xl font-semibold">Local Storage</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded mt-2">
            {JSON.stringify(diagnosticData.localStorage, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="bg-purple-50 p-4 rounded mb-4">
        <h2 className="text-xl font-semibold">Token Details</h2>
        <pre className="text-sm bg-gray-100 p-2 rounded mt-2">
          {JSON.stringify(diagnosticData.tokenDetails, null, 2)}
        </pre>
      </div>
      
      <div className="bg-red-50 p-4 rounded mb-4">
        <h2 className="text-xl font-semibold">Authentication Tests</h2>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2"
          onClick={testAuthHeader}
        >
          Test Authorization Header
        </button>
      </div>
    </div>
  );
};

export default AuthDiagnosticPage;
