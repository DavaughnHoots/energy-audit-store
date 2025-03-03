// backend/src/routes/products.ts

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { productsLimiter } from '../middleware/rateLimitMiddleware.js';
import ProductDataService from '../services/productDataService.js';
import { SearchService } from '../services/searchService.js';
import { pool } from '../config/database.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { cache } from '../config/cache.js';

const router = express.Router();
const productService = new ProductDataService();
const searchService = new SearchService(pool);

router.get('/', productsLimiter, async (req, res) => {
  try {
    const search = req.query.search as string;
    const category = req.query.category as string;
    const subcategory = req.query.subcategory as string;
    const efficiency = req.query.efficiency as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = req.query.sortBy as string || 'relevance';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    // Log the request parameters for debugging
    console.log('Product request:', { 
      search, category, subcategory, efficiency, page, limit, sortBy, sortOrder 
    });

    // Create a cache key based on the request parameters
    const cacheKey = `products:${search || ''}:${category || ''}:${subcategory || ''}:${efficiency || ''}:${page}:${limit}:${sortBy}:${sortOrder}`;
    
    // Try to get from cache first
    try {
      const cachedResult = await cache.get(cacheKey);
      if (cachedResult) {
        console.log('Cache hit for:', cacheKey);
        return res.json(cachedResult);
      }
      console.log('Cache miss for:', cacheKey);
    } catch (cacheError) {
      console.error('Cache error:', cacheError);
      // Continue with the request even if cache fails
    }

    // If search term is provided, use the search service with full-text search
    if (search) {
      const filters: any = {};
      if (category) filters.category = category;
      if (subcategory) filters.subCategory = subcategory;
      if (efficiency) filters.efficiencyRating = efficiency;

      try {
        const searchResult = await searchService.searchProducts(
          search,
          filters,
          {
            limit,
            offset: (page - 1) * limit,
            sortBy,
            sortOrder
          }
        );

        // Cache the result for 15 minutes (900 seconds)
        await cache.set(cacheKey, searchResult, 900);
        
        return res.json(searchResult);
      } catch (searchError) {
        console.error('Search error:', searchError);
        
        // Fallback to regular product service if search fails
        console.log('Falling back to regular product service');
        const filters = {
          mainCategory: category,
          subCategory: subcategory,
          efficiency: efficiency,
          search: search // Pass search term for client-side filtering
        };
        
        const products = await productService.getProductsPaginated(filters, page, limit, sortBy, sortOrder);
        return res.json(products);
      }
    }

    // If no search term but other filters, use the regular product service
    const filters = {
      mainCategory: category,
      subCategory: subcategory,
      efficiency: efficiency
    };

    // Get products with pagination
    const products = await productService.getProductsPaginated(filters, page, limit, sortBy, sortOrder);
    
    // Cache the result for 15 minutes (900 seconds)
    await cache.set(cacheKey, products, 900);
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/categories', productsLimiter, async (req, res) => {
  try {
    // Try to get categories from cache first
    const cacheKey = 'products:categories';
    try {
      const cachedCategories = await cache.get(cacheKey);
      if (cachedCategories) {
        console.log('Cache hit for categories');
        return res.json(cachedCategories);
      }
      console.log('Cache miss for categories');
    } catch (cacheError) {
      console.error('Cache error for categories:', cacheError);
      // Continue with the request even if cache fails
    }

    const categories = await productService.getCategories();
    
    // Cache categories for 30 minutes (1800 seconds) since they rarely change
    await cache.set(cacheKey, categories, 1800);
    
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id', productsLimiter, async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Try to get product from cache first
    const cacheKey = `product:${productId}`;
    try {
      const cachedProduct = await cache.get(cacheKey);
      if (cachedProduct) {
        console.log('Cache hit for product:', productId);
        return res.json(cachedProduct);
      }
      console.log('Cache miss for product:', productId);
    } catch (cacheError) {
      console.error('Cache error for product:', cacheError);
      // Continue with the request even if cache fails
    }
    
    const product = await productService.getProduct(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Cache product for 1 hour (3600 seconds) since product details rarely change
    await cache.set(cacheKey, product, 3600);
    
    res.json(product);
  } catch (error) {
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

router.get('/:id/similar', productsLimiter, async (req, res) => {
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

router.get('/:id/recommendations', authenticate, productsLimiter, async (req: AuthenticatedRequest, res) => {
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
    const success = await productService.loadProductsFromCSV('/data/products.csv');
    if (!success) {
      return res.status(500).json({ error: 'Failed to sync products' });
    }
    res.json({ message: 'Products synced successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id/energy-savings', productsLimiter, async (req, res) => {
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
