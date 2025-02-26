// backend/src/routes/products.ts

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/security.js';
import ProductDataService from '../services/productDataService.js';
import pool from '../config/database.js';
import { AuthenticatedRequest } from '../types/auth.js';

const router = express.Router();
const productService = new ProductDataService();

router.get('/', async (req, res) => {
  try {
    const filters = {
      mainCategory: req.query.category as string,
      subCategory: req.query.subcategory as string,
      search: req.query.search as string,
      efficiency: req.query.efficiency as string
    };

    const products = await productService.getProducts(filters);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await productService.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await productService.getProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
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

router.get('/init', async (req, res) => {
  try {
    const success = await productService.loadProductsFromCSV('/data/products.csv');
    if (!success) {
      return res.status(500).json({ error: 'Failed to initialize products' });
    }
    res.json({ message: 'Products initialized successfully' });
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
