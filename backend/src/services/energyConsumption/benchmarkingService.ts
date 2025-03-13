import { pool } from '../../config/database.js';
import { appLogger } from '../../utils/logger.js';
import { PropertyNormalizationDetails } from '../../types/energyConsumption.js';

/**
 * Benchmark data structure for similar properties
 */
interface BenchmarkData {
  electricity: {
    average: number;
    percentile25: number;
    median: number;
    percentile75: number;
    sampleSize: number;
  };
  gas: {
    average: number;
    percentile25: number;
    median: number;
    percentile75: number;
    sampleSize: number;
  };
  water: {
    average: number;
    percentile25: number;
    median: number;
    percentile75: number;
    sampleSize: number;
  };
}

/**
 * Get benchmark data for similar properties
 * @param propertyDetails Property details for comparison
 * @param timeframe Timeframe for benchmark data
 * @returns Benchmark data or null if insufficient data
 */
export async function getBenchmarkData(
  propertyDetails: PropertyNormalizationDetails,
  timeframe: { start: Date, end: Date }
): Promise<BenchmarkData | null> {
  try {
    if (!propertyDetails.propertyType) {
      appLogger.warn('Property type not provided for benchmarking');
      return null;
    }

    // Define criteria for similar properties
    const squareFootageRange = propertyDetails.squareFootage 
      ? {
          min: propertyDetails.squareFootage * 0.7, // 70% of the target property
          max: propertyDetails.squareFootage * 1.3  // 130% of the target property
        }
      : undefined;
    
    const occupantsRange = propertyDetails.occupants
      ? {
          min: Math.max(1, propertyDetails.occupants - 1),
          max: propertyDetails.occupants + 1
        }
      : undefined;

    // Build the query for similar properties
    let query = `
      WITH similar_properties AS (
        SELECT 
          p.id,
          p.property_type,
          p.square_footage,
          p.occupants,
          p.year_built
        FROM 
          property_details p
        JOIN 
          user_properties up ON p.id = up.property_id
        WHERE 
          p.property_type = $1
    `;

    const queryParams: any[] = [propertyDetails.propertyType];
    let paramCount = 2;

    if (squareFootageRange) {
      query += ` AND p.square_footage BETWEEN $${paramCount} AND $${paramCount+1}`;
      queryParams.push(squareFootageRange.min, squareFootageRange.max);
      paramCount += 2;
    }

    if (occupantsRange) {
      query += ` AND p.occupants BETWEEN $${paramCount} AND $${paramCount+1}`;
      queryParams.push(occupantsRange.min, occupantsRange.max);
      paramCount += 2;
    }

    if (propertyDetails.yearBuilt) {
      // Consider properties within 15 years of the target property
      const yearMin = propertyDetails.yearBuilt - 15;
      const yearMax = propertyDetails.yearBuilt + 15;
      query += ` AND p.year_built BETWEEN $${paramCount} AND $${paramCount+1}`;
      queryParams.push(yearMin, yearMax);
      paramCount += 2;
    }

    // Filter by bedrooms if available
    if (propertyDetails.numBedrooms) {
      const bedroomMin = Math.max(1, propertyDetails.numBedrooms - 1);
      const bedroomMax = propertyDetails.numBedrooms + 1;
      query += ` AND p.bedrooms BETWEEN $${paramCount} AND $${paramCount+1}`;
      queryParams.push(bedroomMin, bedroomMax);
      paramCount += 2;
    }

    // Close the similar_properties CTE and get consumption data
    query += `
      ),
      consumption_data AS (
        SELECT 
          sp.id as property_id,
          AVG(ec.electricity_usage) as avg_electricity,
          AVG(ec.gas_usage) as avg_gas,
          AVG(ec.water_usage) as avg_water,
          PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY ec.electricity_usage) as electricity_p25,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ec.electricity_usage) as electricity_median,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ec.electricity_usage) as electricity_p75,
          PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY ec.gas_usage) as gas_p25,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ec.gas_usage) as gas_median,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ec.gas_usage) as gas_p75,
          PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY ec.water_usage) as water_p25,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ec.water_usage) as water_median,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ec.water_usage) as water_p75
        FROM 
          similar_properties sp
        JOIN 
          energy_consumption_records ec ON ec.property_id = sp.id
        WHERE 
          ec.record_date BETWEEN $${paramCount} AND $${paramCount+1}
        GROUP BY 
          sp.id
      )
      SELECT 
        AVG(avg_electricity) as avg_electricity,
        AVG(avg_gas) as avg_gas,
        AVG(avg_water) as avg_water,
        AVG(electricity_p25) as electricity_p25,
        AVG(electricity_median) as electricity_median,
        AVG(electricity_p75) as electricity_p75,
        AVG(gas_p25) as gas_p25,
        AVG(gas_median) as gas_median,
        AVG(gas_p75) as gas_p75,
        AVG(water_p25) as water_p25,
        AVG(water_median) as water_median,
        AVG(water_p75) as water_p75,
        COUNT(*) as sample_size
      FROM 
        consumption_data
    `;

    // Add timeframe parameters
    queryParams.push(timeframe.start, timeframe.end);

    // Execute query
    const result = await pool.query(query, queryParams);
    
    if (result.rows.length === 0 || result.rows[0].sample_size < 5) {
      // Insufficient data for meaningful benchmarking
      appLogger.info('Insufficient benchmark data for similar properties', {
        propertyType: propertyDetails.propertyType,
        sampleSize: result.rows[0]?.sample_size || 0
      });
      return null;
    }

    const benchmarkData: BenchmarkData = {
      electricity: {
        average: result.rows[0].avg_electricity || 0,
        percentile25: result.rows[0].electricity_p25 || 0,
        median: result.rows[0].electricity_median || 0,
        percentile75: result.rows[0].electricity_p75 || 0,
        sampleSize: result.rows[0].sample_size || 0
      },
      gas: {
        average: result.rows[0].avg_gas || 0,
        percentile25: result.rows[0].gas_p25 || 0,
        median: result.rows[0].gas_median || 0,
        percentile75: result.rows[0].gas_p75 || 0,
        sampleSize: result.rows[0].sample_size || 0
      },
      water: {
        average: result.rows[0].avg_water || 0,
        percentile25: result.rows[0].water_p25 || 0,
        median: result.rows[0].water_median || 0,
        percentile75: result.rows[0].water_p75 || 0,
        sampleSize: result.rows[0].sample_size || 0
      }
    };

    appLogger.info('Retrieved benchmark data for similar properties', {
      propertyType: propertyDetails.propertyType,
      sampleSize: benchmarkData.electricity.sampleSize
    });

    return benchmarkData;
  } catch (error) {
    appLogger.error('Error getting benchmark data:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      propertyDetails
    });
    return null; // Return null rather than throwing to avoid breaking the main calculation
  }
}

/**
 * Calculate percentile ranking of a value against benchmark data
 * @param value The value to calculate percentile for
 * @param benchmarkData The benchmark data
 * @param utilityType The utility type (electricity, gas, water)
 * @returns Percentile ranking (0-100) or null if benchmark data insufficient
 */
export function calculatePercentileRanking(
  value: number,
  benchmarkData: BenchmarkData | null,
  utilityType: 'electricity' | 'gas' | 'water'
): number | null {
  if (!benchmarkData || benchmarkData[utilityType].sampleSize < 5) {
    return null;
  }

  // If value is below 25th percentile
  if (value <= benchmarkData[utilityType].percentile25) {
    // Scale from 0 to 25
    return (value / benchmarkData[utilityType].percentile25) * 25;
  }
  // If value is between 25th and 50th percentile
  else if (value <= benchmarkData[utilityType].median) {
    // Scale from 25 to 50
    return 25 + ((value - benchmarkData[utilityType].percentile25) / 
      (benchmarkData[utilityType].median - benchmarkData[utilityType].percentile25)) * 25;
  }
  // If value is between 50th and 75th percentile
  else if (value <= benchmarkData[utilityType].percentile75) {
    // Scale from 50 to 75
    return 50 + ((value - benchmarkData[utilityType].median) / 
      (benchmarkData[utilityType].percentile75 - benchmarkData[utilityType].median)) * 25;
  }
  // If value is above 75th percentile
  else {
    // Scale from 75 to 100 (capped at 100)
    // Use 2x the 75th percentile as a rough upper bound
    const upperBound = benchmarkData[utilityType].percentile75 * 2;
    return Math.min(100, 75 + ((value - benchmarkData[utilityType].percentile75) / 
      (upperBound - benchmarkData[utilityType].percentile75)) * 25);
  }
}

/**
 * Get reference consumption for a similar property type
 * More accurate than benchmarking when we don't have enough actual data
 * @param propertyType The property type 
 * @param squareFootage The square footage
 * @param occupants The number of occupants
 * @returns Reference consumption values
 */
export function getReferenceConsumption(
  propertyType: string,
  squareFootage?: number,
  occupants?: number
): { electricity: number, gas: number, water: number } {
  // Default values based on typical usage
  let baseElectricity = 0;
  let baseGas = 0;
  let baseWater = 0;
  
  // Set base values by property type (monthly averages)
  switch (propertyType.toLowerCase()) {
    case 'apartment':
      baseElectricity = 400; // kWh
      baseGas = 25; // therms
      baseWater = 2000; // gallons
      break;
    case 'townhouse':
      baseElectricity = 600;
      baseGas = 40;
      baseWater = 3000;
      break;
    case 'single_family':
    case 'house':
      baseElectricity = 900;
      baseGas = 60;
      baseWater = 4000;
      break;
    case 'condo':
      baseElectricity = 500;
      baseGas = 30;
      baseWater = 2500;
      break;
    default:
      baseElectricity = 700;
      baseGas = 45;
      baseWater = 3500;
  }
  
  // Adjust by square footage if available
  if (squareFootage) {
    // Reference square footage by property type
    let refSquareFootage = 1500; // default
    
    switch (propertyType.toLowerCase()) {
      case 'apartment':
        refSquareFootage = 800;
        break;
      case 'townhouse':
        refSquareFootage = 1200;
        break;
      case 'single_family':
      case 'house':
        refSquareFootage = 2000;
        break;
      case 'condo':
        refSquareFootage = 1000;
        break;
    }
    
    // Electricity and gas scale with square footage, but not linearly
    // Using square root to model diminishing returns
    const squareFootageFactor = Math.sqrt(squareFootage / refSquareFootage);
    baseElectricity *= squareFootageFactor;
    baseGas *= squareFootageFactor;
  }
  
  // Adjust by occupants if available
  if (occupants) {
    // Water scales roughly linearly with occupants
    const occupantFactor = occupants / 2; // Reference is 2 occupants
    baseWater *= occupantFactor;
    
    // Electricity and gas have some scaling, but with diminishing returns
    const electricityOccupantFactor = 0.7 + (0.3 * Math.sqrt(occupants / 2));
    baseElectricity *= electricityOccupantFactor;
    
    const gasOccupantFactor = 0.8 + (0.2 * Math.sqrt(occupants / 2));
    baseGas *= gasOccupantFactor;
  }
  
  return {
    electricity: baseElectricity,
    gas: baseGas,
    water: baseWater
  };
}
