/**
 * Utility class for validating and calculating daily usage hours
 */
export class UsageHoursValidator {
  // Default hours by occupancy type
  private static defaultHoursByOccupancy: Record<string, number> = {
    'fullTime': 16,    // Full-time occupancy (work from home, etc.)
    'standard': 12,    // Standard occupancy (typical working hours)
    'partTime': 8,     // Part-time occupancy (weekdays evenings only)
    'weekendOnly': 6,  // Weekend occupancy (vacation homes)
    'seasonal': 4,     // Seasonal properties with limited use
    'vacant': 2        // Minimal usage but some systems still running
  };
  
  /**
   * Validates daily usage hours and ensures a reasonable value
   * @param usageHours The provided usage hours (may be invalid)
   * @param occupancyData Information about property occupancy
   * @returns Valid usage hours value
   */
  public static validateDailyUsageHours(
    usageHours: number | undefined | null,
    occupancyData: {
      type?: string;
      householdSize?: number;
    }
  ): number {
    // Check if hours are within reasonable range
    if (usageHours === undefined || 
        usageHours === null || 
        isNaN(usageHours) || 
        usageHours <= 0 || 
        usageHours > 24) {
      
      console.warn('Invalid daily usage hours detected', { 
        providedValue: usageHours 
      });
      
      // Generate default based on occupancy patterns
      return this.getDefaultDailyUsageHours(occupancyData);
    }
    
    // Valid value - return as is
    return usageHours;
  }
  
  /**
   * Get default daily usage hours based on occupancy data
   * @param occupancyData Information about property occupancy
   * @returns Estimated daily usage hours
   */
  private static getDefaultDailyUsageHours(
    occupancyData: {
      type?: string;
      householdSize?: number;
    }
  ): number {
    try {
      // Use occupancy type to determine realistic usage hours
      const occupancyType = occupancyData.type || 'standard';
      
      // Get default hours for this occupancy type or standard if not found
      let defaultHours = this.defaultHoursByOccupancy[occupancyType] || 
                        this.defaultHoursByOccupancy.standard;
      
      // Apply household size adjustment if available
      const householdSize = occupancyData.householdSize || 0;
      if (householdSize > 0) {
        // Larger households tend to have longer usage hours
        // Add 0.5 hours per additional person beyond 2 people
        const sizeAdjustment = Math.max(0, (householdSize - 2) * 0.5);
        defaultHours += sizeAdjustment;
      }
      
      // Cap at reasonable maximum
      return Math.min(defaultHours, 24);
    } catch (error) {
      console.error('Error generating default usage hours', error);
      return 12; // Safe fallback
    }
  }
  
  /**
   * Calculate daily usage hours based on wake and sleep time patterns
   * @param wakeTime Wake time pattern (early, standard, late, varied)
   * @param sleepTime Sleep time pattern (early, standard, late, varied)
   * @param occupancyType Base occupancy type
   * @returns Calculated usage hours
   */
  public static calculateHoursFromPattern(
    wakeTime: 'early' | 'standard' | 'late' | 'varied',
    sleepTime: 'early' | 'standard' | 'late' | 'varied',
    occupancyType: string = 'standard'
  ): number {
    // Start with base hours by occupancy type
    let baseHours = this.defaultHoursByOccupancy[occupancyType] || 12;
    
    // Adjust for wake and sleep time
    let adjustment = 0;
    
    // Wake time adjustments
    switch (wakeTime) {
      case 'early':
        adjustment += 1;  // Earlier wake = more hours
        break;
      case 'late':
        adjustment -= 1;  // Later wake = fewer hours
        break;
      case 'varied':
        adjustment += 0;  // No adjustment for varied
        break;
      default:
        adjustment += 0;  // No adjustment for standard
    }
    
    // Sleep time adjustments
    switch (sleepTime) {
      case 'early':
        adjustment -= 1;  // Earlier sleep = fewer hours
        break;
      case 'late':
        adjustment += 1;  // Later sleep = more hours
        break;
      case 'varied':
        adjustment += 0;  // No adjustment for varied
        break;
      default:
        adjustment += 0;  // No adjustment for standard
    }
    
    // Apply adjustment and ensure within valid range
    return Math.min(24, Math.max(1, baseHours + adjustment));
  }
}

export default UsageHoursValidator;
