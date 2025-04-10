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
// Import enhanced routes (with better error handling)
import auditHistoryRoutes from './routes/auditHistory.enhanced.js';
import reportDataRoutes from './routes/reportData.enhanced.js';
// Use enhanced admin routes
import adminRoutes from './routes/admin.enhanced.js';
// Original imports kept but disabled: ./routes/auditHistory.js
import userPropertySettingsRoutes from './routes/userPropertySettings.js';
// Use enhanced recommendations routes with badge integration
import recommendationsRoutes from './routes/recommendations.enhanced.js';
import userProfileRoutes from './routes/userProfile.js';
import productsRoutes from './routes/products.js';
import visualizationRoutes from './routes/visualization.js';
import productRecommendationsRoutes from './routes/productRecommendations.js';
import comparisonsRoutes from './routes/comparisons.js';
import energyConsumptionRoutes from './routes/energyConsumption.js';
// Using analytics routes
import analyticsRoutes from './routes/analytics.js';
import directAdminRoutes from './routes/direct-admin.js';
import badgesRoutes from './routes/badges.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { runSearchMigration } from './scripts/heroku_migration.js';
import { runEnergyConsumptionMigration } from './scripts/run_energy_consumption_migration.js';
import { runEducationMigration } from './scripts/run_education_migration.js';
import fs from 'fs';
import { associateOrphanedAudits } from './scripts/associate_orphaned_audits.js';
// Product comparison migration removed - table already exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Initialize logger before starting server
try {
    LoggerInitializer.initialize();
}
catch (error) {
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
    // Run energy consumption migration
    runEnergyConsumptionMigration()
        .then(result => {
        appLogger.info('Energy consumption migration completed on startup', { result });
    })
        .catch(error => {
        appLogger.error('Error running energy consumption migration on startup', { error });
    });
    // Run education tables migration
    runEducationMigration()
        .then(result => {
        appLogger.info('Education tables migration completed on startup', { result });
    })
        .catch(error => {
        appLogger.error('Error running education tables migration on startup', { error });
    });
    // Run initial orphaned audit association
    associateOrphanedAudits()
        .then(result => {
        appLogger.info('Initial orphaned audit association completed', { result });
    })
        .catch(error => {
        appLogger.error('Error running initial orphaned audit association', { error });
    });
    // Set up periodic orphaned audit association (every hour)
    setInterval(() => {
        appLogger.info('Running scheduled orphaned audit association');
        associateOrphanedAudits()
            .then(result => {
            appLogger.info('Scheduled orphaned audit association completed', { result });
        })
            .catch(error => {
            appLogger.error('Error running scheduled orphaned audit association', { error });
        });
    }, 60 * 60 * 1000); // Run every hour
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
// Rate limiting is now globally disabled via the DISABLE_RATE_LIMITING flag in rateLimitMiddleware.ts
// These routes will automatically use the noLimitMiddleware due to the flag
app.use('/api/auth', authLimiter); // Will use noLimitMiddleware due to DISABLE_RATE_LIMITING flag
app.use('/api/recommendations', apiLimiter); // Will use noLimitMiddleware due to DISABLE_RATE_LIMITING flag
app.use('/', standardLimiter); // Will use noLimitMiddleware due to DISABLE_RATE_LIMITING flag
// Rate limit debugging middleware
app.use((req, res, next) => {
    // Add a listener for the rate limit headers being set
    const oldSetHeader = res.setHeader;
    res.setHeader = function (name, value) {
        if (name.toLowerCase().includes('ratelimit')) {
            appLogger.info('Rate limit header set', {
                header: name,
                value,
                path: req.path,
                method: req.method,
                requestId: req.id
            });
        }
        return oldSetHeader.apply(this, [name, value]);
    };
    // Listen for specific response codes
    const oldStatus = res.status;
    res.status = function (code) {
        if (code === 429) {
            appLogger.warn('Rate limit exceeded', {
                path: req.path,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('user-agent'),
                requestId: req.id
            });
        }
        return oldStatus.apply(this, [code]);
    };
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
// Use enhanced energy audit routes with badge integration
app.use('/api/energy-audit', await import('./routes/energyAudit.enhanced.js').then(m => m.default));
app.use('/api/settings/property', authenticate, userPropertySettingsRoutes);
app.use('/api/recommendations', authenticate, recommendationsRoutes);
app.use('/api/recommendations/products', productRecommendationsRoutes);
app.use('/api/comparisons', comparisonsRoutes);
app.use('/api/user-profile', userProfileRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/visualization', visualizationRoutes);
app.use('/api/energy-consumption', energyConsumptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/direct-admin', authenticate, directAdminRoutes);
app.use('/api/badges', badgesRoutes);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Debug endpoint to verify enhanced services are being used
app.get('/api/debug/config', (req, res) => {
    res.json({
        message: 'Using enhanced configuration',
        timestamp: new Date().toISOString(),
        routes: {
            admin: 'Enhanced',
            analytics: 'Standard with enhanced service',
            auditHistory: 'Enhanced',
            reportData: 'Enhanced'
        }
    });
});
// Serve static files from the React app
// In production, the frontend build is in ./public (relative to build/server.js)
let staticPath = path.join(__dirname, './public');
console.log('Primary static files path:', staticPath);
console.log('Primary directory exists check:', fs.existsSync(staticPath));
// If the primary path doesn't exist, try alternative paths
if (!fs.existsSync(staticPath)) {
    const altPath1 = path.join(__dirname, '../public');
    console.log('Trying alternative path 1:', altPath1);
    console.log('Alt path 1 exists check:', fs.existsSync(altPath1));
    const altPath2 = path.join(__dirname, '../dist');
    console.log('Trying alternative path 2:', altPath2);
    console.log('Alt path 2 exists check:', fs.existsSync(altPath2));
    const altPath3 = path.join(process.cwd(), 'public');
    console.log('Trying alternative path 3:', altPath3);
    console.log('Alt path 3 exists check:', fs.existsSync(altPath3));
    const altPath4 = path.join(process.cwd(), 'dist');
    console.log('Trying alternative path 4:', altPath4);
    console.log('Alt path 4 exists check:', fs.existsSync(altPath4));
    const altPath5 = path.join(process.cwd(), 'backend/public');
    console.log('Trying alternative path 5:', altPath5);
    console.log('Alt path 5 exists check:', fs.existsSync(altPath5));
    // Use the first alternative path that exists
    if (fs.existsSync(altPath1)) {
        staticPath = altPath1;
        console.log('Using alternative path 1');
    }
    else if (fs.existsSync(altPath2)) {
        staticPath = altPath2;
        console.log('Using alternative path 2');
    }
    else if (fs.existsSync(altPath3)) {
        staticPath = altPath3;
        console.log('Using alternative path 3');
    }
    else if (fs.existsSync(altPath4)) {
        staticPath = altPath4;
        console.log('Using alternative path 4');
    }
    else if (fs.existsSync(altPath5)) {
        staticPath = altPath5;
        console.log('Using alternative path 5');
    }
}
// List the contents of the static directory if it exists
if (fs.existsSync(staticPath)) {
    console.log('Static directory contents:', fs.readdirSync(staticPath));
}
app.use(express.static(staticPath));
// Sanitize error message to prevent sensitive data leakage
const sanitizeErrorMessage = (message) => {
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
app.use((err, req, res, next) => {
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
app.get('*', (req, res) => {
    const indexPath = path.join(staticPath, 'index.html');
    console.log('Trying to serve index.html from:', indexPath);
    console.log('File exists check:', fs.existsSync(indexPath));
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    }
    else {
        // List the contents of the directory to help debug
        console.log('Directory contents:', fs.readdirSync(__dirname));
        if (fs.existsSync(path.join(__dirname, 'public'))) {
            console.log('Public directory contents:', fs.readdirSync(path.join(__dirname, 'public')));
        }
        res.status(404).send('Index file not found. Check server logs for details.');
    }
});
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    appLogger.info('Server started (ENHANCED VERSION)', createLogMetadata(undefined, {
        port: PORT,
        nodeEnv: process.env.NODE_ENV,
        version: 'enhanced-analytics'
    }));
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    appLogger.error('Uncaught Exception', createLogMetadata(undefined, {
        type: 'uncaughtException',
        error
    }));
    process.exit(1);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
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
//# sourceMappingURL=server.js.map