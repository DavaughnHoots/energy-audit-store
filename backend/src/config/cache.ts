import NodeCache from 'node-cache';
import { appLogger } from './logger.js';

interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl: number): Promise<void>;
  del(key: string): Promise<void>;
}

class MemoryCache implements CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes default TTL
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: false // For better performance
    });

    // Log cache events for monitoring
    this.cache.on('set', (key: string) => {
      appLogger.debug('Cache set:', { key });
    });

    this.cache.on('del', (key: string) => {
      appLogger.debug('Cache delete:', { key });
    });

    this.cache.on('expired', (key: string) => {
      appLogger.debug('Cache key expired:', { key });
    });

    this.cache.on('flush', () => {
      appLogger.debug('Cache flushed');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = this.cache.get<T>(key);
      return value || null;
    } catch (error) {
      appLogger.error('Cache get error:', { key, error });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      this.cache.set(key, value, ttl);
    } catch (error) {
      appLogger.error('Cache set error:', { key, error });
    }
  }

  async del(key: string): Promise<void> {
    try {
      this.cache.del(key);
    } catch (error) {
      appLogger.error('Cache delete error:', { key, error });
    }
  }
}

// Create Redis implementation for production use
class RedisCache implements CacheService {
  // TODO: Implement Redis cache for production
  async get<T>(key: string): Promise<T | null> {
    return null;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    // Implementation pending
  }

  async del(key: string): Promise<void> {
    // Implementation pending
  }
}

// Export the appropriate cache implementation based on environment
const isProduction = process.env.NODE_ENV === 'production';
export const cache: CacheService = isProduction ? new RedisCache() : new MemoryCache();
