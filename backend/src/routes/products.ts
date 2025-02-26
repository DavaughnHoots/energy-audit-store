// backend/src/routes/products.ts

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/security.js';
import ProductDataService from '../services/productDataService.js';
import pool from '../config/database.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { appLogger } from '../config/logger.js';
import { cache } from '../config/cache.js';
import { ProductFilters, PaginationOptions } from '../types/product.js';

const router = express.Router();
const productService = new ProductDataService();

// Initialize products on startup
(async () => {
  try {
    appLogger.info('Initializing products on startup');
    // Try to load products from CSV
    await productService.loadProductsFromCSV(process.env.NODE_ENV === 'production' 
      ? 'https://energy-audit-store-e66479ed4f2b.herokuapp.com/data/products.csv'
      : '/data/products.csv');
    appLogger.info('Products loaded successfully on startup');
  } catch (error) {
    appLogger.error('Failed to load products on startup', { error });
  }
})();

// Performance monitoring middleware
const trackPerformance = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const startTime = Date.now();
  
  // Add a listener for when the response is finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    appLogger.info('API Performance', {
      method: req.method,
      path: req.path,
      query: req.query,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
};

// Apply performance tracking to all routes
router.use(trackPerformance);

// Get products with pagination, sorting, and filtering
router.get('/', async (req, res) => {
  try {
    // Extract pagination and sorting parameters
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const sortBy = req.query.sortBy as string || 'name';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';
    
    // Validate pagination parameters
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return res.status(400).json({ 
        error: 'Invalid pagination parameters. Page must be >= 1 and pageSize must be between 1 and 100.' 
      });
    }
    
    // Extract filter parameters
    const filters: ProductFilters = {
      mainCategory: req.query.category as string,
      subCategory: req.query.subcategory as string,
      search: req.query.search as string,
      efficiency: req.query.efficiency as string
    };
    
    // Get products with pagination
    const result = await productService.getProducts(
      filters,
      page,
      pageSize,
      sortBy,
      sortOrder
    );
    
    res.json(result);
  } catch (error) {
    appLogger.error('Error fetching products', { error });
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get product categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await productService.getCategories();
    res.json(categories);
  } catch (error) {
    appLogger.error('Error fetching categories', { error });
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get efficiency ratings
router.get('/efficiency-ratings', async (req, res) => {
  try {
    const ratings = await productService.getEfficiencyRatings();
    res.json(ratings);
  } catch (error) {
    appLogger.error('Error fetching efficiency ratings', { error });
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await productService.getProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    appLogger.error('Error fetching product', { id: req.params.id, error });
    res.status(500).json({ error: (error as Error).message });
  }
});

// Clear product cache (admin only)
router.post('/clear-cache', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    // Check if user is admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
    }
    
    await productService.clearCache();
    res.json({ message: 'Product cache cleared successfully' });
  } catch (error) {
    appLogger.error('Error clearing product cache', { error });
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:id/view', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    await pool.query(
      `INSERT INTO analytics_data (
        user_id, event_type, event_data
      ) VALUES ($1, $2, $3)`,
      [
        req.user!.id,
        'product_view',
        { productId: req.params.id, timestamp: new Date() }
      ]
    );
    res.status(200).end();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id/similar', async (req, res) => {
  try {
    const product = await productService.getProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const similarProducts = await pool.query(
      `SELECT * FROM products 
       WHERE main_category = $1 
       AND sub_category = $2 
       AND id != $3 
       LIMIT 4`,
      [product.mainCategory, product.subCategory, req.params.id]
    );

    res.json(similarProducts.rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id/recommendations', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT r.* FROM recommendations r
       JOIN energy_audits a ON r.audit_id = a.id
       WHERE r.product_id = $1 AND a.user_id = $2
       ORDER BY r.created_at DESC`,
      [req.params.id, req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/sync', async (req, res) => {
  try {
    // Use absolute URL in production, relative path in development
    const csvPath = process.env.NODE_ENV === 'production' 
      ? 'https://energy-audit-store-e66479ed4f2b.herokuapp.com/data/products.csv'
      : '/data/products.csv';
    
    appLogger.info('Syncing products from CSV', { path: csvPath });
    const success = await productService.loadProductsFromCSV(csvPath);
    if (!success) {
      return res.status(500).json({ error: 'Failed to sync products' });
    }
    res.json({ message: 'Products synced successfully' });
  } catch (error) {
    appLogger.error('Error syncing products', { error });
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id/energy-savings', async (req, res) => {
  try {
    const product = await productService.getProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const efficiency = parseFloat(product.efficiency.replace(/[^0-9.]/g, '')) / 100;
    const averageSavings = {
      annual: Math.round(1000 * efficiency), // Placeholder calculation
      tenYear: Math.round(1000 * efficiency * 10)
    };

    res.json(averageSavings);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
