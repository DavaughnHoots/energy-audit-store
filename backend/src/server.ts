import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authenticate } from './middleware/auth';
import authRouter from './routes/auth';
import dashboardRouter from './routes/dashboard';
import userSettingsRouter from './routes/userSettings';
import userPropertySettingsRouter from './routes/userPropertySettings';
import energyConsumptionRouter from './routes/energyConsumption';

// Verify all routers are defined
if (!authRouter || !dashboardRouter || !userSettingsRouter || !userPropertySettingsRouter || !energyConsumptionRouter) {
  throw new Error('One or more routers are undefined');
}

const app = express();

// Middleware
// Configure CORS with more detailed options
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN'],
  exposedHeaders: ['X-Token-Expired'],
  maxAge: 86400, // 24 hours in seconds
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Log incoming requests in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRouter);

// Protected routes with validation
app.use('/api/dashboard', authenticate, dashboardRouter);
app.use('/api/settings', authenticate, userSettingsRouter);
app.use('/api/user-property-settings', authenticate, userPropertySettingsRouter);
app.use('/api/settings/energy', authenticate, energyConsumptionRouter);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
