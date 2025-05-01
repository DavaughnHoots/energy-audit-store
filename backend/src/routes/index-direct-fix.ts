// Index all routes for the application with direct fix for admin analytics

import express from 'express';

// Import all routes
import authRouter from './auth';
import dashboardRouter from './dashboard';
import energyAuditRouter from './energyAudit';
import compareRouter from './comparisons';
import adminRouter from './admin';
import energyConsumptionRouter from './energyConsumption';
import productRouter from './products';
import recommendationsRouter from './recommendations';
import directAdminRouter from './direct-admin';
import visualizationRouter from './visualization';
import badgesRouter from './badges';
import analyticRouter from './analytics';
import userPropSettingsRouter from './userPropertySettings';
import hvacRouter from './hvac';
import educationRouter from './education';
import userProfileRouter from './userProfile';
import userSettingsRouter from './userSettings';
import reportDataRouter from './reportData';
import auditHistoryRouter from './auditHistory';
import surveyRouter from './survey';

// Import the DIRECT FIX version of admin analytics 
import adminAnalyticsRouter from './adminAnalytics.direct-fix';

const router = express.Router();

// Register all routes
router.use('/auth', authRouter);
router.use('/dashboard', dashboardRouter);
router.use('/energy-audit', energyAuditRouter);
router.use('/compare', compareRouter);
router.use('/admin', adminRouter);
router.use('/admin/analytics', adminAnalyticsRouter); // Using direct fix version
router.use('/energy-consumption', energyConsumptionRouter);
router.use('/products', productRouter);
router.use('/recommendations', recommendationsRouter);
router.use('/direct-admin', directAdminRouter);
router.use('/visualization', visualizationRouter);
router.use('/badges', badgesRouter);
router.use('/analytics', analyticRouter);
router.use('/user-property-settings', userPropSettingsRouter);
router.use('/hvac', hvacRouter);
router.use('/education', educationRouter);
router.use('/user-profile', userProfileRouter);
router.use('/user-settings', userSettingsRouter);
router.use('/report-data', reportDataRouter);
router.use('/audit-history', auditHistoryRouter);
router.use('/survey', surveyRouter);

export default router;
