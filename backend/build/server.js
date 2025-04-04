import 'dotenv/config';
// Check for required environment variables
import './scripts/check_env.js';
import express from 'express';
import { appLogger, loggerContextMiddleware, LoggerInitializer, createLogMetadata } from './utils/logger.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { standardLimiter, authLimiter, apiLimiter } from './middleware/rateLimitMiddleware.js';
import { authenticate } from './middleware/auth.js';
import { optionalTokenValidation } from './middleware/optionalTokenValidation.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import educationRoutes from './routes/education.js';
import energyAuditRoutes from './routes/energyAudit.js';
// Import enhanced routes (with better error handling)
import auditHistoryRoutes from './routes/auditHistory.enhanced.js';
import reportDataRoutes from './routes/reportData.enhanced.js';
// Import the enhanced admin routes
import adminRoutes from './routes/admin.enhanced.js';
import userPropertySettingsRoutes from './routes/userPropertySettings.js';
import recommendationsRoutes from './routes/recommendations.js';
import userProfileRoutes from './routes/userProfile.js';
import productsRoutes from './routes/products.js';
import visualizationRoutes from './routes/visualization.js';
import productRecommendationsRoutes from './routes/productRecommendations.js';
import comparisonsRoutes from './routes/comparisons.js';
import energyConsumptionRoutes from './routes/energyConsumption.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { runSearchMigration } from './scripts/heroku_migration.js';
import { runEnergyConsumptionMigration } from './scripts/run_energy_consumption_migration.js';
import { runEducationMigration } from './scripts/run_education_migration.js';
import fs from 'fs';
import { associateOrphanedAudits } from './scripts/associate_orphaned_audits.js';

// Setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize logger before starting server
try {
  LoggerInitializer.initialize();
} catch (error) {
  console.error('Failed to initialize logger:', error);
  process.exit(1);
}

// Run database migrations for production environment
if (process.env.NODE_ENV === 'production') {
  // Run search migration
  runSearchMigration()
    .then(() => {
      appLogger.info('Search migration completed on startup');
    })
    .catch(error => {
      appLogger.error('Error running search migration on startup', { error });
    });
    
  // Run other migrations...
  // Code omitted for brevity
}

const app = express();

// Trust proxy - required for Heroku
app.set('trust proxy', 1);

// Request ID middleware
app.use((req, res, next) => {
  req.id = req.id || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Apply logger context middleware
app.use(loggerContextMiddleware);

// Security middleware
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL || 'https://energy-audit-store-e66479ed4f2b.herokuapp.com']
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

app.use(cors({
  origin: allowedOrigins,
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
app.use('/api/recommendations', apiLimiter);
app.use('/', standardLimiter);

// Rate limit debugging middleware
app.use((req, res, next) => {
  // Debugging code omitted for brevity
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/education', educationRoutes);
// Register specialized routes BEFORE the main energy audit route to prevent route conflicts
app.use('/api/energy-audit/history', authenticate, auditHistoryRoutes);
// Use a parameter pattern that matches the frontend's expected URL format
app.use('/api/energy-audit/:id/report-data', optionalTokenValidation, reportDataRoutes);
app.use('/api/energy-audit', energyAuditRoutes);
app.use('/api/settings/property', authenticate, userPropertySettingsRoutes);
app.use('/api/recommendations', authenticate, recommendationsRoutes);
app.use('/api/recommendations/products', productRecommendationsRoutes);
app.use('/api/comparisons', comparisonsRoutes);
app.use('/api/user-profile', userProfileRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/visualization', visualizationRoutes);
app.use('/api/energy-consumption', energyConsumptionRoutes);

// Use the enhanced admin routes - THIS IS THE KEY CHANGE
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from the React app
// In production, the frontend build is in ./public (relative to build/server.js)
let staticPath = path.join(__dirname, './public');
console.log('Primary static files path:', staticPath);
console.log('Primary directory exists check:', fs.existsSync(staticPath));

// If the primary path doesn't exist, try alternative paths - code omitted for brevity

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  const requestId = req.id || uuidv4();
  
  // Log the error
  appLogger.error('Unhandled error', createLogMetadata(req, {
    requestId,
    error: err
  }));

  const status = err.status || 500;
  const responseBody = {
    error: err.code || 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    requestId
  };

  res.status(status).json(responseBody);
});

// The "catchall" handler for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Index file not found. Check server logs for details.');
  }
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  appLogger.info('Server started', createLogMetadata(undefined, {
    port: PORT,
    nodeEnv: process.env.NODE_ENV
  }));
});

// Handle uncaught exceptions and graceful shutdown - code omitted for brevity

export default app;
