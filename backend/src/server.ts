// Add this at the top of the file
declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: any; // TODO: Define proper user type
    }
  }
}

import 'dotenv/config.js';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { appLogger, loggerContextMiddleware, LoggerInitializer, createLogMetadata } from './utils/logger.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { standardLimiter, authLimiter, apiLimiter } from './middleware/rateLimitMiddleware.js';
import { authenticate } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import energyAuditRoutes from './routes/energyAudit.js';
import userPropertySettingsRoutes from './routes/userPropertySettings.js';
import recommendationsRoutes from './routes/recommendations.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AppError extends Error {
  status?: number;
  code?: string;
}

// Initialize logger before starting server
try {
  LoggerInitializer.initialize();
} catch (error) {
  console.error('Failed to initialize logger:', error);
  process.exit(1);
}

const app = express();

// Trust proxy - required for Heroku
app.set('trust proxy', 1);

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.id = req.id || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Apply logger context middleware
app.use(loggerContextMiddleware);

// Security middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    process.env.FRONTEND_URL || 'https://your-app-name.herokuapp.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials'
  ],
  exposedHeaders: ['Set-Cookie', 'Date', 'ETag']
}));

// Cookie middleware (before rate limiting)
app.use(cookieParser(process.env.JWT_SECRET));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api/products', apiLimiter);
app.use('/api/recommendations', apiLimiter);
app.use('/', standardLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/energy-audit', energyAuditRoutes);
app.use('/api/settings/property', authenticate, userPropertySettingsRoutes);
app.use('/api/recommendations', authenticate, recommendationsRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../../../dist')));

// Sanitize error message to prevent sensitive data leakage
const sanitizeErrorMessage = (message: string): string => {
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /authorization/i,
    /key/i,
    /credential/i
  ];

  sensitivePatterns.forEach(pattern => {
    message = message.replace(pattern, '[REDACTED]');
  });

  return message;
};

// Enhanced error handling middleware
app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.id || uuidv4();
  const errorContext = {
    requestId,
    type: 'middleware_error',
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    query: sanitizeErrorMessage(JSON.stringify(req.query)),
    params: sanitizeErrorMessage(JSON.stringify(req.params)),
    error: {
      name: err.name,
      message: sanitizeErrorMessage(err.message),
      code: err.code,
      status: err.status,
      stack: process.env.NODE_ENV === 'development' ? sanitizeErrorMessage(err.stack || '') : undefined
    }
  };

  appLogger.error('Unhandled error', createLogMetadata(req, errorContext));

  const status = err.status || 500;
  const responseBody = {
    error: err.code || 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? sanitizeErrorMessage(err.message) : 'An unexpected error occurred',
    requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: sanitizeErrorMessage(err.stack || '') })
  };

  res.status(status).json(responseBody);
});

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../../dist/index.html'));
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  appLogger.info('Server started', createLogMetadata(undefined, {
    port: PORT,
    nodeEnv: process.env.NODE_ENV
  }));
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  appLogger.error('Uncaught Exception', createLogMetadata(undefined, {
    type: 'uncaughtException',
    error
  }));
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  appLogger.error('Unhandled Rejection', createLogMetadata(undefined, {
    type: 'unhandledRejection',
    reason,
    promise
  }));
  // Don't exit the process here as it may be handled
});

// Graceful shutdown
const gracefulShutdown = () => {
  appLogger.info('Received shutdown signal', createLogMetadata(undefined, {
    type: 'shutdown'
  }));
  server.close(() => {
    appLogger.info('Server closed', createLogMetadata(undefined, {
      type: 'shutdown'
    }));
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;
