// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { pool } from './config/database';
import { rateLimiter } from './middleware/auth';
import authRoutes from './routes/auth';
import emailVerificationRoutes from './routes/emailVerification';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(rateLimiter());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/email', emailVerificationRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Startup
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

export default app;