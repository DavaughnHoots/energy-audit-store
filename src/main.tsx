import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

// Create CSRF token if needed for frontend testing
const createCsrfToken = () => {
  // Only create a token if it doesn't exist already
  if (!document.cookie.includes('XSRF-TOKEN=')) {
    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    
    // Set cookie with appropriate flags
    document.cookie = `XSRF-TOKEN=${token}; path=/; SameSite=Strict`;
    console.log('Created local CSRF token for testing');
  }
};

// Call the function to ensure CSRF token exists
createCsrfToken();

const container = document.getElementById('root')
if (!container) {
  throw new Error('Failed to find the root element')
}

const root = createRoot(container)
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
