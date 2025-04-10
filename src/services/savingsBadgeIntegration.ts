/**
 * Savings Badge Integration Service
 * 
 * Connects savings calculations to the badge system, enabling badges
 * to be earned based on financial savings from implemented recommendations.
 */

import { badgeService } from './badgeService';
import { 
  getActualSavings, 
  calculateTotalActualSavings 
} from '../utils/financialCalculations';
import { AuditRecommendation } from '../types/energyAudit';

// Custom event for savings calculations
export const SAVINGS_CALCULATED_EVENT = 'savingsCalculated';

// Savings thresholds for different badge tiers (in dollars)
export const SAVINGS_THRESHOLDS = {
  BRONZE: 100,
  SILVER: 500,
  GOLD: 1000,
  PLATINUM: 2500
};

interface SavingsEventDetail {
  userId: string;
  totalSavings: number;
  recommendationId?: string;
  source: 'implementation' | 'calculation' | 'manual';
}

/**
 * Savings Badge Integration Service
 * Handles the connection between savings calculations and badge evaluations
 */
export const savingsBadgeIntegration = {
  /**
   * Initialize the integration with event listeners
   */
  initialize() {
    // Listen for savings calculation events
    document.addEventListener(SAVINGS_CALCULATED_EVENT, 
      (event: Event) => this.handleSavingsCalculated(event as CustomEvent<SavingsEventDetail>)
    );
    
    console.log('Savings badge integration initialized');
  },
  
  /**
   * Handle a savings calculation event
   */
  async handleSavingsCalculated(event: CustomEvent<SavingsEventDetail>) {
    try {
      const { userId, totalSavings, recommendationId, source } = event.detail;
      
      if (!userId || typeof totalSavings !== 'number') {
        console.error('Invalid savings event data:', event.detail);
        return;
      }
      
      console.log(`Savings calculation detected: $${totalSavings} for user ${userId}`);
      
      // Record activity for badge evaluation
      await badgeService.recordActivity(userId, 'savings_calculated', {
        totalSavings,
        recommendationId,
        source,
        timestamp: new Date().toISOString()
      });
      
      // Check which badges should be evaluated
      await this.checkSavingsBadgeThresholds(userId, totalSavings);
      
      console.log(`Recorded savings activity: $${totalSavings} for user ${userId}`);
    } catch (error) {
      console.error('Error handling savings calculation for badges:', error);
    }
  },
  
  /**
   * Check which savings thresholds have been reached and trigger badge evaluations
   */
  async checkSavingsBadgeThresholds(userId: string, totalSavings: number) {
    try {
      // Define which badges to check based on savings amount
      const badgesToCheck = [];
      
      if (totalSavings >= SAVINGS_THRESHOLDS.BRONZE) {
        badgesToCheck.push('bronze_saver');
      }
      
      if (totalSavings >= SAVINGS_THRESHOLDS.SILVER) {
        badgesToCheck.push('silver_saver');
      }
      
      if (totalSavings >= SAVINGS_THRESHOLDS.GOLD) {
        badgesToCheck.push('gold_saver');
      }
      
      if (totalSavings >= SAVINGS_THRESHOLDS.PLATINUM) {
        badgesToCheck.push('platinum_saver');
      }
      
      // Record activity for each badge separately to trigger evaluation
      for (const badgeId of badgesToCheck) {
        await badgeService.recordActivity(userId, 'savings_threshold_reached', {
          badgeId,
          totalSavings,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`Checked ${badgesToCheck.length} savings badges for user ${userId}`);
    } catch (error) {
      console.error('Error checking savings badge thresholds:', error);
    }
  },
  
  /**
   * Calculate total savings for a user from all implemented recommendations
   * and trigger badge evaluation if necessary
   */
  async calculateTotalSavingsForUser(userId: string, recommendations: AuditRecommendation[]) {
    try {
      // Filter for implemented recommendations
      const implementedRecommendations = recommendations.filter(
        rec => rec.status === 'implemented'
      );
      
      // Calculate total actual savings
      const totalSavings = calculateTotalActualSavings(implementedRecommendations);
      
      if (totalSavings > 0) {
        // Dispatch savings calculated event
        this.dispatchSavingsCalculatedEvent(userId, totalSavings, 'calculation');
      }
      
      return totalSavings;
    } catch (error) {
      console.error('Error calculating total savings for user:', error);
      return 0;
    }
  },
  
  /**
   * Update savings after recommendation implementation
   */
  async handleRecommendationImplemented(
    userId: string, 
    recommendation: AuditRecommendation
  ) {
    try {
      // Get actual savings from the implemented recommendation
      const savings = getActualSavings(recommendation);
      
      if (savings > 0) {
        // Dispatch event for this specific implementation
        this.dispatchSavingsCalculatedEvent(
          userId, 
          savings,
          'implementation',
          recommendation.id
        );
      }
      
      return savings;
    } catch (error) {
      console.error('Error handling recommendation implementation:', error);
      return 0;
    }
  },
  
  /**
   * Helper method to dispatch savings calculation events
   */
  dispatchSavingsCalculatedEvent(
    userId: string, 
    totalSavings: number, 
    source: 'implementation' | 'calculation' | 'manual' = 'calculation',
    recommendationId?: string
  ) {
    // Create and dispatch the custom event
    const event = new CustomEvent<SavingsEventDetail>(SAVINGS_CALCULATED_EVENT, {
      detail: {
        userId,
        totalSavings,
        recommendationId,
        source
      },
      bubbles: true
    });
    
    document.dispatchEvent(event);
    console.log(`Dispatched savings calculation event: $${totalSavings} from ${source}`);
  },
  
  /**
   * Clean up event listeners
   */
  destroy() {
    document.removeEventListener(SAVINGS_CALCULATED_EVENT, 
      (event: Event) => this.handleSavingsCalculated(event as CustomEvent<SavingsEventDetail>)
    );
    console.log('Savings badge integration cleaned up');
  }
};

// Auto-initialize the integration
savingsBadgeIntegration.initialize();
