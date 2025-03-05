import { calculationService } from './calculateService.js';
import { 
  ExtendedEnergyAuditData, 
  ExtendedCurrentConditions,
  ExtendedHeatingCooling,
  ExtendedEnergyConsumption,
  EfficiencyScores,
  FinancialAnalysis,
  LightingFixture
} from '../types/energyAuditExtended.js';
import { appLogger } from '../utils/logger.js';

/**
 * Constants for calculations (matching Python tool)
 */
const CONSTANTS = {
  AIR_DENSITY: 1.225, // kg/m³ at sea level and 15°C
  AIR_SPECIFIC_HEAT: 1005, // J/kg·K
  EMISSION_FACTOR: 0.4, // kg CO2/kWh (example value, should be region-specific)
  HVAC_DEFAULT_EFFICIENCY: 0.8,
  TYPICAL_SOLAR_PANEL_EFFICIENCY: 0.2,
  PERFORMANCE_RATIO: 0.75,
  LUMENS_PER_WATT_LED: 100 // Modern LED efficiency
};

export class ExtendedCalculationService {
  /**
   * Perform comprehensive analysis (matching Python tool's perform_comprehensive_analysis)
   */
  performComprehensiveAnalysis(auditData: ExtendedEnergyAuditData) {
    appLogger.info('Starting comprehensive analysis');
    
    try {
      const results: any = {
        energy: {},
        hvac: {},
        lighting: {},
        humidity: {},
        recommendations: {},
      };
      
      // Energy Analysis
      results.energy = this._performEnergyAnalysis(auditData.energyConsumption);
      
      // HVAC Analysis
      if (auditData.heatingCooling) {
        results.hvac = this._performHvacAnalysis(auditData.heatingCooling);
      }
      
      // Lighting Analysis
      if (auditData.currentConditions.lighting) {
        results.lighting = this._performLightingAnalysis(auditData.currentConditions.lighting);
      }
      
      // Humidity Analysis
      if (auditData.currentConditions.humidity) {
        results.humidity = this._performHumidityAnalysis(auditData.currentConditions);
      }
      
      // Generate Recommendations
      results.recommendations = this._generateComprehensiveRecommendations(auditData);
      
      // Calculate overall efficiency score
      results.efficiency_score = this._calculateOverallEfficiencyScore(results);
      
      // Generate financial analysis
      results.financial_analysis = this._performFinancialAnalysis(results);
      
      // Add timestamp and metadata
      results.metadata = {
        timestamp: new Date(),
        analysis_version: '1.0',
        building_id: auditData.basicInfo.address,
        analysis_type: 'comprehensive',
      };
      
      appLogger.info('Comprehensive analysis completed successfully');
      return results;
    } catch (error) {
      appLogger.error('Comprehensive analysis failed', { error });
      throw error;
    }
  }
  
  /**
   * Perform energy analysis (matching Python tool's _perform_energy_analysis)
   */
  _performEnergyAnalysis(energyConsumption: ExtendedEnergyConsumption) {
    try {
      const energyResults: any = {
        Ebase: energyConsumption.powerConsumption * energyConsumption.durationHours,
        timestamp: new Date()
      };
      
      // Calculate seasonal adjusted energy (limit the impact)
      const seasonalFactor = Math.max(0.8, Math.min(1.2, energyConsumption.seasonalFactor));
      energyResults.Eseasonal = energyResults.Ebase * seasonalFactor;
      
      // Calculate occupancy adjusted energy (limit the impact)
      const occupancyFactor = Math.max(0.6, Math.min(1.0, energyConsumption.occupancyFactor));
      energyResults.Eoccupied = energyResults.Eseasonal * occupancyFactor;
      
      // Calculate real energy consumption
      const powerFactor = Math.max(0.8, Math.min(1.0, energyConsumption.powerFactor));
      energyResults.Ereal = energyResults.Eoccupied * powerFactor;
      
      // Calculate efficiency metrics with reasonable limits
      energyResults.efficiency_metrics = {
        overall_efficiency: Math.min(100, (energyResults.Ereal / energyResults.Ebase) * 100),
        seasonal_impact: Math.min(20, Math.max(-20, ((energyResults.Eseasonal - energyResults.Ebase) / energyResults.Ebase) * 100)),
        occupancy_impact: Math.min(20, Math.max(-20, ((energyResults.Eoccupied - energyResults.Eseasonal) / energyResults.Eseasonal) * 100))
      };
      
      return energyResults;
    } catch (error) {
      appLogger.error('Energy analysis failed', { error });
      throw error;
    }
  }
  
  /**
   * Perform HVAC analysis (matching Python tool's _perform_hvac_analysis)
   */
  _performHvacAnalysis(hvacData: ExtendedHeatingCooling) {
    try {
      const hvacResults: any = {
        timestamp: new Date(),
        system_efficiency: {
          current_efficiency: Math.min(100, hvacData.heatingSystem.outputCapacity / Math.max(1, hvacData.heatingSystem.inputPower) * 100),
          target_efficiency: hvacData.heatingSystem.targetEfficiency,
          efficiency_gap: 0 // Will be calculated below
        },
        energy_consumption: this._calculateHvacEnergy(hvacData)
      };
      
      // Calculate efficiency gap
      hvacResults.system_efficiency.efficiency_gap = (
        hvacResults.system_efficiency.target_efficiency -
        hvacResults.system_efficiency.current_efficiency
      );
      
      return hvacResults;
    } catch (error) {
      appLogger.error('HVAC analysis failed', { error });
      throw error;
    }
  }
  
  /**
   * Calculate HVAC energy consumption (matching Python tool's _calculate_hvac_energy)
   */
  _calculateHvacEnergy(hvacData: ExtendedHeatingCooling) {
    const V = hvacData.heatingSystem.outputCapacity; // Using output capacity as volume proxy
    const rho = hvacData.airDensity || CONSTANTS.AIR_DENSITY;
    const Cp = hvacData.specificHeat || CONSTANTS.AIR_SPECIFIC_HEAT;
    const delta_T = hvacData.temperatureDifference;
    const eta = hvacData.heatingSystem.efficiency / 100; // Convert percentage to decimal
    
    return (V * rho * Cp * Math.abs(delta_T)) / (eta * 3600000);
  }
  
  /**
   * Perform lighting analysis (matching Python tool's _perform_lighting_analysis)
   */
  _performLightingAnalysis(lightingData: any) {
    appLogger.info('Performing lighting analysis');
    
    try {
      const lightingResults: any = {
        timestamp: new Date(),
        fixtures: {},
        total_consumption: 0,
        efficiency_metrics: {
          average_efficiency: 0,
          total_annual_consumption: 0,
          total_annual_cost: 0,
        },
      };
      
      // Check if we have valid lighting data
      if (!lightingData || !lightingData.fixtures || !lightingData.fixtures.length) {
        appLogger.warn('No lighting fixture data available for analysis');
        return lightingResults;
      }
      
      // Analyze each fixture
      for (const fixture of lightingData.fixtures) {
        // Validate required fields
        if (!fixture.name || !fixture.watts || !fixture.hours || !fixture.lumens) {
          continue;
        }
        
        const fixtureAnalysis = {
          consumption: fixture.watts * fixture.hours / 1000, // kWh
          efficiency: fixture.lumens / fixture.watts, // lm/W
          annual_cost: (
            fixture.watts * 
            fixture.hours * 
            (fixture.electricityRate || 0.12) / 
            1000
          ),
        };
        
        lightingResults.fixtures[fixture.name] = fixtureAnalysis;
        lightingResults.total_consumption += fixtureAnalysis.consumption;
      }
      
      // Calculate overall metrics if we have fixtures
      if (Object.keys(lightingResults.fixtures).length > 0) {
        const fixtures = lightingData.fixtures;
        const total_power = fixtures.reduce((sum: number, f: LightingFixture) => sum + f.watts, 0);
        const total_lumens = fixtures.reduce((sum: number, f: LightingFixture) => sum + f.lumens, 0);
        
        lightingResults.efficiency_metrics = {
          average_efficiency: total_power > 0 ? total_lumens / total_power : 0,
          total_annual_consumption: lightingResults.total_consumption * 365, // Annual consumption
          total_annual_cost: Object.values(lightingResults.fixtures).reduce(
            (sum: number, f: any) => sum + f.annual_cost, 0
          ) * 365, // Annual cost
        };
      }
      
      return lightingResults;
    } catch (error) {
      appLogger.error('Lighting analysis failed', { error });
      return {
        timestamp: new Date(),
        fixtures: {},
        total_consumption: 0,
        efficiency_metrics: {
          average_efficiency: 0,
          total_annual_consumption: 0,
          total_annual_cost: 0,
        },
      };
    }
  }
  
  /**
   * Perform humidity analysis (matching Python tool's _perform_humidity_analysis)
   */
  _performHumidityAnalysis(currentConditions: ExtendedCurrentConditions) {
    appLogger.info('Performing humidity analysis');
    
    try {
      const humidityData = currentConditions.humidity;
      const homeDetails = currentConditions; // Assuming home details are available in current conditions
      
      const humidityResults: any = {
        requirements: {},
        recommendations: [],
        product_needs: {},
        current_status: this._analyzeCurrentHumidity(humidityData),
      };
      
      // Determine requirements
      humidityResults.requirements = this._determineHumidityRequirements(
        humidityData, 
        humidityResults.current_status
      );
      
      // Calculate dehumidification needs
      if (humidityResults.requirements.needs_dehumidification) {
        humidityResults.product_needs = this._calculateDehumidificationNeeds(
          homeDetails,
          humidityResults.current_status,
          humidityResults.requirements
        );
      }
      
      return humidityResults;
    } catch (error) {
      appLogger.error('Humidity analysis failed', { error });
      throw error;
    }
  }
  
  /**
   * Analyze current humidity conditions (matching Python tool's _analyze_current_humidity)
   */
  _analyzeCurrentHumidity(humidityData: any) {
    return {
      current_humidity: humidityData.currentHumidity,
      humidity_ratio: this._calculateHumidityRatio(humidityData),
      dew_point: this._calculateDewPoint(humidityData),
      vapor_pressure: this._calculateVaporPressure(humidityData),
    };
  }
  
  /**
   * Determine humidity control requirements (matching Python tool's _determine_humidity_requirements)
   */
  _determineHumidityRequirements(humidityData: any, currentStatus: any) {
    const targetHumidity = humidityData.targetHumidity;
    const currentHumidity = currentStatus.current_humidity;
    
    return {
      target_humidity: targetHumidity,
      humidity_gap: currentHumidity - targetHumidity,
      needs_dehumidification: currentHumidity > targetHumidity,
      needs_humidification: currentHumidity < targetHumidity,
      control_priority: this._determineHumidityPriority(currentHumidity, targetHumidity),
    };
  }
  
  /**
   * Calculate dehumidification needs (matching Python tool's _calculate_dehumidification_needs)
   */
  _calculateDehumidificationNeeds(homeDetails: any, currentStatus: any, requirements: any) {
    // Calculate volume from home dimensions if available
    const volume = homeDetails.wallLength * homeDetails.wallWidth * homeDetails.ceilingHeight;
    const humidityGap = requirements.humidity_gap;
    
    const capacityNeeded = this.calculateDehumidificationNeeds(
      volume,
      currentStatus.current_humidity,
      requirements.target_humidity
    );
    
    return {
      capacity_needed: capacityNeeded,
      recommended_capacity: capacityNeeded * 1.2, // 20% safety factor
      unit_size: this._determineUnitSize(capacityNeeded),
      estimated_runtime: this._estimateRuntime(capacityNeeded, humidityGap),
    };
  }
  
  /**
   * Calculate humidity ratio (matching Python tool's _calculate_humidity_ratio)
   */
  _calculateHumidityRatio(humidityData: any) {
    return humidityData.currentHumidity / 100;
  }
  
  /**
   * Calculate dew point (matching Python tool's _calculate_dew_point)
   */
  _calculateDewPoint(humidityData: any) {
    // Simplified calculation - Magnus formula
    const T = humidityData.temperature;
    const RH = humidityData.currentHumidity;
    
    const a = 17.27;
    const b = 237.7;
    
    const alpha = ((a * T) / (b + T)) + Math.log(RH / 100.0);
    return (b * alpha) / (a - alpha);
  }
  
  /**
   * Calculate vapor pressure (matching Python tool's _calculate_vapor_pressure)
   */
  _calculateVaporPressure(humidityData: any) {
    // Simplified calculation
    const T = humidityData.temperature;
    const RH = humidityData.currentHumidity;
    
    // Saturation vapor pressure
    const es = 6.112 * Math.exp((17.67 * T) / (T + 243.5));
    
    // Actual vapor pressure
    return (RH / 100.0) * es;
  }
  
  /**
   * Calculate dehumidification needs (matching Python tool's calculate_dehumidification_needs)
   */
  calculateDehumidificationNeeds(volume: number, currentHumidity: number, targetHumidity: number) {
    // Simplified calculation - returns pints per day
    const humidityDifference = currentHumidity - targetHumidity;
    return humidityDifference <= 0 ? 0 : 0.0007 * volume * humidityDifference;
  }
  
  /**
   * Determine appropriate dehumidifier unit size (matching Python tool's _determine_unit_size)
   */
  _determineUnitSize(capacityNeeded: number) {
    if (capacityNeeded <= 30) {
      return "small";
    } else if (capacityNeeded <= 50) {
      return "medium";
    } else {
      return "large";
    }
  }
  
  /**
   * Estimate dehumidifier runtime (matching Python tool's _estimate_runtime)
   */
  _estimateRuntime(capacityNeeded: number, humidityGap: number) {
    // Simplified calculation - returns hours per day
    const baseRuntime = 8;
    if (humidityGap > 20) {
      return baseRuntime * 1.5;
    } else if (humidityGap > 10) {
      return baseRuntime * 1.2;
    }
    return baseRuntime;
  }
  
  /**
   * Determine humidity priority (matching Python tool's _determine_humidity_priority)
   */
  _determineHumidityPriority(currentHumidity: number, targetHumidity: number) {
    const humidityDifference = Math.abs(currentHumidity - targetHumidity);
    
    if (humidityDifference > 20) {
      return "high";
    } else if (humidityDifference > 10) {
      return "medium";
    } else {
      return "low";
    }
  }
  
  /**
   * Calculate overall efficiency score (matching Python tool's _calculate_overall_efficiency_score)
   */
  _calculateOverallEfficiencyScore(results: any): EfficiencyScores {
    const scores: any = {
      energyScore: Math.min(100, this._calculateEnergyScore(results) || 0),
      hvacScore: Math.min(100, this._calculateHvacScore(results) || 0),
      lightingScore: Math.min(100, this._calculateLightingScore(results) || 0),
      humidityScore: Math.min(100, this._calculateHumidityScore(results) || 0)
    };
    
    const weights = {
      energyScore: 0.4,
      hvacScore: 0.3,
      lightingScore: 0.2,
      humidityScore: 0.1
    };
    
    let totalScore = 0;
    let applicableWeight = 0;
    
    for (const [component, score] of Object.entries(scores)) {
      if (score !== null && score !== undefined) {
        totalScore += (score as number) * weights[component as keyof typeof weights];
        applicableWeight += weights[component as keyof typeof weights];
      }
    }
    
    if (applicableWeight === 0) {
      return {
        energyScore: 0,
        hvacScore: 0,
        lightingScore: 0,
        humidityScore: 0,
        overallScore: 0,
        interpretation: "Insufficient data for scoring"
      };
    }
    
    const finalScore = Math.min(100, (totalScore / applicableWeight));
    
    return {
      energyScore: scores.energyScore,
      hvacScore: scores.hvacScore,
      lightingScore: scores.lightingScore,
      humidityScore: scores.humidityScore,
      overallScore: finalScore,
      interpretation: this._interpretEfficiencyScore(finalScore)
    };
  }
  
  /**
   * Calculate energy score (matching Python tool's _calculate_energy_score)
   */
  _calculateEnergyScore(results: any) {
    try {
      const energyResults = results.energy;
      const baseEfficiency = (energyResults.Ereal / energyResults.Ebase) * 100;
      return Math.min(100, Math.max(0, 100 - (100 - baseEfficiency) * 1.5));
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Calculate HVAC score (matching Python tool's _calculate_hvac_score)
   */
  _calculateHvacScore(results: any) {
    try {
      const hvacResults = results.hvac;
      if (!hvacResults) {
        return null;
      }
      const efficiency = hvacResults.system_efficiency.current_efficiency;
      const target = hvacResults.system_efficiency.target_efficiency;
      return Math.min(100, Math.max(0, (efficiency / target) * 100));
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Calculate lighting score (matching Python tool's _calculate_lighting_score)
   */
  _calculateLightingScore(results: any) {
    try {
      const lightingResults = results.lighting;
      if (!lightingResults) {
        return null;
      }
      const metrics = lightingResults.efficiency_metrics;
      return Math.min(100, Math.max(0, metrics.average_efficiency));
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Calculate humidity score (matching Python tool's _calculate_humidity_score)
   */
  _calculateHumidityScore(results: any) {
    try {
      const humidityResults = results.humidity;
      if (!humidityResults) {
        return null;
      }
      const current = humidityResults.current_status.current_humidity;
      const target = humidityResults.requirements.target_humidity;
      const deviation = Math.abs(current - target);
      return Math.min(100, Math.max(0, 100 - deviation * 2));
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Interpret efficiency score (matching Python tool's _interpret_efficiency_score)
   */
  _interpretEfficiencyScore(score: number) {
    if (score >= 90) {
      return "Excellent - High-performance building";
    } else if (score >= 80) {
      return "Very Good - Above average performance";
    } else if (score >= 70) {
      return "Good - Meeting standard requirements";
    } else if (score >= 60) {
      return "Fair - Room for improvement";
    } else {
      return "Poor - Significant improvements needed";
    }
  }
  
  /**
   * Generate comprehensive recommendations (matching Python tool's _generate_comprehensive_recommendations)
   */
  _generateComprehensiveRecommendations(auditData: ExtendedEnergyAuditData) {
    appLogger.info('Generating comprehensive recommendations');
    
    const recommendations: any = {
      immediate_actions: [],
      short_term: [],
      long_term: [],
      product_recommendations: {},
      estimated_savings: {},
    };
    
    try {
      // Energy recommendations
      if (auditData.energyConsumption) {
        const energyRecs = this._generateEnergyRecommendations(auditData);
        if (energyRecs && energyRecs.length > 0) {
          this._categorizeRecommendations(energyRecs, recommendations);
        }
      }
      
      // HVAC recommendations
      if (auditData.heatingCooling) {
        const hvacRecs = this._generateHvacRecommendations(auditData);
        if (hvacRecs && hvacRecs.length > 0) {
          this._categorizeRecommendations(hvacRecs, recommendations);
        }
      }
      
      // Lighting recommendations
      if (auditData.currentConditions.lighting) {
        const lightingRecs = this._generateLightingRecommendations(auditData);
        if (lightingRecs && lightingRecs.length > 0) {
          this._categorizeRecommendations(lightingRecs, recommendations);
        }
      }
      
      // Humidity recommendations
      if (auditData.currentConditions.humidity) {
        const humidityRecs = this._generateHumidityRecommendations(auditData);
        if (humidityRecs && humidityRecs.length > 0) {
          this._categorizeRecommendations(humidityRecs, recommendations);
        }
      }
      
      // Calculate estimated savings
      recommendations.estimated_savings = this._calculateTotalSavings(recommendations);
      
      return recommendations;
    } catch (error) {
      appLogger.error('Recommendation generation failed', { error });
      return recommendations;
    }
  }
  
  /**
   * Generate energy recommendations (matching Python tool's _generate_energy_recommendations)
   */
  _generateEnergyRecommendations(auditData: ExtendedEnergyAuditData) {
    const recommendations = [];
    const energyConsumption = auditData.energyConsumption;
    
    // Placeholder for energy analysis results
    const energyResults = this._performEnergyAnalysis(energyConsumption);
    
    // Check overall efficiency
    if (energyResults.efficiency_metrics.overall_efficiency < 80) {
      recommendations.push({
        category: "energy",
        priority: "high",
        title: "Improve Overall Energy Efficiency",
        description: "Implementation of energy management system recommended",
        estimated_savings: this._estimateEnergySavings(auditData),
        implementation_cost: this._estimateImplementationCost("energy_management"),
        payback_period: null, // Will be calculated later
      });
    }
    
    // Check seasonal impact
    if (Math.abs(energyResults.efficiency_metrics.seasonal_impact) > 20) {
      recommendations.push({
        category: "energy",
        priority: "medium",
        title: "Optimize Seasonal Energy Usage",
        description: "Implement seasonal adjustment strategies",
        estimated_savings: this._estimateSeasonalSavings(auditData),
        implementation_cost: this._estimateImplementationCost("seasonal_optimization"),
        payback_period: null,
      });
    }
    
    return recommendations;
  }
  
  /**
   * Generate HVAC recommendations (matching Python tool's _generate_hvac_recommendations)
   */
  _generateHvacRecommendations(auditData: ExtendedEnergyAuditData) {
    const recommendations = [];
    const hvacData = auditData.heatingCooling;
    
    // Placeholder for HVAC analysis results
    const hvacResults = this._performHvacAnalysis(hvacData);
    
    // Check system efficiency
    if (hvacResults.system_efficiency.efficiency_gap > 10) {
      recommendations.push({
        category: "hvac",
        priority: "high",
        title: "HVAC System Upgrade Required",
        description: "Current system operating below optimal efficiency",
        estimated_savings: this._estimateHvacSavings(auditData),
        implementation_cost: this._estimateImplementationCost("hvac_upgrade"),
        payback_period: null,
      });
    }
    
    return recommendations;
  }
  
  /**
   * Generate lighting recommendations (matching Python tool's _generate_lighting_recommendations)
   */
  _generateLightingRecommendations(auditData: ExtendedEnergyAuditData) {
    const recommendations = [];
    const lightingData = auditData.currentConditions.lighting;
    
    // Placeholder for lighting analysis results
    const lightingResults = this._performLightingAnalysis(lightingData);
    
    // Check lighting efficiency
    if (lightingResults.efficiency_metrics.average_efficiency < 80) {
      recommendations.push({
        category: "lighting",
        priority: "medium",
        title: "Lighting System Upgrade",
        description: "Upgrade to more efficient lighting systems",
        estimated_savings: this._estimateLightingSavings(auditData),
        implementation_cost: this._estimateImplementationCost("lighting_upgrade"),
        payback_period: null,
      });
    }
    
    return recommendations;
  }
  
  /**
   * Generate humidity recommendations (matching Python tool's _generate_humidity_recommendations)
   */
  _generateHumidityRecommendations(auditData: ExtendedEnergyAuditData) {
    const recommendations = [];
    
    try {
      const humidityData = auditData.currentConditions.humidity;
      
      // Placeholder for humidity analysis results
      const humidityResults = this._performHumidityAnalysis(auditData.currentConditions);
      
      if (humidityResults.requirements.needs_dehumidification) {
        const capacityNeeded = humidityResults.product_needs.capacity_needed;
        
        recommendations.push({
          category: "humidity",
          priority: humidityResults.requirements.control_priority,
          title: "Install Dehumidification System",
          description: `Install dehumidification system with ${capacityNeeded.toFixed(1)} pints/day capacity`,
          estimated_savings: this._estimateHumiditySavings(humidityResults),
          implementation_cost: this._estimateImplementationCost("humidity_control"),
          payback_period: null,
        });
      }
    } catch (error) {
      appLogger.error('Error generating humidity recommendations', { error });
    }
    
    return recommendations;
  }
  
  /**
   * Categorize recommendations (matching Python tool's _categorize_recommendations)
   */
  _categorizeRecommendations(recommendationsList: any[], recommendationsDict: any) {
    if (!recommendationsList || recommendationsList.length === 0) {
      return;
    }
    
    for (const rec of recommendationsList) {
      const priority = (rec.priority || "medium").toLowerCase();
      
      if (priority === "high") {
        recommendationsDict.immediate_actions.push(rec);
      } else if (priority === "medium") {
        recommendationsDict.short_term.push(rec);
      } else {
        recommendationsDict.long_term.push(rec);
      }
    }
  }
  
  /**
   * Perform financial analysis (matching Python tool's _perform_financial_analysis)
   */
  _performFinancialAnalysis(results: any): FinancialAnalysis {
    const financialResults: FinancialAnalysis = {
      totalInvestmentRequired: 0,
      annualSavingsPotential: 0,
      simplePaybackPeriod: 0,
      roi: 0,
      componentAnalysis: {},
    };
    
    try {
      // Analyze each component's financial impact
      if (results.recommendations) {
        const recommendations = results.recommendations;
        
        // Handle immediate actions
        if (recommendations.immediate_actions) {
          const categoryFinancials = this._analyzeCategoryFinancials(
            recommendations.immediate_actions
          );
          financialResults.componentAnalysis["immediate"] = categoryFinancials;
          financialResults.totalInvestmentRequired += categoryFinancials.investment;
          financialResults.annualSavingsPotential += categoryFinancials.annualSavings;
        }
        
        // Handle short term actions
        if (recommendations.short_term) {
          const categoryFinancials = this._analyzeCategoryFinancials(
            recommendations.short_term
          );
          financialResults.componentAnalysis["short_term"] = categoryFinancials;
          financialResults.totalInvestmentRequired += categoryFinancials.investment;
          financialResults.annualSavingsPotential += categoryFinancials.annualSavings;
        }
        
        // Handle long term actions
        if (recommendations.long_term) {
          const categoryFinancials = this._analyzeCategoryFinancials(
            recommendations.long_term
          );
          financialResults.componentAnalysis["long_term"] = categoryFinancials;
          financialResults.totalInvestmentRequired += categoryFinancials.investment;
          financialResults.annualSavingsPotential += categoryFinancials.annualSavings;
        }
      }
      
      // Calculate overall metrics
      if (financialResults.annualSavingsPotential > 0) {
        financialResults.simplePaybackPeriod = (
          financialResults.totalInvestmentRequired /
          financialResults.annualSavingsPotential
        );
        financialResults.roi = (
          financialResults.annualSavingsPotential /
          financialResults.totalInvestmentRequired
        ) * 100;
      }
      
      return financialResults;
    } catch (error) {
      appLogger.error('Financial analysis failed', { error });
      return financialResults;
    }
  }
  
  /**
   * Analyze category financials (matching Python tool's _analyze_category_financials)
   */
  _analyzeCategoryFinancials(recommendations: any[]) {
    try {
      if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
        return { investment: 0, annualSavings: 0, averagePayback: 0 };
      }
      
      const validRecommendations = recommendations.filter(rec => typeof rec === 'object' && rec !== null);
      
      const investment = validRecommendations.reduce(
        (sum, rec) => sum + (rec.implementation_cost || 0), 
        0
      );
      
      const annualSavings = validRecommendations.reduce(
        (sum, rec) => sum + (rec.estimated_savings || 0), 
        0
      );
      
      return {
        investment,
        annualSavings,
        averagePayback: this._calculateAveragePayback(validRecommendations),
      };
    } catch (error) {
      appLogger.error('Category financial analysis failed', { error });
      return { investment: 0, annualSavings: 0, averagePayback: 0 };
    }
  }
  
  /**
   * Calculate average payback period (matching Python tool's _calculate_average_payback)
   */
  _calculateAveragePayback(recommendations: any[]) {
    try {
      if (!recommendations || recommendations.length === 0) {
        return 0;
      }
      
      const validPaybacks = [];
      for (const rec of recommendations) {
        if (typeof rec !== 'object' || rec === null) {
          continue;
        }
        
        const implementationCost = rec.implementation_cost || 0;
        const annualSavings = rec.estimated_savings || 0;
        
        if (annualSavings > 0) {
          validPaybacks.push(implementationCost / annualSavings);
        }
      }
      
      return validPaybacks.length > 0 
        ? validPaybacks.reduce((sum, val) => sum + val, 0) / validPaybacks.length 
        : 0;
    } catch (error) {
      appLogger.error('Payback calculation failed', { error });
      return 0;
    }
  }
  
  /**
   * Calculate total savings (matching Python tool's _calculate_total_savings)
   */
  _calculateTotalSavings(recommendations: any) {
    const totalSavings: Record<string, number> = {
      energy: 0,
      hvac: 0,
      lighting: 0,
      humidity: 0
    };
    
    // Process immediate actions
    if (recommendations.immediate_actions) {
      for (const rec of recommendations.immediate_actions) {
        const category = rec.category || 'other';
        totalSavings[category] = (totalSavings[category] || 0) + (rec.estimated_savings || 0);
      }
    }
    
    // Process short-term actions
    if (recommendations.short_term) {
      for (const rec of recommendations.short_term) {
        const category = rec.category || 'other';
        totalSavings[category] = (totalSavings[category] || 0) + (rec.estimated_savings || 0);
      }
    }
    
    // Process long-term actions
    if (recommendations.long_term) {
      for (const rec of recommendations.long_term) {
        const category = rec.category || 'other';
        totalSavings[category] = (totalSavings[category] || 0) + (rec.estimated_savings || 0);
      }
    }
    
    return totalSavings;
  }
  
  /**
   * Estimate energy savings (matching Python tool's _estimate_energy_savings)
   */
  _estimateEnergySavings(auditData: ExtendedEnergyAuditData) {
    try {
      const currentConsumption = auditData.energyConsumption.powerConsumption * 
        auditData.energyConsumption.durationHours;
      const potentialImprovement = 0.15; // Assume 15% potential improvement
      
      return currentConsumption * potentialImprovement * 0.12; // Assuming $0.12/kWh
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Estimate seasonal savings (matching Python tool's _estimate_seasonal_savings)
   */
  _estimateSeasonalSavings(auditData: ExtendedEnergyAuditData) {
    try {
      // Perform energy analysis to get seasonal impact
      const energyResults = this._performEnergyAnalysis(auditData.energyConsumption);
      const seasonalImpact = Math.abs(energyResults.efficiency_metrics.seasonal_impact);
      const currentConsumption = energyResults.Ereal;
      
      return (seasonalImpact / 100) * currentConsumption * 0.12 * 0.5; // 50% of potential improvement
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Estimate HVAC savings (matching Python tool's _estimate_hvac_savings)
   */
  _estimateHvacSavings(auditData: ExtendedEnergyAuditData) {
    try {
      // Perform HVAC analysis to get efficiency gap
      const hvacResults = this._performHvacAnalysis(auditData.heatingCooling);
      const efficiencyGap = hvacResults.system_efficiency.efficiency_gap;
      const currentConsumption = hvacResults.energy_consumption;
      
      return (efficiencyGap / 100) * currentConsumption * 0.12;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Estimate lighting savings (matching Python tool's _estimate_lighting_savings)
   */
  _estimateLightingSavings(auditData: ExtendedEnergyAuditData) {
    try {
      // Perform lighting analysis to get current consumption
      const lightingResults = this._performLightingAnalysis(auditData.currentConditions.lighting);
      const currentConsumption = lightingResults.total_consumption;
      const potentialImprovement = 0.30; // Assume 30% potential improvement with LED
      
      return currentConsumption * potentialImprovement * 0.12;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Estimate humidity savings (matching Python tool's _estimate_humidity_savings)
   */
  _estimateHumiditySavings(humidityResults: any) {
    try {
      // Estimate energy savings from improved humidity control
      // This is a simplified calculation
      const capacityNeeded = humidityResults.product_needs?.capacity_needed || 0;
      const runtimeHours = humidityResults.product_needs?.estimated_runtime || 8;
      
      // Assume 1000W average power consumption per 50 pints/day capacity
      const powerConsumption = (capacityNeeded / 50) * 1000; // Watts
      const annualEnergy = powerConsumption * runtimeHours * 365 / 1000; // kWh/year
      
      return annualEnergy * 0.12; // Assuming $0.12/kWh
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Estimate implementation cost (matching Python tool's _estimate_implementation_cost)
   */
  _estimateImplementationCost(improvementType: string) {
    const costEstimates: Record<string, number> = {
      energy_management: 5000,
      seasonal_optimization: 2000,
      hvac_upgrade: 10000,
      lighting_upgrade: 5000,
      humidity_control: 3000,
    };
    
    return costEstimates[improvementType] || 1000;
  }
}

// Export the service
export const extendedCalculationService = new ExtendedCalculationService();
