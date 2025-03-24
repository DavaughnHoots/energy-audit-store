// backend/src/routes/education.ts
import express from 'express';
import { validateToken } from '../middleware/tokenValidation.js';
import { z } from 'zod';
import educationService from '../services/educationService.js';

// Define type for authenticated request
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: number;
    email?: string;
    name?: string;
  };
}

const router = express.Router();

/**
 * Get all educational resources with optional filtering
 * GET /api/education/resources
 */
router.get('/resources', async (req, res) => {
  try {
    const userId = req.user?.id; // Will be undefined for unauthenticated users
    
    // Parse query parameters for filtering
    const filters = {
      type: req.query.type as string | undefined,
      topic: req.query.topic as string | undefined,
      level: req.query.level as string | undefined,
      search: req.query.search as string | undefined,
      featured: req.query.featured === 'true',
      collection_id: req.query.collection_id ? parseInt(req.query.collection_id as string) : undefined,
      sort_by: req.query.sort_by as 'newest' | 'popular' | 'rating' | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };
    
    const resources = await educationService.getResources(filters, userId);
    
    res.json({ success: true, resources });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch resources' });
  }
});

/**
 * Get a single educational resource by ID
 * GET /api/education/resources/:id
 */
router.get('/resources/:id', async (req, res) => {
  try {
    const userId = req.user?.id; // Will be undefined for unauthenticated users
    const resourceId = parseInt(req.params.id);
    
    if (isNaN(resourceId)) {
      return res.status(400).json({ success: false, message: 'Invalid resource ID' });
    }
    
    const resource = await educationService.getResourceById(resourceId, userId);
    
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }
    
    res.json({ success: true, resource });
  } catch (error) {
    console.error(`Error fetching resource ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Failed to fetch resource' });
  }
});

/**
 * Get all educational collections
 * GET /api/education/collections
 */
router.get('/collections', async (req, res) => {
  try {
    const userId = req.user?.id; // Will be undefined for unauthenticated users
    const includeResources = req.query.include_resources === 'true';
    
    const collections = await educationService.getCollections(includeResources, userId);
    
    res.json({ success: true, collections });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch collections' });
  }
});

// --- Protected Routes (require authentication) ---

/**
 * Get user's bookmarked resources
 * GET /api/education/bookmarks
 */
router.get('/bookmarks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const bookmarks = await educationService.getUserBookmarks(userId);
    
    res.json({ success: true, bookmarks });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookmarks' });
  }
});

/**
 * Add a bookmark
 * POST /api/education/bookmarks
 */
router.post(
  '/bookmarks',
  authenticateToken,
  validateRequest({
    body: z.object({
      resource_id: z.number().int().positive(),
    }),
  }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { resource_id } = req.body;
      
      const bookmark = await educationService.addBookmark(userId, { resource_id });
      
      res.status(201).json({ success: true, bookmark });
    } catch (error) {
      console.error('Error adding bookmark:', error);
      res.status(500).json({ success: false, message: 'Failed to add bookmark' });
    }
  }
);

/**
 * Remove a bookmark
 * DELETE /api/education/bookmarks/:resourceId
 */
router.delete('/bookmarks/:resourceId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const resourceId = parseInt(req.params.resourceId);
    
    if (isNaN(resourceId)) {
      return res.status(400).json({ success: false, message: 'Invalid resource ID' });
    }
    
    const removed = await educationService.removeBookmark(userId, resourceId);
    
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Bookmark not found' });
    }
    
    res.json({ success: true, message: 'Bookmark removed successfully' });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ success: false, message: 'Failed to remove bookmark' });
  }
});

/**
 * Get user's progress for all resources
 * GET /api/education/progress
 */
router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const progress = await educationService.getUserProgress(userId);
    
    res.json({ success: true, progress });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch progress' });
  }
});

/**
 * Update user's progress for a resource
 * PUT /api/education/progress
 */
router.put(
  '/progress',
  authenticateToken,
  validateRequest({
    body: z.object({
      resource_id: z.number().int().positive(),
      status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
      progress_percent: z.number().min(0).max(100).optional(),
    }),
  }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { resource_id, status, progress_percent } = req.body;
      
      const updatedProgress = await educationService.updateProgress(userId, {
        resource_id,
        status,
        progress_percent,
      });
      
      res.json({ success: true, progress: updatedProgress });
    } catch (error) {
      console.error('Error updating progress:', error);
      res.status(500).json({ success: false, message: 'Failed to update progress' });
    }
  }
);

/**
 * Get ratings for a resource
 * GET /api/education/resources/:resourceId/ratings
 */
router.get('/resources/:resourceId/ratings', async (req, res) => {
  try {
    const resourceId = parseInt(req.params.resourceId);
    
    if (isNaN(resourceId)) {
      return res.status(400).json({ success: false, message: 'Invalid resource ID' });
    }
    
    const ratings = await educationService.getResourceRatings(resourceId);
    
    res.json({ success: true, ratings });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ratings' });
  }
});

/**
 * Get user's rating for a resource
 * GET /api/education/resources/:resourceId/my-rating
 */
router.get('/resources/:resourceId/my-rating', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const resourceId = parseInt(req.params.resourceId);
    
    if (isNaN(resourceId)) {
      return res.status(400).json({ success: false, message: 'Invalid resource ID' });
    }
    
    const rating = await educationService.getUserRating(userId, resourceId);
    
    if (!rating) {
      return res.status(404).json({ success: false, message: 'Rating not found' });
    }
    
    res.json({ success: true, rating });
  } catch (error) {
    console.error('Error fetching user rating:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch rating' });
  }
});

/**
 * Rate a resource
 * POST /api/education/resources/:resourceId/rate
 */
router.post(
  '/resources/:resourceId/rate',
  authenticateToken,
  validateRequest({
    body: z.object({
      rating: z.number().int().min(1).max(5),
      review: z.string().optional(),
    }),
  }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const resourceId = parseInt(req.params.resourceId);
      
      if (isNaN(resourceId)) {
        return res.status(400).json({ success: false, message: 'Invalid resource ID' });
      }
      
      const { rating, review } = req.body;
      
      const savedRating = await educationService.rateResource(userId, {
        resource_id: resourceId,
        rating,
        review,
      });
      
      res.json({ success: true, rating: savedRating });
    } catch (error) {
      console.error('Error rating resource:', error);
      res.status(500).json({ success: false, message: 'Failed to rate resource' });
    }
  }
);

/**
 * Delete a rating
 * DELETE /api/education/resources/:resourceId/rating
 */
router.delete('/resources/:resourceId/rating', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const resourceId = parseInt(req.params.resourceId);
    
    if (isNaN(resourceId)) {
      return res.status(400).json({ success: false, message: 'Invalid resource ID' });
    }
    
    const removed = await educationService.deleteRating(userId, resourceId);
    
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Rating not found' });
    }
    
    res.json({ success: true, message: 'Rating removed successfully' });
  } catch (error) {
    console.error('Error removing rating:', error);
    res.status(500).json({ success: false, message: 'Failed to remove rating' });
  }
});

export default router;
