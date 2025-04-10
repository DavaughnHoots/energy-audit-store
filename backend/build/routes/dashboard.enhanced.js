import express from 'express';
import { enhancedDashboardService } from '../services/dashboardService.enhanced.js';
import { getUniqueRecommendationsByType, getAggregatedEnergyData } from '../services/dashboardService.enhanced.aggregation.js';
import * as productComparisonService from '../services/productComparisonService.js';
import { pool } from '../config/database.js';
import { appLogger } from '../config/logger.js';
import { createLogMetadata } from '../utils/logger.js';
const router = express.Router();
/**
 * @route GET /api/dashboard/stats
 * @desc Get enhanced dashboard statistics for the user
 * @access Private
 */
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                error: 'Authentication required',
                details: 'Please sign in to access your dashboard statistics',
                code: 'AUTH_REQUIRED'
            });
        }
        // Check if a specific audit ID is requested
        const newAuditId = req.query.newAudit;
        // Check if user has completed initial setup
        const userSetupResult = await pool.query(`SELECT EXISTS (
         SELECT 1 FROM user_settings
         WHERE user_id = $1
         AND property_details IS NOT NULL
       ) as has_setup`, [userId]);
        if (!userSetupResult.rows[0].has_setup) {
            return res.status(403).json({
                error: 'Setup required',
                details: 'Please complete your property setup to view dashboard statistics',
                code: 'SETUP_REQUIRED',
                setupUrl: '/settings/property'
            });
        }
        // Get enhanced dashboard stats, passing the newAuditId if provided
        let stats = await enhancedDashboardService.getUserStats(userId, newAuditId);
        // Try to get unique recommendations by type across all user audits
        try {
            appLogger.info('Fetching unique recommendations by type for user', { userId });
            const uniqueRecommendations = await getUniqueRecommendationsByType(userId);
            if (uniqueRecommendations.length > 0) {
                appLogger.info('Found unique recommendations by type', {
                    count: uniqueRecommendations.length,
                    userId
                });
                // Replace enhancedRecommendations with unique recommendations if available
                stats.enhancedRecommendations = uniqueRecommendations;
                // Update data summary to indicate we have detailed data
                if (stats.dataSummary) {
                    stats.dataSummary.isUsingDefaultData = false;
                    stats.dataSummary.dataSource = 'detailed';
                }
            }
        }
        catch (error) {
            appLogger.error('Error fetching unique recommendations by type:', {
                error: error instanceof Error ? error.message : String(error),
                userId
            });
            // Continue with existing recommendations if fetch fails
        }
        // Try to get aggregated energy data across all user audits
        try {
            appLogger.info('Fetching aggregated energy data for user', { userId });
            const energyData = await getAggregatedEnergyData(userId);
            if ((energyData.energyBreakdown && energyData.energyBreakdown.length > 0) ||
                (energyData.consumption && energyData.consumption.length > 0) ||
                (energyData.savingsAnalysis && energyData.savingsAnalysis.length > 0)) {
                appLogger.info('Found aggregated energy data', {
                    userId,
                    hasEnergyBreakdown: energyData.energyBreakdown.length > 0,
                    hasConsumption: energyData.consumption.length > 0,
                    hasSavingsAnalysis: energyData.savingsAnalysis.length > 0
                });
                // Replace energyAnalysis with aggregated data
                stats.energyAnalysis = energyData;
                // Update data summary to indicate we have detailed data
                if (stats.dataSummary) {
                    stats.dataSummary.isUsingDefaultData = false;
                    stats.dataSummary.dataSource = 'detailed';
                }
            }
        }
        catch (error) {
            appLogger.error('Error fetching aggregated energy data:', {
                error: error instanceof Error ? error.message : String(error),
                userId
            });
            // Continue with existing energy data if fetch fails
        }
        // Add detailed debugging for recommendations
        appLogger.debug('General dashboard response:', {
            userId,
            hasEnhancedRecommendations: !!stats.enhancedRecommendations,
            recommendationsCount: stats.enhancedRecommendations?.length || 0,
            dataSummary: stats.dataSummary,
            usingDefaultRecommendations: stats.dataSummary?.isUsingDefaultData
        });
        // If no recommendations exist, explicitly add default recommendations
        if (!stats.enhancedRecommendations || stats.enhancedRecommendations.length === 0) {
            appLogger.warn('No recommendations found for dashboard, adding defaults', {
                userId,
                auditId: newAuditId
            });
            // Get default recommendations from the service
            const defaultRecommendations = enhancedDashboardService['generateDefaultRecommendations']();
            // Update stats with default recommendations
            stats.enhancedRecommendations = defaultRecommendations;
            // Update data summary to indicate we're using default data
            if (stats.dataSummary) {
                stats.dataSummary.isUsingDefaultData = true;
                stats.dataSummary.dataSource = 'generated';
            }
            else {
                stats.dataSummary = {
                    hasDetailedData: false,
                    isUsingDefaultData: true,
                    dataSource: 'generated'
                };
            }
            appLogger.info('Added default recommendations for general dashboard', {
                userId,
                recommendationsCount: defaultRecommendations.length
            });
        }
        // Add last updated timestamp
        const response = {
            ...stats,
            lastUpdated: new Date().toISOString(),
            refreshInterval: 300000 // 5 minutes in milliseconds
        };
        // Final check to ensure recommendations exist
        appLogger.debug('Final general dashboard response:', {
            userId,
            hasRecommendations: !!response.enhancedRecommendations && response.enhancedRecommendations.length > 0,
            recommendationsCount: response.enhancedRecommendations?.length || 0,
            context: 'dashboard.enhanced.stats'
        });
        res.json(response);
    }
    catch (error) {
        const isOperationalError = error instanceof Error &&
            error.message.includes('Failed to fetch dashboard statistics');
        if (isOperationalError) {
            res.status(500).json({
                error: 'Service temporarily unavailable',
                details: 'Unable to retrieve dashboard statistics. Please try again later.',
                code: 'SERVICE_UNAVAILABLE',
                retryAfter: 60 // seconds
            });
        }
        else {
            // Unexpected errors
            appLogger.error('Unexpected dashboard error:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            res.status(500).json({
                error: 'Internal server error',
                details: 'An unexpected error occurred. Our team has been notified.',
                code: 'INTERNAL_ERROR'
            });
        }
    }
});
/**
 * @route GET /api/dashboard/product-history
 * @desc Get product history from past audits
 * @access Private
 */
router.get('/product-history', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                error: 'Authentication required',
                details: 'Please sign in to access your product history',
                code: 'AUTH_REQUIRED'
            });
        }
        // Get limit from query params, default to 20
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
        appLogger.info(`Fetching product history for user ${userId} with limit ${limit}`);
        try {
            // Get product history - this now returns an empty array on error instead of throwing
            const productHistory = await productComparisonService.getProductHistory(userId, limit);
            // Always return success with the product history (which may be empty)
            res.json({ success: true, productHistory });
        }
        catch (serviceError) {
            // This shouldn't happen anymore since getProductHistory handles errors internally,
            // but just in case, we'll handle it here too
            appLogger.error('Unexpected error from productComparisonService:', createLogMetadata(req, { serviceError }));
            // Return an empty array instead of an error
            res.json({
                success: true,
                productHistory: [],
                warning: 'Could not retrieve product history, showing empty list instead'
            });
        }
    }
    catch (error) {
        appLogger.error('Error in product history endpoint:', createLogMetadata(req, {
            error,
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined
        }));
        // Return an empty array instead of an error
        res.json({
            success: true,
            productHistory: [],
            warning: 'Could not retrieve product history, showing empty list instead'
        });
    }
});
/**
 * @route GET /api/dashboard/audit-stats/:auditId
 * @desc Get enhanced dashboard statistics for a specific audit ID
 * @access Private
 */
router.get('/audit-stats/:auditId', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                error: 'Authentication required',
                details: 'Please sign in to access your dashboard statistics',
                code: 'AUTH_REQUIRED'
            });
        }
        const auditId = req.params.auditId;
        if (!auditId) {
            return res.status(400).json({
                error: 'Bad request',
                details: 'Audit ID is required',
                code: 'MISSING_AUDIT_ID'
            });
        }
        appLogger.info(`Fetching specific audit stats for user ${userId} and audit ${auditId}`, createLogMetadata(req, {
            auditId,
            userId
        }));
        // Verify the audit belongs to the user or is public
        const auditResult = await pool.query(`SELECT user_id FROM energy_audits WHERE id = $1`, [auditId]);
        if (auditResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Audit not found',
                details: 'The requested audit does not exist',
                code: 'AUDIT_NOT_FOUND'
            });
        }
        if (auditResult.rows[0].user_id && auditResult.rows[0].user_id !== userId) {
            return res.status(403).json({
                error: 'Access denied',
                details: 'You do not have permission to access this audit',
                code: 'ACCESS_DENIED'
            });
        }
        // Get enhanced dashboard stats for this specific audit
        const stats = await enhancedDashboardService.getUserStats(userId, auditId);
        // Add detailed debugging for recommendations
        appLogger.debug('Audit-specific dashboard response:', {
            userId,
            auditId,
            hasEnhancedRecommendations: !!stats.enhancedRecommendations,
            recommendationsCount: stats.enhancedRecommendations?.length || 0,
            dataSummary: stats.dataSummary,
            usingDefaultRecommendations: stats.dataSummary?.isUsingDefaultData
        });
        // If no recommendations exist, explicitly add default recommendations
        if (!stats.enhancedRecommendations || stats.enhancedRecommendations.length === 0) {
            appLogger.warn('No recommendations found for audit, adding defaults', {
                userId,
                auditId
            });
            // Get default recommendations from the service
            const defaultRecommendations = enhancedDashboardService['generateDefaultRecommendations']();
            // Update stats with default recommendations
            stats.enhancedRecommendations = defaultRecommendations;
            // Update data summary to indicate we're using default data
            if (stats.dataSummary) {
                stats.dataSummary.isUsingDefaultData = true;
                stats.dataSummary.dataSource = 'generated';
            }
            else {
                stats.dataSummary = {
                    hasDetailedData: false,
                    isUsingDefaultData: true,
                    dataSource: 'generated'
                };
            }
            appLogger.info('Added default recommendations for audit-specific dashboard', {
                userId,
                auditId,
                recommendationsCount: defaultRecommendations.length
            });
        }
        // Add last updated timestamp
        const response = {
            ...stats,
            lastUpdated: new Date().toISOString(),
            refreshInterval: 300000, // 5 minutes in milliseconds
            specificAuditId: auditId // Include the audit ID for reference
        };
        // Final check to ensure recommendations exist
        appLogger.debug('Final audit-specific dashboard response:', {
            userId,
            auditId,
            hasRecommendations: !!response.enhancedRecommendations && response.enhancedRecommendations.length > 0,
            recommendationsCount: response.enhancedRecommendations?.length || 0
        });
        res.json(response);
    }
    catch (error) {
        appLogger.error('Error fetching specific audit stats:', createLogMetadata(req, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        }));
        res.status(500).json({
            error: 'Internal server error',
            details: 'An unexpected error occurred while fetching audit statistics',
            code: 'INTERNAL_ERROR'
        });
    }
});
/**
 * @route POST /api/dashboard/preferences
 * @desc Update user preferences for recommendations and product filtering
 * @access Private
 */
router.post('/preferences', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        const { categories, budgetConstraint } = req.body;
        // Validate the input
        if (!Array.isArray(categories)) {
            return res.status(400).json({
                error: 'Invalid categories',
                details: 'Categories must be an array of strings',
                code: 'INVALID_INPUT'
            });
        }
        if (budgetConstraint !== undefined &&
            (typeof budgetConstraint !== 'number' || budgetConstraint < 0)) {
            return res.status(400).json({
                error: 'Invalid budget constraint',
                details: 'Budget constraint must be a non-negative number',
                code: 'INVALID_INPUT'
            });
        }
        // Update the preferences
        await enhancedDashboardService.updateUserPreferences(userId, categories, budgetConstraint);
        res.json({
            success: true,
            message: 'Preferences updated successfully'
        });
    }
    catch (error) {
        appLogger.error('Error updating user preferences:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        res.status(500).json({
            error: 'Internal server error',
            details: 'An unexpected error occurred while updating preferences',
            code: 'INTERNAL_ERROR'
        });
    }
});
/**
 * @route POST /api/dashboard/recommendation/:id/status
 * @desc Update recommendation status (active/implemented)
 * @access Private
 */
router.post('/recommendation/:id/status', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        const recommendationId = req.params.id;
        const { status, implementationDate } = req.body;
        // Validate the input
        if (status !== 'active' && status !== 'implemented') {
            return res.status(400).json({
                error: 'Invalid status',
                details: 'Status must be either "active" or "implemented"',
                code: 'INVALID_INPUT'
            });
        }
        // Parse implementation date if provided
        let parsedImplementationDate = undefined;
        if (implementationDate) {
            parsedImplementationDate = new Date(implementationDate);
            if (isNaN(parsedImplementationDate.getTime())) {
                return res.status(400).json({
                    error: 'Invalid implementation date',
                    details: 'Implementation date must be a valid date string',
                    code: 'INVALID_INPUT'
                });
            }
        }
        // Update the recommendation status
        await enhancedDashboardService.updateRecommendationStatus(userId, recommendationId, status, parsedImplementationDate);
        res.json({
            success: true,
            message: 'Recommendation status updated successfully'
        });
    }
    catch (error) {
        appLogger.error('Error updating recommendation status:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        res.status(500).json({
            error: 'Internal server error',
            details: 'An unexpected error occurred while updating recommendation status',
            code: 'INTERNAL_ERROR'
        });
    }
});
export default router;
//# sourceMappingURL=dashboard.enhanced.js.map