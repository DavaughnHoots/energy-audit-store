import { DehumidifierConfig, ReferenceData } from '../../schemas/productEstimationSchema';
import { EstimateResult, ProductEstimator } from './types';

/**
 * Interface for dehumidifier product attributes
 */
export interface Dehumidifier {
  capacityPintsPerDay?: number;
  isEnergyStar?: boolean;
  isMostEfficient?: boolean;
}

/**
 * Dehumidifier capacity tiers based on pints per day
 */
export type DehumidifierCapacityTier = 'small' | 'medium' | 'large';

/**
 * Estimator for dehumidifier products
 * Calculates price, savings, ROI, and payback period based on product attributes
 * Uses IEF (Integrated Energy Factor) values for energy calculations
 */
export class DehumidifierEstimator implements ProductEstimator<Dehumidifier> {
  private referenceData: ReferenceData;

  /**
   * Creates an instance of DehumidifierEstimator
   * 
   * @param config - Configuration for dehumidifier calculations
   * @param electricityRate - Electricity rate in USD/kWh for the region
   * @param referenceData - Reference data with IEF thresholds
   */
  constructor(
    private config: DehumidifierConfig,
    private electricityRate: number,
    referenceData?: ReferenceData
  ) {
    // Store referenceData if provided, otherwise create minimal default
    this.referenceData = referenceData || {
      electricityRatesUSDPerkWh: { 'US-avg': electricityRate },
      iefThresholds: {
        dehumidifiers: {
          portable: {
            small: {
              standard: config.energyMetrics.standardIEF,
              energyStar: config.energyMetrics.energyStarIEF,
              mostEfficient: config.energyMetrics.mostEfficientIEF
            },
            medium: {
              standard: config.energyMetrics.standardIEF,
              energyStar: config.energyMetrics.energyStarIEF,
              mostEfficient: config.energyMetrics.mostEfficientIEF
            },
            large: {
              standard: config.energyMetrics.standardIEF,
              energyStar: config.energyMetrics.energyStarIEF,
              mostEfficient: config.energyMetrics.mostEfficientIEF
            }
          },
          wholehouse: {
            standard: config.energyMetrics.standardIEF,
            energyStar: config.energyMetrics.energyStarIEF,
            mostEfficient: config.energyMetrics.mostEfficientIEF
          }
        }
      },
      confidenceThresholds: { medium: 50, high: 80 }
    };
  }

  /**
   * Calculate estimates for a dehumidifier product
   * 
   * @param product - Dehumidifier product attributes
   * @returns Calculated estimates including price, savings, ROI, and more
   */
  estimate(product: Dehumidifier): EstimateResult {
    // Extract product attributes with fallbacks
    const capacityPintsPerDay = product.capacityPintsPerDay || 30; // Default capacity
    const isEnergyStar = product.isEnergyStar || false;
    const isMostEfficient = product.isMostEfficient || false;
    
    // Determine capacity tier based on pints per day
    const capacityTier = this.determineCapacityTier(capacityPintsPerDay);
    
    // Convert pints to liters
    const capacityLitersPerDay = capacityPintsPerDay * 0.473176;
    
    // Calculate price based on capacity and features
    const price = this.calculatePrice(capacityPintsPerDay, isEnergyStar, isMostEfficient);
    
    // Select the appropriate IEF based on certification and capacity
    const ief = this.getIefValue(capacityTier, isEnergyStar, isMostEfficient);
    
    // Calculate energy consumption using IEF (L/kWh)
    const annualLiters = capacityLitersPerDay * this.config.defaults.annualRunDays;
    const annualKwh = annualLiters / ief;
    
    // Get the standard IEF for comparison
    const standardIef = this.getIefValue(capacityTier, false, false);
    
    // Calculate standard model consumption for comparison (only if energy star or most efficient)
    let annualSavings = 0;
    if (isEnergyStar || isMostEfficient) {
      // Use consistent calculation method for standard model
      const standardAnnualKwh = annualLiters / standardIef;
      
      // Calculate savings
      const kwhSaved = standardAnnualKwh - annualKwh;
      annualSavings = kwhSaved * this.electricityRate;
    }
    
    // Calculate ROI and payback period
    const roi = annualSavings > 0 ? (annualSavings / price) * 100 : 0;
    let paybackPeriod = Infinity; // Default to Infinity for zero savings
    
    if (annualSavings > 0) {
      paybackPeriod = price / annualSavings;
    }
    
    // Determine energy efficiency rating
    const energyEfficiency = this.determineEfficiencyRating(isEnergyStar, isMostEfficient);
    
    // Determine confidence level based on available attributes
    const confidenceLevel = this.determineConfidenceLevel(product);
    
    // Format values for UI
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });
    
    // Format payback period with special handling for Infinity
    let formattedPaybackPeriod = 'N/A';
    if (isFinite(paybackPeriod)) {
      formattedPaybackPeriod = `${paybackPeriod.toFixed(1)} years`;
    }
    
    // Calculate estimated lifetime energy cost for additional metrics
    const lifetimeYears = 10; // Typical dehumidifier lifetime
    const lifetimeEnergyCost = annualKwh * this.electricityRate * lifetimeYears;
    
    console.log(`Product estimate: Capacity ${capacityPintsPerDay}, Price ${price}, Annual Savings ${annualSavings}, ROI ${roi}%`);    return {
      price,
      annualSavings,
      roi,
      paybackPeriod,
      energyEfficiency,
      confidenceLevel,
      
      formattedPrice: formatter.format(price),
      formattedAnnualSavings: formatter.format(annualSavings),
      formattedRoi: percentFormatter.format(roi),
      formattedPaybackPeriod,
      
      // Additional metrics for expanded information
      additionalMetrics: {
        annualKwh,
        lifetimeEnergyCost,
        formattedLifetimeEnergyCost: formatter.format(lifetimeEnergyCost),
        capacityTier,
        iefValue: ief,
        dailyRunHours: this.config.defaults.dailyRunHours,
        annualRunDays: this.config.defaults.annualRunDays
      }
    };
  }

  /**
   * Determine the capacity tier based on pints per day
   */
  private determineCapacityTier(capacity: number): DehumidifierCapacityTier {
    if (capacity < 25) return 'small';
    if (capacity <= 45) return 'medium';
    return 'large';
  }

  /**
   * Get the appropriate IEF value based on tier and certifications
   */
  private getIefValue(tier: DehumidifierCapacityTier, isEnergyStar: boolean, isMostEfficient: boolean): number {
    const thresholds = this.referenceData.iefThresholds.dehumidifiers.portable[tier];
    
    if (isMostEfficient) {
      return thresholds.mostEfficient;
    } else if (isEnergyStar) {
      return thresholds.energyStar;
    }
    
    return thresholds.standard;
  }

  /**
   * Calculate price based on capacity and features
   */
  private calculatePrice(capacity: number, isEnergyStar: boolean, isMostEfficient: boolean): number {
    let price = this.config.priceParameters.basePrice + 
               (capacity * this.config.priceParameters.capacityMultiplier);
    
    if (isMostEfficient) {
      price += this.config.priceParameters.mostEfficientPremium;
    } else if (isEnergyStar) {
      price += this.config.priceParameters.energyStarPremium;
    }
    
    return price;
  }

  /**
   * Determine energy efficiency rating based on certifications
   */
  private determineEfficiencyRating(isEnergyStar: boolean, isMostEfficient: boolean): string {
    if (isMostEfficient) {
      return this.config.efficiencyRatings.mostEfficient;
    } else if (isEnergyStar) {
      return this.config.efficiencyRatings.energyStar;
    }
    return this.config.efficiencyRatings.standard;
  }

  /**
   * Determine confidence level based on available attributes
   */
  private determineConfidenceLevel(product: Dehumidifier): 'low' | 'medium' | 'high' {
    let score = 0;
    if (product.capacityPintsPerDay !== undefined) score += 1;
    if (product.isEnergyStar !== undefined) score += 1;
    if (product.isMostEfficient !== undefined) score += 1;
    
    if (score <= 1) return 'low';
    if (score === 2) return 'medium';
    return 'high';
  }
}
