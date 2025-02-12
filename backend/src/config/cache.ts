// backend/src/config/cache.ts

import Redis from 'ioredis';
import { appLogger } from './logger';

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  keyPrefix?: string;
  db?: number;
  enableTLS?: boolean;
}

interface CacheOptions {
  ttl?: number;  // Time to live in seconds
  tags?: string[];  // Cache tags for group invalidation
}

class CacheManager {
  private client: Redis;
  private readonly defaultTTL: number = 3600; // 1 hour default TTL
  private readonly keyPrefix: string;

  constructor(config: CacheConfig) {
    this.keyPrefix = config.keyPrefix || 'ees:';
    
    // Initialize Redis client with enhanced error handling and timeouts
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0,
      keyPrefix: this.keyPrefix,
      connectTimeout: 5000, // 5 second connection timeout
      maxRetriesPerRequest: 1, // Reduce retries to fail faster
      lazyConnect: true, // Don't connect immediately
      retryStrategy: (times: number) => {
        if (times > 2) {
          return null; // Stop retrying after 2 attempts
        }
        return Math.min(times * 50, 1000);
      },
      tls: config.enableTLS ? {
        rejectUnauthorized: false // For self-signed certificates in dev
      } : undefined,
    });

    // Set up error handling
    this.client.on('error', (error) => {
      appLogger.error('Redis cache error:', { error: error.message });
    });

    this.client.on('connect', () => {
      appLogger.info('Redis cache connected');
    });
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      const ttl = options.ttl || this.defaultTTL;

      // Set the value with expiration
      await this.client.setex(key, ttl, serializedValue);

      // If tags are provided, add key to tag sets
      if (options.tags?.length) {
        await Promise.all(
          options.tags.map(tag =>
            this.client.sadd(`tag:${tag}`, key)
          )
        );
      }
    } catch (error: unknown) {
      const err = error as Error;
      appLogger.error('Cache set error:', { error: err.message, key });
      throw new CacheError('Failed to set cache value');
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error: unknown) {
      const err = error as Error;
      appLogger.error('Cache get error:', { error: err.message, key });
      throw new CacheError('Failed to get cache value');
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error: unknown) {
      const err = error as Error;
      appLogger.error('Cache delete error:', { error: err.message, key });
      throw new CacheError('Failed to delete cache value');
    }
  }

  /**
   * Invalidate cache by tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    try {
      const tagKey = `tag:${tag}`;
      const keys = await this.client.smembers(tagKey);

      if (keys.length === 0) {
        return;
      }

      // Delete the tag first
      await this.client.del(tagKey);

      // Delete all keys in batches to avoid memory issues
      if (keys.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, Math.min(i + batchSize, keys.length));
          const pipeline = this.client.pipeline();
          
          // Add each key to the pipeline
          for (const key of batch) {
            if (key) {
              pipeline.del(key);
            }
          }
          
          // Execute the pipeline for this batch
          type PipelineResult = [Error | null, unknown];
          const pipelineResults = await pipeline.exec() as PipelineResult[];
          
          // Check pipeline execution results
          if (!pipelineResults) {
            throw new Error('Pipeline execution failed - no results');
          }
          
          // Validate each result in the pipeline
          for (const result of pipelineResults) {
            if (result[0]) {
              throw new Error(`Pipeline execution failed: ${result[0].message}`);
            }
          }
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      appLogger.error('Cache tag invalidation error:', { error: err.message, tag });
      throw new CacheError('Failed to invalidate cache by tag');
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      return await this.client.exists(key) === 1;
    } catch (error: unknown) {
      const err = error as Error;
      appLogger.error('Cache exists check error:', { error: err.message, key });
      throw new CacheError('Failed to check cache key existence');
    }
  }

  /**
   * Set multiple values in cache
   */
  async mset(items: Record<string, any>, ttl?: number): Promise<void> {
    try {
      const pipeline = this.client.pipeline();
      
      Object.entries(items).forEach(([key, value]) => {
        pipeline.setex(key, ttl || this.defaultTTL, JSON.stringify(value));
      });

      await pipeline.exec();
    } catch (error: unknown) {
      const err = error as Error;
      appLogger.error('Cache mset error:', { error: err.message });
      throw new CacheError('Failed to set multiple cache values');
    }
  }

  /**
   * Get multiple values from cache
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.client.mget(keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error: unknown) {
      const err = error as Error;
      appLogger.error('Cache mget error:', { error: err.message });
      throw new CacheError('Failed to get multiple cache values');
    }
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    try {
      await this.client.flushdb();
    } catch (error: unknown) {
      const err = error as Error;
      appLogger.error('Cache clear error:', { error: err.message });
      throw new CacheError('Failed to clear cache');
    }
  }

  /**
   * Get cache info/stats
   */
  async getStats(): Promise<Record<string, any>> {
    try {
      const info = await this.client.info();
      return this.parseRedisInfo(info);
    } catch (error: unknown) {
      const err = error as Error;
      appLogger.error('Cache stats error:', { error: err.message });
      throw new CacheError('Failed to get cache stats');
    }
  }

  private parseRedisInfo(info: string): Record<string, string> {
    const stats: Record<string, string> = {};
    const lines = info.split('\n');

    lines.forEach(line => {
      const parts = line.split(':');
      if (parts.length === 2) {
        const key = parts[0];
        const value = parts[1];
        if (key && value) {
          stats[key] = value;
        }
      }
    });

    return stats;
  }

  /**
   * Close cache connection
   */
  async close(): Promise<void> {
    await this.client.quit();
  }
}

// Custom error class for cache operations
export class CacheError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CacheError';
  }
}

// Create a mock cache manager for development when Redis is not available
class MockCacheManager {
  private cache: Map<string, { value: string; expiry: number }>;

  constructor() {
    this.cache = new Map();
  }

  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || 3600;
    this.cache.set(key, {
      value: JSON.stringify(value),
      expiry: Date.now() + (ttl * 1000)
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }
    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return JSON.parse(item.value) as T;
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async invalidateByTag(): Promise<void> {
    // No-op for mock cache
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async mset(items: Record<string, any>, ttl?: number): Promise<void> {
    Object.entries(items).forEach(([key, value]) => {
      this.set(key, value, { ttl });
    });
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async getStats(): Promise<Record<string, any>> {
    return {
      size: this.cache.size,
      type: 'mock'
    };
  }

  async close(): Promise<void> {
    this.cache.clear();
  }
}

// Create and export cache manager instance
async function initializeCache(): Promise<CacheManager | MockCacheManager> {
  const cacheConfig: CacheConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'ees:',
    db: parseInt(process.env.REDIS_DB || '0'),
    enableTLS: process.env.REDIS_TLS === 'true'
  };

  try {
    const manager = new CacheManager(cacheConfig);
    
    try {
      // Test connection before proceeding
      await (manager as any).client.connect();
      const pingResult = await (manager as any).client.ping();
      
      if (pingResult !== 'PONG') {
        throw new Error('Redis connection test failed');
      }
    } catch (error) {
      throw new Error(`Redis connection test failed: ${(error as Error).message}`);
    }
    
    appLogger.info('Redis cache initialized and connected successfully');
    return manager;
  } catch (error: unknown) {
    const err = error as Error;
    appLogger.warn('Redis connection failed, using in-memory cache for development', {
      error: err.message,
      host: cacheConfig.host,
      port: cacheConfig.port
    });
    return new MockCacheManager();
  }
}

// Initialize cache manager and export
let cacheManagerInstance: CacheManager | MockCacheManager | null = null;

export const getCacheManager = async (): Promise<CacheManager | MockCacheManager> => {
  if (!cacheManagerInstance) {
    cacheManagerInstance = await initializeCache();
  }
  return cacheManagerInstance;
};

// Export the initialization function for direct access if needed
export { initializeCache };
