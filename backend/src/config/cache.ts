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
    
    // Initialize Redis client with error handling
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0,
      keyPrefix: this.keyPrefix,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      tls: config.enableTLS ? {
        rejectUnauthorized: false // For self-signed certificates in dev
      } : undefined,
      maxRetriesPerRequest: 3,
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
    } catch (error) {
      appLogger.error('Cache set error:', { error: error.message, key });
      throw new CacheError('Failed to set cache value');
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      appLogger.error('Cache get error:', { error: error.message, key });
      throw new CacheError('Failed to get cache value');
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      appLogger.error('Cache delete error:', { error: error.message, key });
      throw new CacheError('Failed to delete cache value');
    }
  }

  /**
   * Invalidate cache by tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    try {
      // Get all keys for this tag
      const keys = await this.client.smembers(`tag:${tag}`);
      if (keys.length) {
        // Delete all keys and the tag set
        await Promise.all([
          this.client.del(...keys),
          this.client.del(`tag:${tag}`)
        ]);
      }
    } catch (error) {
      appLogger.error('Cache tag invalidation error:', { error: error.message, tag });
      throw new CacheError('Failed to invalidate cache by tag');
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      return await this.client.exists(key) === 1;
    } catch (error) {
      appLogger.error('Cache exists check error:', { error: error.message, key });
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
    } catch (error) {
      appLogger.error('Cache mset error:', { error: error.message });
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
    } catch (error) {
      appLogger.error('Cache mget error:', { error: error.message });
      throw new CacheError('Failed to get multiple cache values');
    }
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    try {
      await this.client.flushdb();
    } catch (error) {
      appLogger.error('Cache clear error:', { error: error.message });
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
    } catch (error) {
      appLogger.error('Cache stats error:', { error: error.message });
      throw new CacheError('Failed to get cache stats');
    }
  }

  private parseRedisInfo(info: string): Record<string, any> {
    const stats: Record<string, any> = {};
    const lines = info.split('\n');

    lines.forEach(line => {
      const parts = line.split(':');
      if (parts.length === 2) {
        stats[parts[0]] = parts[1];
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

// Create and export singleton instance
const cacheConfig: CacheConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'ees:',
  db: parseInt(process.env.REDIS_DB || '0'),
  enableTLS: process.env.REDIS_TLS === 'true'
};

export const cacheManager = new CacheManager(cacheConfig);