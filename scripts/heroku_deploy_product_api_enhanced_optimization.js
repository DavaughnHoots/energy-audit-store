/**
 * Heroku Deployment Script for Enhanced Product API Optimization
 * 
 * This script addresses the continuing duplicate API call issue by implementing
 * a more comprehensive solution including:
 * 
 * 1. Global request cache service with throttling and request deduplication
 * 2. Server-side rate limiting specifically for product detail endpoints
 * 3. Enhanced component lifecycle management
 * 4. Improved HTTP caching directives
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const branchName = `fix/product-api-enhanced-optimization-${Date.now()}`;
const commitMessage = 'Implement enhanced product API optimization to eliminate duplicate calls';

// Create new branch
console.log(`Creating new git branch: ${branchName}...`);
try {
  execSync(`git checkout -b ${branchName}`);
  console.log('✓ Created new branch');
} catch (error) {
  console.error('Failed to create branch:', error.message);
  process.exit(1);
}

// Step 1: Create the global RequestCacheService
console.log('Creating RequestCacheService...');
try {
  const serviceDir = path.resolve('src/services');
  const servicePath = path.resolve(serviceDir, 'requestCacheService.ts');
  
  // Ensure the directory exists
  if (!fs.existsSync(serviceDir)) {
    fs.mkdirSync(serviceDir, { recursive: true });
  }
  
  const requestCacheServiceContent = `/**
 * Request Cache Service
 * 
 * A global singleton service for deduplicating API requests and managing the request lifecycle.
 * Features:
 * - Request deduplication to prevent duplicate API calls
 * - Request throttling to limit rapid successive calls
 * - Automatic cleanup of expired cache entries
 * - Request cancellation support via AbortController
 */

export class RequestCacheService {
  private static instance: RequestCacheService;
  private cache = new Map<string, Promise<any>>();
  private timestamps = new Map<string, number>();
  private readonly TTL = 60000; // 1 minute cache TTL
  private abortControllers = new Map<string, AbortController>();
  private throttleTimers = new Map<string, NodeJS.Timeout>();

  private constructor() {
    // Clean up expired entries periodically
    setInterval(() => this.cleanExpired(), 30000);
    console.log('RequestCacheService initialized');
  }

  public static getInstance(): RequestCacheService {
    if (!RequestCacheService.instance) {
      RequestCacheService.instance = new RequestCacheService();
    }
    return RequestCacheService.instance;
  }

  public async fetch<T>(url: string, options?: RequestInit, throttleMs = 0): Promise<T> {
    const cacheKey = this.generateCacheKey(url, options);
    
    // Apply throttling if specified
    if (throttleMs > 0) {
      if (this.throttleTimers.has(cacheKey)) {
        console.log(`Request to ${url} throttled`);
        // Return the existing promise if we're throttling
        if (this.cache.has(cacheKey)) {
          return this.cache.get(cacheKey) as Promise<T>;
        }
      }
    }

    // Return cached promise if it exists and is not expired
    if (this.cache.has(cacheKey)) {
      const timestamp = this.timestamps.get(cacheKey) || 0;
      if (Date.now() - timestamp < this.TTL) {
        console.log(`Using cached request for: ${url}`);
        return this.cache.get(cacheKey) as Promise<T>;
      }
      // Clean up expired entry
      this.cache.delete(cacheKey);
      this.timestamps.delete(cacheKey);
      if (this.abortControllers.has(cacheKey)) {
        this.abortControllers.get(cacheKey)?.abort();
        this.abortControllers.delete(cacheKey);
      }
    }

    // Create a new abort controller for this request
    const controller = new AbortController();
    this.abortControllers.set(cacheKey, controller);

    // Add signal to options
    const requestOptions = { ...options, signal: controller.signal };

    // Create new request promise
    const requestPromise = new Promise<T>(async (resolve, reject) => {
      try {
        console.log(`Creating new request for: ${url}`);
        const response = await fetch(url, requestOptions);
    
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
  
        const data = await response.json();
        resolve(data);

        // Set throttle timer if specified
        if (throttleMs > 0) {
          this.throttleTimers.set(cacheKey, setTimeout(() => {
            this.throttleTimers.delete(cacheKey);
          }, throttleMs));
        }
      } catch (error) {
        // Only reject for non-abort errors
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.log(`Request to ${url} was aborted`);
        } else {
          reject(error);
        }
      } finally {
        // Update timestamp when request completes
        this.timestamps.set(cacheKey, Date.now());
      }
    });
    
    // Store in cache
    this.cache.set(cacheKey, requestPromise);
    
    return requestPromise;
  }

  public abortRequest(url: string, options?: RequestInit): void {
    const cacheKey = this.generateCacheKey(url, options);
    if (this.abortControllers.has(cacheKey)) {
      this.abortControllers.get(cacheKey)?.abort();
      this.abortControllers.delete(cacheKey);
    }
  }

  public clearCache(): void {
    // Abort all in-flight requests
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    
    // Clear all maps
    this.cache.clear();
    this.timestamps.clear();
    this.abortControllers.clear();
    
    // Clear all throttle timers
    for (const timer of this.throttleTimers.values()) {
      clearTimeout(timer);
    }
    this.throttleTimers.clear();
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now - timestamp > this.TTL) {
        this.cache.delete(key);
        this.timestamps.delete(key);
        if (this.abortControllers.has(key)) {
          this.abortControllers.delete(key);
        }
      }
    }
  }

  private generateCacheKey(url: string, options?: RequestInit): string {
    // Create a deterministic key from the URL and significant options
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }
}

// Singleton instance for use throughout the app
export const requestCache = RequestCacheService.getInstance();
`;
  
  fs.writeFileSync(servicePath, requestCacheServiceContent);
  console.log('✓ Created RequestCacheService');
} catch (error) {
  console.error('Failed to create RequestCacheService:', error.message);
  process.exit(1);
}

// Step 2: Create the backend rate limiting middleware
console.log('Creating product rate limiting middleware...');
try {
  const middlewareDir = path.resolve('backend/src/middleware');
  const middlewarePath = path.resolve(middlewareDir, 'product-rate-limit.ts');
  
  // Ensure the directory exists
  if (!fs.existsSync(middlewareDir)) {
    fs.mkdirSync(middlewareDir, { recursive: true });
  }
  
  const rateLimitMiddlewareContent = `/**
 * Product-Specific Rate Limiting Middleware
 * 
 * Special rate limiter for product detail endpoints that combines IP and product ID
 * for more granular control and returns cached content when rate limited.
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import NodeCache from 'node-cache';

// Will be imported from products route
declare const productCache: NodeCache;

// Create a stricter rate limiter specifically for product detail endpoints
export const productDetailRateLimiter = rateLimit({
  windowMs: 1000, // 1 second window
  max: 2, // Maximum 2 requests per second per IP/product ID
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator that combines IP and product ID
  keyGenerator: (req: Request) => {
    return `${req.ip}:product:${req.params.id}`;
  },
  // Custom handler that returns cached data when rate limited
  handler: (req: Request, res: Response) => {
    console.log(`Rate limited product detail request for ${req.params.id} from ${req.ip}`);
    
    // Access the product cache from the main module
    // @ts-ignore - productCache is available through module sharing
    const productCache = req.app.locals.productCache;
    
    if (productCache) {
      // Return cached response if available
      const cacheKey = `product_${req.params.id}`;
      const cachedProduct = productCache.get(cacheKey);
      
      if (cachedProduct) {
        return res.json({
          success: true,
          product: cachedProduct,
          rateLimited: true
        });
      }
    }
    
    return res.status(429).json({
      success: false,
      message: 'Too many requests for this product, please try again later',
      rateLimited: true
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for non-GET requests
    return req.method !== 'GET';
  }
});
`;
  
  fs.writeFileSync(middlewarePath, rateLimitMiddlewareContent);
  console.log('✓ Created product rate limiting middleware');
} catch (error) {
  console.error('Failed to create rate limiting middleware:', error.message);
  process.exit(1);
}

// Step 3: Update backend/src/routes/products.ts to implement the new features
console.log('Updating products route handler...');
try {
  const routesFile = path.resolve('backend/src/routes/products.ts');
  let routesContent = fs.readFileSync(routesFile, 'utf8');

  // Add product detail rate limiter import
  routesContent = routesContent.replace(
    'import { Router } from "express";',
    `import { Router } from "express";
import { productDetailRateLimiter } from "../middleware/product-rate-limit";
import NodeCache from 'node-cache';

// Create a cache for product details with 10 minute TTL
const productCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
`
  );

  // Expose product cache to the app for middleware access
  routesContent = routesContent.replace(
    'const router = Router();',
    `const router = Router();

// Make product cache available to middleware
router.use((req, res, next) => {
  req.app.locals.productCache = productCache;
  next();
});
`
  );

  // Add rate limiter and enhanced caching to product detail endpoint
  routesContent = routesContent.replace(
    'router.get("/:id", async (req, res) => {',
    `router.get("/:id", productDetailRateLimiter, async (req, res) => {
  // Add cache control headers to reduce duplicate requests
  res.set({
    'Cache-Control': 'private, max-age=60', // 1 minute client cache
    'ETag': \`"product-\${req.params.id}"\`, // Add ETag support
    'Surrogate-Control': 'max-age=86400', // CDN cache directive
    'Vary': 'Accept' // Vary response based on Accept header
  });
  
  console.log('Product detail request for ID:', req.params.id);
`
  );

  // Add caching for product details
  routesContent = routesContent.replace(
    'const product = await productService.getProduct(req.params.id);',
    `// Check cache first
  const cacheKey = \`product_\${req.params.id}\`;
  const cachedProduct = productCache.get(cacheKey);
  
  if (cachedProduct) {
    console.log('Cache hit for product:', req.params.id);
    return res.json({
      success: true,
      product: cachedProduct
    });
  }
  
  console.log('Cache miss for product:', req.params.id);
  const product = await productService.getProduct(req.params.id);
  
  // Cache the product for future requests (10 minute TTL)
  if (product) {
    productCache.set(cacheKey, product, 600);
  }`
  );

  // Add package.json update for node-cache
  const pkgFile = path.resolve('backend/package.json');
  const pkgContent = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
  
  if (!pkgContent.dependencies['node-cache']) {
    pkgContent.dependencies['node-cache'] = '^5.1.2';
    fs.writeFileSync(pkgFile, JSON.stringify(pkgContent, null, 2));
    console.log('✓ Added node-cache dependency');
  } else {
    console.log('✓ node-cache dependency already exists');
  }

  // Add express-rate-limit if it doesn't exist
  if (!pkgContent.dependencies['express-rate-limit']) {
    pkgContent.dependencies['express-rate-limit'] = '^6.7.0';
    fs.writeFileSync(pkgFile, JSON.stringify(pkgContent, null, 2));
    console.log('✓ Added express-rate-limit dependency');
  } else {
    console.log('✓ express-rate-limit dependency already exists');
  }

  fs.writeFileSync(routesFile, routesContent);
  console.log('✓ Updated products route handler');
} catch (error) {
  console.error('Failed to update products route:', error.message);
  process.exit(1);
}

// Step 4: Update ProductDetailModal.tsx to use RequestCacheService
console.log('Updating ProductDetailModal component...');
try {
  const modalFile = path.resolve('src/components/products/ProductDetailModal.tsx');
  let modalContent = fs.readFileSync(modalFile, 'utf8');
  
  // Add request cache service import
  modalContent = modalContent.replace(
    'import { getCategoryImage, getProductImage, trackImageDownload } from \'@/services/productImageService\';',
    `import { getCategoryImage, getProductImage, trackImageDownload } from '@/services/productImageService';
import { requestCache } from '@/services/requestCacheService';`
  );
  
  // Replace fetch implementation with requestCache service
  modalContent = modalContent.replace(
    /const fetchProductDetailsRef = React\.useRef\(async \(\) => \{[\s\S]*?\}\);/,
    `const fetchProductDetailsRef = React.useRef(async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if we're already fetching this product to prevent duplicate calls
      const cacheKey = \`product_\${productId}\`;
      const cachedData = sessionStorage.getItem(cacheKey);
      
      if (cachedData) {
        console.log(\`Using cached data for product \${productId}\`);
        setProduct(JSON.parse(cachedData));
        setLoading(false);
        return;
      }
      
      console.log(\`Fetching product details for ID: \${productId}\`);
      
      // Use the request cache service with a 200ms throttle to prevent rapid successive calls
      const response = await requestCache.fetch(
        API_ENDPOINTS.RECOMMENDATIONS.GET_PRODUCT_DETAIL(productId),
        {
          headers: {
            'Cache-Control': 'max-age=300',
            'Pragma': 'no-cache' // For older browsers
          }
        },
        200 // 200ms throttle
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.product) {
          // Cache the result in sessionStorage
          sessionStorage.setItem(cacheKey, JSON.stringify(data.product));
          setProduct(data.product);
        } else {
          throw new Error(data.message || 'Failed to retrieve product details');
        }
      } else {
        throw new Error(\`Failed to fetch product details: \${response.status}\`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  });`
  );
  
  // Add clean-up for pending requests
  modalContent = modalContent.replace(
    'useEffect(() => {\n    // Only fetch if the modal is open and we have a productId\n    if (isOpen && productId) {\n      fetchProductDetailsRef.current();',
    `useEffect(() => {
    // Only fetch if the modal is open and we have a productId
    if (isOpen && productId) {
      fetchProductDetailsRef.current();
      
      // Return cleanup function that aborts any pending requests
      return () => {
        requestCache.abortRequest(
          API_ENDPOINTS.RECOMMENDATIONS.GET_PRODUCT_DETAIL(productId)
        );
      };
    }`
  );
  
  fs.writeFileSync(modalFile, modalContent);
  console.log('✓ Updated ProductDetailModal component');
} catch (error) {
  console.error('Failed to update ProductDetailModal:', error.message);
  process.exit(1);
}

// Create temporary build-trigger file to force Heroku rebuild
try {
  fs.writeFileSync('.build-trigger', new Date().toISOString());
  console.log('✓ Created build trigger file');
} catch (error) {
  console.error('Failed to create build trigger:', error.message);
  process.exit(1);
}

// Add files to git
console.log('Adding files to git...');
try {
  execSync('git add src/services/requestCacheService.ts backend/src/middleware/product-rate-limit.ts backend/src/routes/products.ts src/components/products/ProductDetailModal.tsx backend/package.json .build-trigger');
  console.log('✓ Added files to git');
} catch (error) {
  console.error('Failed to add files:', error.message);
  process.exit(1);
}

// Commit changes
console.log('Committing changes...');
try {
  execSync(`git commit -m "${commitMessage}"`);
  console.log('✓ Committed changes');
} catch (error) {
  console.error('Failed to commit changes:', error.message);
  process.exit(1);
}

// Push to Heroku
console.log('Pushing to Heroku...');
try {
  execSync('git push heroku HEAD:master -f');
  console.log('✓ Deployed to Heroku successfully!');
} catch (error) {
  console.error('Failed to push to Heroku:', error.message);
  process.exit(1);
}

console.log('\n ENHANCED PRODUCT API OPTIMIZATION DEPLOYMENT SUCCESSFUL \n');
console.log(`
The enhanced product API optimization has been deployed to Heroku.

This implementation improves on our first optimization by:

1. Creating a global request cache service (src/services/requestCacheService.ts)
   - Provides central caching for all API requests
   - Implements request deduplication via Promise caching
   - Adds request throttling to prevent rapid successive calls
   - Includes proper AbortController integration for cleanup

2. Adding backend rate limiting (backend/src/middleware/product-rate-limit.ts)
   - Creates a product-specific rate limiter
   - Limits to 2 requests per second per IP/product ID
   - Returns cached data when rate limited to maintain functionality

3. Enhancing HTTP caching directives
   - Adds ETag support
   - Includes CDN-friendly cache headers
   - Improves client-side caching

4. Updating the ProductDetailModal
   - Uses the global request cache service
   - Implements proper cleanup on unmount
   - Adds request throttling

To test:
1. Visit https://energy-audit-store-e66479ed4f2b.herokuapp.com/products2
2. Browse through categories and subcategories
3. Click on products to view details
4. Verify in Heroku logs that duplicate requests are eliminated
`);
