import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { pool } from '../config/database.js';
import { appLogger, createLogMetadata } from '../utils/logger.js';

const router = express.Router();

/**
 * @route GET /api/direct-admin/dashboard
 * @desc Direct SQL dashboard data (bypassing the analyticsService)
 * @access Private (Admin only)
 */
router.get('/dashboard', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'month';
    
    appLogger.info('Direct admin dashboard accessed', createLogMetadata(req, {
      timeframe,
      userId: req.user?.id
    }));

    // Generate timeframe clause for SQL query
    let timeframeClause;
    switch (timeframe) {
      case 'day':
        timeframeClause = '>= CURRENT_DATE';
        break;
      case 'week':
        timeframeClause = '>= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'year':
        timeframeClause = '>= CURRENT_DATE - INTERVAL \'1 year\'';
        break;
      case 'month':
      default:
        timeframeClause = '>= CURRENT_DATE - INTERVAL \'30 days\'';
        break;
    }

    // Query users table directly - using 'id' column which we know exists
    const userStatsQuery = await pool.query(
      `SELECT 
        COUNT(DISTINCT id) as active_users,
        COUNT(DISTINCT CASE WHEN created_at ${timeframeClause} THEN id END) as new_users
       FROM users`
    );
    
    // Get audit counts if the energy_audits table exists
    let auditStats = { totalAudits: 0, completedAudits: 0 };
    try {
      const auditQuery = await pool.query(
        `SELECT COUNT(*) as total_audits
         FROM information_schema.tables 
         WHERE table_name = 'energy_audits'`
      );
      
      // Only try to query energy_audits if it exists
      if (auditQuery.rows[0].total_audits > 0) {
        const auditCountQuery = await pool.query(
          `SELECT 
            COUNT(*) as total_audits,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_audits
           FROM energy_audits
           WHERE created_at ${timeframeClause}`
        );
        
        auditStats = {
          totalAudits: parseInt(auditCountQuery.rows[0]?.total_audits || '0', 10),
          completedAudits: parseInt(auditCountQuery.rows[0]?.completed_audits || '0', 10)
        };
      }
    } catch (error) {
      console.log('Energy audits table may not exist, using default values:', error.message);
    }

    // Construct metrics object with values from direct queries
    const metrics = {
      activeUsers: parseInt(userStatsQuery.rows[0]?.active_users || '0', 10),
      newUsers: parseInt(userStatsQuery.rows[0]?.new_users || '0', 10),
      ...auditStats,
      productEngagement: {},
      averageSavings: 0,
      topProducts: [],
      lastUpdated: new Date().toISOString()
    };

    res.json(metrics);
  } catch (error) {
    appLogger.error('Direct admin dashboard error:', createLogMetadata(req, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }));

    res.status(500).json({
      error: 'Failed to retrieve admin dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
