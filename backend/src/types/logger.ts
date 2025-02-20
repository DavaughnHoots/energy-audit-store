import { Request } from 'express';
import { User } from './auth';

// Logger configuration types
export interface LoggerConfig {
  logDir: string;
  level: LogLevel;
  maxFileSize: string;
  maxFiles: string;
  compressArchive: boolean;
  flushInterval: number;
  maxQueueSize: number;
  retryDelays: number[];
  memoryThreshold: number;
  memoryCheckInterval: number;
}

// Log levels
export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

// Log metadata
export interface LogMetadata {
  requestId?: string;
  userId?: string;
  component?: string;
  path?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  error?: unknown;
  [key: string]: unknown;
}

// Helper function to create log metadata with request context
export const createLogMetadata = (
  req?: Request,
  additionalData: Record<string, unknown> = {}
): LogMetadata => ({
  requestId: req?.id,
  userId: (req as any)?.user?.id,
  path: req?.path,
  method: req?.method,
  ip: req?.ip,
  userAgent: req?.get('user-agent'),
  ...additionalData
});

// Transport types
export interface TransportConfig {
  dirname: string;
  filename: string;
  datePattern: string;
  zippedArchive: boolean;
  maxSize: string;
  maxFiles: string;
  level: string;
}

// Write queue types
export interface QueueItem {
  operation: () => Promise<void>;
  context: LogMetadata;
  priority?: number;
}

export interface WriteQueueConfig {
  maxSize: number;
  flushThreshold: number;
  flushInterval: number;
  maxRetries: number;
}

// Logger interface
export interface ILogger {
  error(message: string, metadata?: LogMetadata, error?: unknown): Promise<void>;
  warn(message: string, metadata?: LogMetadata): Promise<void>;
  info(message: string, metadata?: LogMetadata): Promise<void>;
  http(message: string, metadata?: LogMetadata): Promise<void>;
  debug(message: string, metadata?: LogMetadata): Promise<void>;
  audit(action: string, metadata: LogMetadata): Promise<void>;
}

// Memory monitor types
export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
}

export interface MemoryMonitorConfig {
  threshold: number;
  checkInterval: number;
  enableGC: boolean;
}

// Error types
export class LoggerError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'LoggerError';
  }
}

// Declare global GC function
declare global {
  namespace NodeJS {
    interface Global {
      gc?: () => void;
    }
  }
}

// Default configuration
export const DEFAULT_CONFIG: LoggerConfig = {
  logDir: 'logs',
  level: 'info',
  maxFileSize: '20m',
  maxFiles: '14d',
  compressArchive: true,
  flushInterval: 5000,
  maxQueueSize: 10000,
  retryDelays: [1000, 2000, 5000],
  memoryThreshold: 0.85,
  memoryCheckInterval: 60000,
};
