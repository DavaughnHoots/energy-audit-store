import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Route to provide token information to the frontend
 * This is needed because HttpOnly cookies can't be directly accessed by JavaScript
 */
router.get('/token-info', authenticate, (req, res) => {
  try {
    // Extract the access token and refresh token from cookies
    const { accessToken, refreshToken } = req.cookies;
    
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
      userId: user?.userId,
      tokenInfo: {
        userId: user?.userId,
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
