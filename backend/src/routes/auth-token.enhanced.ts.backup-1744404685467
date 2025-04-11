import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * CORS Preflight handling for this specific route
 * This middleware handles OPTIONS requests first, before authentication
 */
router.options('/token-info', (req, res) => {
  // Set CORS headers for preflight requests
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

/**
 * Route to provide token information to the frontend
 * This is needed because HttpOnly cookies can't be directly accessed by JavaScript
 */
router.get('/token-info', (req, res, next) => {
  // Add CORS headers directly to this route 
  // This ensures they're added even if authentication fails
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Add detailed logging for debugging
  console.log('GET /token-info request received');
  console.log('Origin:', req.headers.origin);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  // Now proceed to authentication
  authenticate(req, res, next);
}, (req, res) => {
  try {
    // Extract the access token and refresh token from cookies
    const { accessToken, refreshToken } = req.cookies;
    
    // Log token state
    console.log('Token state:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      user: (req as any).user ? 'present' : 'missing'
    });
    
    // If we don't have tokens in cookies, return empty
    if (!accessToken && !refreshToken) {
      return res.json({
        hasAccessToken: false,
        hasRefreshToken: false,
        userId: null,
        tokenInfo: null
      });
    }

    // Get the user from the request (added by authenticateJWT middleware)
    const user = (req as any).user;

    // Return token info to the frontend
    return res.json({
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      userId: user?.id,
      tokenInfo: {
        userId: user?.id,
        email: user?.email,
        role: user?.role,
        exp: user?.exp
      }
    });
  } catch (error) {
    console.error('Error in token-info endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
