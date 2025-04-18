import express from 'express';
import { body, validationResult } from 'express-validator';
import SurveyService from '../services/SurveyService.js';
import { appLogger } from '../config/logger.js';
import { validateToken } from '../middleware/tokenValidation.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { AuthenticatedRequest } from '../types/auth.js';

const router = express.Router();

/**
 * @route POST /api/survey/responses
 * @desc Submit a survey response
 * @access Public (no authentication required for survey responses)
 */
router.post('/responses', [
  // Validate that responses is an object
  body('responses').isObject().withMessage('Responses must be an object'),
  
  // Validate completion time if provided
  body('completionTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Completion time must be a positive integer'),
  validateRequest
], async (req: AuthenticatedRequest, res: express.Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { responses, completionTime } = req.body;
    
    // Get user ID if authenticated
    const userId = req.user?.id || null;
    
    // Save survey response
    const responseId = await SurveyService.saveResponse(
      userId,
      responses,
      req.headers['user-agent'] || null,
      req.ip || null,
      completionTime || null
    );
    
    res.status(201).json({
      success: true,
      message: 'Survey response submitted successfully',
      responseId
    });
  } catch (error) {
    appLogger.error('Error submitting survey response:', { error });
    res.status(500).json({
      success: false,
      message: 'An error occurred while submitting the survey response'
    });
  }
});

/**
 * @route GET /api/survey/summary
 * @desc Get summary of survey responses
 * @access Admin only
 */
router.get('/summary', validateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  // Check if user is admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized, admin access required' });
  }
  try {
    const summary = await SurveyService.getSurveySummary();
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    appLogger.error('Error retrieving survey summary:', { error });
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving the survey summary'
    });
  }
});

/**
 * @route GET /api/survey/text-responses
 * @desc Get all text responses for analysis
 * @access Admin only
 */
router.get('/text-responses', validateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  // Check if user is admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized, admin access required' });
  }
  try {
    const textResponses = await SurveyService.getTextResponses();
    
    res.json({
      success: true,
      data: textResponses
    });
  } catch (error) {
    appLogger.error('Error retrieving text responses:', { error });
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving the text responses'
    });
  }
});

/**
 * @route GET /api/survey/admin/responses
 * @desc Get paginated survey responses for admin dashboard
 * @access Admin only
 */
router.get('/admin/responses', validateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  // Check if user is admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized, admin access required' });
  }
  
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    
    // Get paginated responses
    const results = await SurveyService.getPaginatedResponses(page, limit);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    appLogger.error('Error retrieving paginated survey responses:', { error });
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving survey responses'
    });
  }
});

/**
 * @route GET /api/survey/responses/:id
 * @desc Get a specific survey response by ID
 * @access Admin only
 */
router.get('/responses/:id', validateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  // Check if user is admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized, admin access required' });
  }
  
  try {
    const responseId = req.params.id;
    const surveyResponse = await SurveyService.getResponseById(responseId);
    
    if (!surveyResponse) {
      return res.status(404).json({ error: 'Survey response not found' });
    }
    
    res.json({
      success: true,
      data: surveyResponse
    });
  } catch (error) {
    appLogger.error('Error retrieving survey response:', { error });
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving the survey response'
    });
  }
});

export default router;
