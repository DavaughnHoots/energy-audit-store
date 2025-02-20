import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { LogMetadata, LoggerConfig, DEFAULT_CONFIG, ILogger } from '../types/logger';

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || DEFAULT_CONFIG.level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      dirname: path.join(process.cwd(), DEFAULT_CONFIG.logDir),
      filename: '%DATE%-app.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: DEFAULT_CONFIG.compressArchive,
      maxSize: DEFAULT_CONFIG.maxFileSize,
      maxFiles: DEFAULT_CONFIG.maxFiles,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.simple()
      ),
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    })
  ]
});

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

// Create logger wrapper with type safety
class Logger implements ILogger {
  async error(message: string, metadata?: LogMetadata, error?: unknown): Promise<void> {
    const meta = metadata || {};
    logger.error(message, {
      ...meta,
      error: error instanceof Error ? error.stack : String(error)
    });
  }

  async warn(message: string, metadata?: LogMetadata): Promise<void> {
    const meta = metadata || {};
    logger.warn(message, meta);
  }

  async info(message: string, metadata?: LogMetadata): Promise<void> {
    const meta = metadata || {};
    logger.info(message, meta);
  }

  async http(message: string, metadata?: LogMetadata): Promise<void> {
    const meta = metadata || {};
    logger.http(message, meta);
  }

  async debug(message: string, metadata?: LogMetadata): Promise<void> {
    const meta = metadata || {};
    logger.debug(message, meta);
  }

  async audit(action: string, metadata: LogMetadata): Promise<void> {
    const meta = metadata || {};
    logger.info(`AUDIT: ${action}`, {
      ...meta,
      audit: true,
      timestamp: new Date().toISOString()
    });
  }
}

// Create AsyncLocalStorage instance for request context
const asyncLocalStorage = new AsyncLocalStorage<LogMetadata>();

// Add context middleware
export const loggerContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const context: LogMetadata = {
      requestId: req.id,
      userId: (req as any)?.user?.id,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };
    
    asyncLocalStorage.run(context, () => {
      next();
    });
  } catch (error) {
    console.error('Error in logger context middleware:', error);
    next();
  }
};

// Initialize logger with proper lifecycle management
export class LoggerInitializer {
  private static isInitialized = false;
  
  static initialize(): void {
    if (this.isInitialized) {
      return;
    }
    
    // Ensure log directory exists
    if (!fs.existsSync(DEFAULT_CONFIG.logDir)) {
      fs.mkdirSync(DEFAULT_CONFIG.logDir, { recursive: true });
    }
    
    // Check for write permissions
    try {
      fs.accessSync(DEFAULT_CONFIG.logDir, fs.constants.W_OK);
    } catch (error) {
      console.error('Cannot write to log directory:', error);
      process.exit(1);
    }
    
    this.isInitialized = true;
  }
}

// Initialize logger before creating instance
LoggerInitializer.initialize();

// Export singleton instance
export const appLogger = new Logger();

// Export winston logger for advanced usage if needed
export const winstonLogger = logger;
