// backend/src/config/logger.ts

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define severity levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each severity level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to Winston
winston.addColors(colors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.printf(({ timestamp, level, message, metadata, stack }) => {
    // Clean metadata by removing sensitive information
    const cleanMetadata = { ...metadata };
    delete cleanMetadata.password;
    delete cleanMetadata.token;
    delete cleanMetadata.authorization;
    
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...(Object.keys(cleanMetadata).length > 2 && { metadata: cleanMetadata }),
      ...(stack && { stack }),
    });
  })
);

// Define the log directory
const logDir = process.env.LOG_DIR || 'logs';

// Create rotating transport for file logging
const rotatingFileTransport = new DailyRotateFile({
  dirname: path.join(process.cwd(), logDir),
  filename: '%DATE%-app.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

// Create console transport with color
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.simple()
  ),
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

// Create error log transport
const errorLogTransport = new DailyRotateFile({
  dirname: path.join(process.cwd(), logDir),
  filename: '%DATE%-error.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
});

// Create HTTP request log transport
const httpLogTransport = new DailyRotateFile({
  dirname: path.join(process.cwd(), logDir),
  filename: '%DATE%-http.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '7d',
  level: 'http',
});

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: logFormat,
  transports: [
    rotatingFileTransport,
    consoleTransport,
    errorLogTransport,
    httpLogTransport,
  ],
  // Don't exit on uncaught errors
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logging
export const httpLogStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Add error event handlers
logger.on('error', (error) => {
  console.error('Logger error:', error);
});

rotatingFileTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info('Log file rotated', { oldFilename, newFilename });
});

// Helper function to clean sensitive data from logs
export const cleanSensitiveData = (data: any): any => {
  if (!data) return data;
  
  const sensitiveFields = ['password', 'token', 'authorization', 'creditCard'];
  const cleaned = { ...data };

  sensitiveFields.forEach(field => {
    if (field in cleaned) {
      cleaned[field] = '[REDACTED]';
    }
  });

  return cleaned;
};

// Custom logging functions with type safety
export interface LogMetadata {
  userId?: string;
  requestId?: string;
  component?: string;
  [key: string]: any;
}

class Logger {
  error(message: string, metadata?: LogMetadata, error?: Error) {
    logger.error(message, {
      ...cleanSensitiveData(metadata),
      ...(error && { error: error.stack || error.message }),
    });
  }

  warn(message: string, metadata?: LogMetadata) {
    logger.warn(message, cleanSensitiveData(metadata));
  }

  info(message: string, metadata?: LogMetadata) {
    logger.info(message, cleanSensitiveData(metadata));
  }

  http(message: string, metadata?: LogMetadata) {
    logger.http(message, cleanSensitiveData(metadata));
  }

  debug(message: string, metadata?: LogMetadata) {
    logger.debug(message, cleanSensitiveData(metadata));
  }

  // Log audit events separately
  audit(action: string, metadata: LogMetadata) {
    logger.info(`AUDIT: ${action}`, {
      ...cleanSensitiveData(metadata),
      audit: true,
      timestamp: new Date().toISOString(),
    });
  }
}

// Export singleton instance
export const appLogger = new Logger();

// Export winston logger for advanced usage if needed
export const winstonLogger = logger;

// Export types
export type LogLevel = keyof typeof levels;