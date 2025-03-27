"use strict";
// Condominium-specific defaults based on research data
// See the research documentation for details and sources
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCondominiumDefaults = exports.condominiumDefaults = exports.condominiumEnergyUsageBaseline = exports.condominiumClimateZoneAdjustments = exports.condominiumPositionAdjustments = exports.condominiumSizeAdjustments = exports.getCondominiumUnitPosition = exports.getCondominiumSizeCategory = exports.getCondominiumConstructionPeriod = void 0;
var housingTypeDefaults_1 = require("./housingTypeDefaults");
// Helper functions to determine construction period from year built
var getCondominiumConstructionPeriod = function (yearBuilt) {
    if (yearBuilt < 1980)
        return 'pre-1980';
    if (yearBuilt < 2000)
        return '1980-2000';
    return 'post-2000';
};
exports.getCondominiumConstructionPeriod = getCondominiumConstructionPeriod;
// Helper functions to determine size category based on square footage
var getCondominiumSizeCategory = function (squareFootage) {
    if (squareFootage < 900)
        return 'small';
    if (squareFootage <= 1500)
        return 'medium';
    return 'large';
};
exports.getCondominiumSizeCategory = getCondominiumSizeCategory;
// Helper function to determine unit position
var getCondominiumUnitPosition = function (position) {
    if (position === 'corner')
        return 'corner';
    if (position === 'top-floor')
        return 'top-floor';
    return 'interior'; // Default to interior unit
};
exports.getCondominiumUnitPosition = getCondominiumUnitPosition;
// Size adjustment factors for energy usage
exports.condominiumSizeAdjustments = {
    'small': 0.8,
    'medium': 1.0,
    'large': 1.2
};
// Unit position adjustment factors for energy usage
exports.condominiumPositionAdjustments = {
    'interior': 1.0, // Baseline
    'corner': 1.15, // ~15% higher energy usage than interior units due to more exterior walls
    'top-floor': 1.12 // ~12% higher energy usage than interior units due to roof exposure
};
// Climate zone adjustment multipliers for energy usage
exports.condominiumClimateZoneAdjustments = {
    'cold-very-cold': 1.2,
    'mixed-humid': 1.0,
    'hot-humid': 0.9,
    'hot-dry-mixed-dry': 0.95
};
// Energy usage baseline by construction period (MMBtu/yr)
exports.condominiumEnergyUsageBaseline = {
    'pre-1980': 48, // Lower than townhouses/single-family due to shared walls/floors/ceilings
    '1980-2000': 40, // Better insulation and more efficient systems
    'post-2000': 36 // Modern code requirements and high-efficiency systems
};
// Define the condominium defaults structure
exports.condominiumDefaults = {
    'pre-1980': {
        'small': {
            homeDetails: {
                squareFootage: 750,
                stories: 1,
                bedrooms: 1,
                bathrooms: 1,
                ceilingHeight: 8,
                numRooms: 3,
                homeType: 'condominium'
            },
            currentConditions: {
                insulation: {
                    attic: 'not-applicable',
                    walls: 'below-average',
                    floor: 'not-applicable',
                    basement: 'not-applicable'
                },
                windowType: 'single-with-storm',
                windowCondition: 'fair',
                numWindows: 5,
                windowCount: 'few',
                airLeaks: ['minor-drafts'],
                weatherStripping: 'minimal',
                estimatedACH: 8,
                temperatureConsistency: 'some-variations'
            },
            heatingCooling: {
                heatingSystem: {
                    type: 'electric-baseboard',
                    fuel: 'electricity',
                    efficiency: 100,
                    age: 20
                },
                coolingSystem: {
                    type: 'window-units',
                    efficiency: 8,
                    age: 10
                },
                thermostatType: 'manual',
                zoneCount: 1,
                systemPerformance: 'some-problems'
            },
            energyConsumption: {
                estimatedAnnualUsage: 48,
                energyIntensity: 64,
                heatingPct: 45,
                coolingPct: 15
            }
        },
        'medium': {
            homeDetails: {
                squareFootage: 1100,
                stories: 1,
                bedrooms: 2,
                bathrooms: 1.5,
                ceilingHeight: 8,
                numRooms: 5,
                homeType: 'condominium'
            },
            currentConditions: {
                insulation: {
                    attic: 'not-applicable',
                    walls: 'below-average',
                    floor: 'not-applicable',
                    basement: 'not-applicable'
                },
                windowType: 'single-with-storm',
                windowCondition: 'fair',
                numWindows: 7,
                windowCount: 'few',
                airLeaks: ['minor-drafts'],
                weatherStripping: 'minimal',
                estimatedACH: 8,
                temperatureConsistency: 'some-variations'
            },
            heatingCooling: {
                heatingSystem: {
                    type: 'wall-unit',
                    fuel: 'natural-gas',
                    efficiency: 70,
                    age: 15
                },
                coolingSystem: {
                    type: 'window-units',
                    efficiency: 8,
                    age: 10
                },
                thermostatType: 'manual',
                zoneCount: 1,
                systemPerformance: 'some-problems'
            },
            energyConsumption: {
                estimatedAnnualUsage: 55,
                energyIntensity: 50,
                heatingPct: 45,
                coolingPct: 15
            }
        },
        'large': {
            homeDetails: {
                squareFootage: 1800,
                stories: 1,
                bedrooms: 3,
                bathrooms: 2,
                ceilingHeight: 8,
                numRooms: 7,
                homeType: 'condominium'
            },
            currentConditions: {
                insulation: {
                    attic: 'not-applicable',
                    walls: 'average',
                    floor: 'not-applicable',
                    basement: 'not-applicable'
                },
                windowType: 'single-with-storm',
                windowCondition: 'fair',
                numWindows: 10,
                windowCount: 'average',
                airLeaks: ['minor-drafts'],
                weatherStripping: 'minimal',
                estimatedACH: 7,
                temperatureConsistency: 'some-variations'
            },
            heatingCooling: {
                heatingSystem: {
                    type: 'boiler-radiator',
                    fuel: 'natural-gas',
                    efficiency: 70,
                    age: 15
                },
                coolingSystem: {
                    type: 'window-units',
                    efficiency: 9,
                    age: 10
                },
                thermostatType: 'manual',
                zoneCount: 1,
                systemPerformance: 'some-problems'
            },
            energyConsumption: {
                estimatedAnnualUsage: 65,
                energyIntensity: 36,
                heatingPct: 40,
                coolingPct: 20
            }
        }
    },
    '1980-2000': {
        'small': {
            homeDetails: {
                squareFootage: 750,
                stories: 1,
                bedrooms: 1,
                bathrooms: 1,
                ceilingHeight: 8,
                numRooms: 3,
                homeType: 'condominium'
            },
            currentConditions: {
                insulation: {
                    attic: 'not-applicable',
                    walls: 'average',
                    floor: 'not-applicable',
                    basement: 'not-applicable'
                },
                windowType: 'double-clear',
                windowCondition: 'good',
                numWindows: 5,
                windowCount: 'few',
                airLeaks: ['none'],
                weatherStripping: 'basic',
                estimatedACH: 5,
                temperatureConsistency: 'very-consistent'
            },
            heatingCooling: {
                heatingSystem: {
                    type: 'heat-pump',
                    fuel: 'electricity',
                    efficiency: 8,
                    age: 10
                },
                coolingSystem: {
                    type: 'heat-pump',
                    efficiency: 11,
                    age: 10
                },
                thermostatType: 'programmable',
                zoneCount: 1,
                systemPerformance: 'works-well'
            },
            energyConsumption: {
                estimatedAnnualUsage: 36,
                energyIntensity: 48,
                heatingPct: 35,
                coolingPct: 25
            }
        },
        'medium': {
            homeDetails: {
                squareFootage: 1200,
                stories: 1,
                bedrooms: 2,
                bathrooms: 2,
                ceilingHeight: 9,
                numRooms: 5,
                homeType: 'condominium'
            },
            currentConditions: {
                insulation: {
                    attic: 'not-applicable',
                    walls: 'average',
                    floor: 'not-applicable',
                    basement: 'not-applicable'
                },
                windowType: 'double-clear',
                windowCondition: 'good',
                numWindows: 8,
                windowCount: 'average',
                airLeaks: ['none'],
                weatherStripping: 'foam',
                estimatedACH: 4,
                temperatureConsistency: 'very-consistent'
            },
            heatingCooling: {
                heatingSystem: {
                    type: 'heat-pump',
                    fuel: 'electricity',
                    efficiency: 8.5,
                    age: 8
                },
                coolingSystem: {
                    type: 'heat-pump',
                    efficiency: 12,
                    age: 8
                },
                thermostatType: 'programmable',
                zoneCount: 1,
                systemPerformance: 'works-well'
            },
            energyConsumption: {
                estimatedAnnualUsage: 42,
                energyIntensity: 35,
                heatingPct: 35,
                coolingPct: 25
            }
        },
        'large': {
            homeDetails: {
                squareFootage: 1800,
                stories: 1,
                bedrooms: 3,
                bathrooms: 2,
                ceilingHeight: 9,
                numRooms: 7,
                homeType: 'condominium'
            },
            currentConditions: {
                insulation: {
                    attic: 'not-applicable',
                    walls: 'good',
                    floor: 'not-applicable',
                    basement: 'not-applicable'
                },
                windowType: 'double-clear',
                windowCondition: 'good',
                numWindows: 10,
                windowCount: 'average',
                airLeaks: ['none'],
                weatherStripping: 'foam',
                estimatedACH: 4,
                temperatureConsistency: 'very-consistent'
            },
            heatingCooling: {
                heatingSystem: {
                    type: 'heat-pump',
                    fuel: 'electricity',
                    efficiency: 9,
                    age: 8
                },
                coolingSystem: {
                    type: 'heat-pump',
                    efficiency: 13,
                    age: 8
                },
                thermostatType: 'programmable',
                zoneCount: 2,
                systemPerformance: 'works-well'
            },
            energyConsumption: {
                estimatedAnnualUsage: 48,
                energyIntensity: 27,
                heatingPct: 35,
                coolingPct: 30
            }
        }
    },
    'post-2000': {
        'small': {
            homeDetails: {
                squareFootage: 800,
                stories: 1,
                bedrooms: 1,
                bathrooms: 1,
                ceilingHeight: 9,
                numRooms: 3,
                homeType: 'condominium'
            },
            currentConditions: {
                insulation: {
                    attic: 'not-applicable',
                    walls: 'good',
                    floor: 'not-applicable',
                    basement: 'not-applicable'
                },
                windowType: 'double-low-e',
                windowCondition: 'excellent',
                numWindows: 5,
                windowCount: 'few',
                airLeaks: ['none'],
                weatherStripping: 'foam',
                estimatedACH: 2,
                temperatureConsistency: 'very-consistent'
            },
            heatingCooling: {
                heatingSystem: {
                    type: 'heat-pump',
                    fuel: 'electricity',
                    efficiency: 10,
                    age: 5
                },
                coolingSystem: {
                    type: 'heat-pump',
                    efficiency: 16,
                    age: 5
                },
                thermostatType: 'smart',
                zoneCount: 1,
                systemPerformance: 'works-well'
            },
            energyConsumption: {
                estimatedAnnualUsage: 32,
                energyIntensity: 40,
                heatingPct: 30,
                coolingPct: 30
            }
        },
        'medium': {
            homeDetails: {
                squareFootage: 1200,
                stories: 1,
                bedrooms: 2,
                bathrooms: 2,
                ceilingHeight: 9,
                numRooms: 5,
                homeType: 'condominium'
            },
            currentConditions: {
                insulation: {
                    attic: 'not-applicable',
                    walls: 'good',
                    floor: 'not-applicable',
                    basement: 'not-applicable'
                },
                windowType: 'double-low-e',
                windowCondition: 'excellent',
                numWindows: 8,
                windowCount: 'average',
                airLeaks: ['none'],
                weatherStripping: 'foam',
                estimatedACH: 2,
                temperatureConsistency: 'very-consistent'
            },
            heatingCooling: {
                heatingSystem: {
                    type: 'heat-pump',
                    fuel: 'electricity',
                    efficiency: 10,
                    age: 5
                },
                coolingSystem: {
                    type: 'heat-pump',
                    efficiency: 17,
                    age: 5
                },
                thermostatType: 'smart',
                zoneCount: 1,
                systemPerformance: 'works-well'
            },
            energyConsumption: {
                estimatedAnnualUsage: 36,
                energyIntensity: 30,
                heatingPct: 30,
                coolingPct: 35
            }
        },
        'large': {
            homeDetails: {
                squareFootage: 1800,
                stories: 1,
                bedrooms: 3,
                bathrooms: 2.5,
                ceilingHeight: 10,
                numRooms: 7,
                homeType: 'condominium'
            },
            currentConditions: {
                insulation: {
                    attic: 'not-applicable',
                    walls: 'good',
                    floor: 'not-applicable',
                    basement: 'not-applicable'
                },
                windowType: 'double-low-e',
                windowCondition: 'excellent',
                numWindows: 12,
                windowCount: 'average',
                airLeaks: ['none'],
                weatherStripping: 'foam',
                estimatedACH: 2,
                temperatureConsistency: 'very-consistent'
            },
            heatingCooling: {
                heatingSystem: {
                    type: 'heat-pump',
                    fuel: 'electricity',
                    efficiency: 11,
                    age: 3
                },
                coolingSystem: {
                    type: 'heat-pump',
                    efficiency: 18,
                    age: 3
                },
                thermostatType: 'smart',
                zoneCount: 2,
                systemPerformance: 'works-well'
            },
            energyConsumption: {
                estimatedAnnualUsage: 40,
                energyIntensity: 22,
                heatingPct: 30,
                coolingPct: 35
            }
        }
    }
};
// Main function to get condominium defaults based on year built, square footage, and unit position
var getCondominiumDefaults = function (yearBuilt, squareFootage, state, unitPosition) {
    if (unitPosition === void 0) { unitPosition = 'interior'; }
    var constructionPeriod = (0, exports.getCondominiumConstructionPeriod)(yearBuilt);
    var sizeCategory = (0, exports.getCondominiumSizeCategory)(squareFootage);
    var position = (0, exports.getCondominiumUnitPosition)(unitPosition);
    // Get base defaults
    var defaults = JSON.parse(JSON.stringify(exports.condominiumDefaults[constructionPeriod][sizeCategory]));
    // Add unit position to home details
    defaults.homeDetails.unitPosition = position;
    // Calculate climate-adjusted energy usage if state is provided
    if (state) {
        var numericZone = (0, housingTypeDefaults_1.getClimateZone)(state);
        var descriptiveZone = (0, housingTypeDefaults_1.getDescriptiveClimateZone)(numericZone);
        var climateAdjustment = exports.condominiumClimateZoneAdjustments[descriptiveZone] || 1.0;
        var sizeAdjustment = exports.condominiumSizeAdjustments[sizeCategory] || 1.0;
        var positionAdjustment = exports.condominiumPositionAdjustments[position] || 1.0;
        var baseEnergyUsage = exports.condominiumEnergyUsageBaseline[constructionPeriod] || 40; // Default to average if not found
        // Calculate adjusted energy usage with all factors
        var adjustedEnergyUsage = Math.round(baseEnergyUsage * climateAdjustment * sizeAdjustment * positionAdjustment);
        // Update energy consumption values
        defaults.energyConsumption.estimatedAnnualUsage = adjustedEnergyUsage;
    }
    return defaults;
};
exports.getCondominiumDefaults = getCondominiumDefaults;
