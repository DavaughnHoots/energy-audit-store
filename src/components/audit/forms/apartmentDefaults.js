"use strict";
// Apartment-specific defaults based on research data
// See the research documentation for details and sources
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApartmentDefaults = exports.apartmentDefaults = exports.apartmentEnergyUsageBaseline = exports.apartmentClimateZoneAdjustments = exports.apartmentPositionAdjustments = exports.apartmentSizeAdjustments = exports.getApartmentUnitPosition = exports.getApartmentSizeCategory = exports.getApartmentConstructionPeriod = void 0;
var housingTypeDefaults_1 = require("./housingTypeDefaults");
// Helper functions to determine construction period from year built
var getApartmentConstructionPeriod = function (yearBuilt) {
    if (yearBuilt < 1980)
        return 'pre-1980';
    if (yearBuilt < 2000)
        return '1980-2000';
    return 'post-2000';
};
exports.getApartmentConstructionPeriod = getApartmentConstructionPeriod;
// Helper functions to determine size category based on square footage
var getApartmentSizeCategory = function (squareFootage) {
    if (squareFootage < 800)
        return 'small';
    if (squareFootage <= 1200)
        return 'medium';
    return 'large';
};
exports.getApartmentSizeCategory = getApartmentSizeCategory;
// Helper function to determine unit position
var getApartmentUnitPosition = function (position) {
    if (position === 'corner')
        return 'corner';
    if (position === 'top-floor')
        return 'top-floor';
    return 'interior'; // Default to interior unit
};
exports.getApartmentUnitPosition = getApartmentUnitPosition;
// Size adjustment factors for energy usage
exports.apartmentSizeAdjustments = {
    'small': 0.8,
    'medium': 1.0,
    'large': 1.2
};
// Unit position adjustment factors for energy usage
exports.apartmentPositionAdjustments = {
    'interior': 1.0, // Baseline
    'corner': 1.15, // ~15% higher energy usage than interior units due to more exterior walls
    'top-floor': 1.12 // ~12% higher energy usage than interior units due to roof exposure
};
// Climate zone adjustment multipliers for energy usage
exports.apartmentClimateZoneAdjustments = {
    'cold-very-cold': 1.2,
    'mixed-humid': 1.0,
    'hot-humid': 0.9,
    'hot-dry-mixed-dry': 0.95
};
// Energy usage baseline by construction period (MMBtu/yr)
exports.apartmentEnergyUsageBaseline = {
    'pre-1980': 50, // Older apartments generally have less efficient systems than condos
    '1980-2000': 42, // Better insulation but still less optimized than condo units
    'post-2000': 38 // Modern code requirements but less likely to have owner upgrades
};
// Define the apartment defaults structure
exports.apartmentDefaults = {
    'pre-1980': {
        'small': {
            homeDetails: {
                squareFootage: 600,
                stories: 1,
                bedrooms: 1,
                bathrooms: 1,
                ceilingHeight: 8,
                numRooms: 3,
                homeType: 'apartment'
            },
            currentConditions: {
                insulation: {
                    attic: 'not-applicable',
                    walls: 'below-average',
                    floor: 'not-applicable',
                    basement: 'not-applicable'
                },
                windowType: 'single',
                windowCondition: 'fair',
                numWindows: 4,
                windowCount: 'few',
                airLeaks: ['minor-drafts', 'visible-gaps'],
                weatherStripping: 'none',
                estimatedACH: 10,
                temperatureConsistency: 'large-variations'
            },
            heatingCooling: {
                heatingSystem: {
                    type: 'electric-baseboard',
                    fuel: 'electricity',
                    efficiency: 100,
                    age: 25
                },
                coolingSystem: {
                    type: 'window-units',
                    efficiency: 7,
                    age: 12
                },
                thermostatType: 'manual',
                zoneCount: 1,
                systemPerformance: 'some-problems'
            },
            energyConsumption: {
                estimatedAnnualUsage: 50,
                energyIntensity: 83,
                heatingPct: 45,
                coolingPct: 15
            }
        },
        'medium': {
            homeDetails: {
                squareFootage: 900,
                stories: 1,
                bedrooms: 2,
                bathrooms: 1,
                ceilingHeight: 8,
                numRooms: 4,
                homeType: 'apartment'
            },
            currentConditions: {
                insulation: {
                    attic: 'not-applicable',
                    walls: 'below-average',
                    floor: 'not-applicable',
                    basement: 'not-applicable'
                },
                windowType: 'single',
                windowCondition: 'fair',
                numWindows: 6,
                windowCount: 'few',
                airLeaks: ['minor-drafts', 'visible-gaps'],
                weatherStripping: 'none',
                estimatedACH: 10,
                temperatureConsistency: 'large-variations'
            },
            heatingCooling: {
                heatingSystem: {
                    type: 'wall-unit',
                    fuel: 'natural-gas',
                    efficiency: 65,
                    age: 18
                },
                coolingSystem: {
                    type: 'window-units',
                    efficiency: 7,
                    age: 10
                },
                thermostatType: 'manual',
                zoneCount: 1,
                systemPerformance: 'some-problems'
            },
            energyConsumption: {
                estimatedAnnualUsage: 58,
                energyIntensity: 64,
                heatingPct: 45,
                coolingPct: 15
            }
        },
        'large': {
            homeDetails: {
                squareFootage: 1400,
                stories: 1,
                bedrooms: 3,
                bathrooms: 2,
                ceilingHeight: 8,
                numRooms: 6,
                homeType: 'apartment'
            },
            currentConditions: {
                insulation: {
                    attic: 'not-applicable',
                    walls: 'below-average',
                    floor: 'not-applicable',
                    basement: 'not-applicable'
                },
                windowType: 'single',
                windowCondition: 'fair',
                numWindows: 8,
                windowCount: 'average',
                airLeaks: ['minor-drafts', 'visible-gaps'],
                weatherStripping: 'minimal',
                estimatedACH: 8,
                temperatureConsistency: 'large-variations'
            },
            heatingCooling: {
                heatingSystem: {
                    type: 'central-heating',
                    fuel: 'natural-gas',
                    efficiency: 70,
                    age: 18
                },
                coolingSystem: {
                    type: 'central-ac',
                    efficiency: 8,
                    age: 12
                },
                thermostatType: 'manual',
                zoneCount: 1,
                systemPerformance: 'some-problems'
            },
            energyConsumption: {
                estimatedAnnualUsage: 68,
                energyIntensity: 49,
                heatingPct: 40,
                coolingPct: 20
            }
        }
    },
    '1980-2000': {
        'small': {
            homeDetails: {
                squareFootage: 650,
                stories: 1,
                bedrooms: 1,
                bathrooms: 1,
                ceilingHeight: 8,
                numRooms: 3,
                homeType: 'apartment'
            },
            currentConditions: {
                insulation: {
                    attic: 'not-applicable',
                    walls: 'average',
                    floor: 'not-applicable',
                    basement: 'not-applicable'
                },
                windowType: 'double-clear',
                windowCondition: 'fair',
                numWindows: 4,
                windowCount: 'few',
                airLeaks: ['minor-drafts'],
                weatherStripping: 'basic',
                estimatedACH: 6,
                temperatureConsistency: 'some-variations'
            },
            heatingCooling: {
                heatingSystem: {
                    type: 'electric-baseboard',
                    fuel: 'electricity',
                    efficiency: 100,
                    age: 12
                },
                coolingSystem: {
                    type: 'window-units',
                    efficiency: 9,
                    age: 8
                },
                thermostatType: 'manual',
                zoneCount: 1,
                systemPerformance: 'works-well'
            },
            energyConsumption: {
                estimatedAnnualUsage: 40,
                energyIntensity: 62,
                heatingPct: 40,
                coolingPct: 20
            }
        },
        'medium': {
            homeDetails: {
                squareFootage: 950,
                stories: 1,
                bedrooms: 2,
                bathrooms: 1.5,
                ceilingHeight: 8,
                numRooms: 4,
                homeType: 'apartment'
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
                numWindows: 6,
                windowCount: 'average',
                airLeaks: ['minor-drafts'],
                weatherStripping: 'basic',
                estimatedACH: 5,
                temperatureConsistency: 'some-variations'
            },
            heatingCooling: {
                heatingSystem: {
                    type: 'central-heating',
                    fuel: 'natural-gas',
                    efficiency: 80,
                    age: 12
                },
                coolingSystem: {
                    type: 'central-ac',
                    efficiency: 10,
                    age: 12
                },
                thermostatType: 'programmable',
                zoneCount: 1,
                systemPerformance: 'works-well'
            },
            energyConsumption: {
                estimatedAnnualUsage: 45,
                energyIntensity: 47,
                heatingPct: 38,
                coolingPct: 25
            }
        },
        'large': {
            homeDetails: {
                squareFootage: 1500,
                stories: 1,
                bedrooms: 3,
                bathrooms: 2,
                ceilingHeight: 8,
                numRooms: 6,
                homeType: 'apartment'
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
                airLeaks: ['minor-drafts'],
                weatherStripping: 'basic',
                estimatedACH: 5,
                temperatureConsistency: 'some-variations'
            },
            heatingCooling: {
                heatingSystem: {
                    type: 'central-heating',
                    fuel: 'natural-gas',
                    efficiency: 80,
                    age: 12
                },
                coolingSystem: {
                    type: 'central-ac',
                    efficiency: 10,
                    age: 12
                },
                thermostatType: 'programmable',
                zoneCount: 1,
                systemPerformance: 'works-well'
            },
            energyConsumption: {
                estimatedAnnualUsage: 52,
                energyIntensity: 35,
                heatingPct: 38,
                coolingPct: 30
            }
        }
    },
    'post-2000': {
        'small': {
            homeDetails: {
                squareFootage: 700,
                stories: 1,
                bedrooms: 1,
                bathrooms: 1,
                ceilingHeight: 9,
                numRooms: 3,
                homeType: 'apartment'
            },
            currentConditions: {
                insulation: {
                    attic: 'not-applicable',
                    walls: 'good',
                    floor: 'not-applicable',
                    basement: 'not-applicable'
                },
                windowType: 'double-low-e',
                windowCondition: 'good',
                numWindows: 5,
                windowCount: 'few',
                airLeaks: ['none'],
                weatherStripping: 'foam',
                estimatedACH: 3,
                temperatureConsistency: 'very-consistent'
            },
            heatingCooling: {
                heatingSystem: {
                    type: 'heat-pump',
                    fuel: 'electricity',
                    efficiency: 9,
                    age: 7
                },
                coolingSystem: {
                    type: 'heat-pump',
                    efficiency: 14,
                    age: 7
                },
                thermostatType: 'programmable',
                zoneCount: 1,
                systemPerformance: 'works-well'
            },
            energyConsumption: {
                estimatedAnnualUsage: 35,
                energyIntensity: 50,
                heatingPct: 30,
                coolingPct: 30
            }
        },
        'medium': {
            homeDetails: {
                squareFootage: 1000,
                stories: 1,
                bedrooms: 2,
                bathrooms: 2,
                ceilingHeight: 9,
                numRooms: 5,
                homeType: 'apartment'
            },
            currentConditions: {
                insulation: {
                    attic: 'not-applicable',
                    walls: 'good',
                    floor: 'not-applicable',
                    basement: 'not-applicable'
                },
                windowType: 'double-low-e',
                windowCondition: 'good',
                numWindows: 7,
                windowCount: 'average',
                airLeaks: ['none'],
                weatherStripping: 'foam',
                estimatedACH: 3,
                temperatureConsistency: 'very-consistent'
            },
            heatingCooling: {
                heatingSystem: {
                    type: 'heat-pump',
                    fuel: 'electricity',
                    efficiency: 9,
                    age: 7
                },
                coolingSystem: {
                    type: 'heat-pump',
                    efficiency: 15,
                    age: 7
                },
                thermostatType: 'programmable',
                zoneCount: 1,
                systemPerformance: 'works-well'
            },
            energyConsumption: {
                estimatedAnnualUsage: 40,
                energyIntensity: 40,
                heatingPct: 30,
                coolingPct: 35
            }
        },
        'large': {
            homeDetails: {
                squareFootage: 1500,
                stories: 1,
                bedrooms: 3,
                bathrooms: 2,
                ceilingHeight: 9,
                numRooms: 6,
                homeType: 'apartment'
            },
            currentConditions: {
                insulation: {
                    attic: 'not-applicable',
                    walls: 'good',
                    floor: 'not-applicable',
                    basement: 'not-applicable'
                },
                windowType: 'double-low-e',
                windowCondition: 'good',
                numWindows: 9,
                windowCount: 'average',
                airLeaks: ['none'],
                weatherStripping: 'foam',
                estimatedACH: 3,
                temperatureConsistency: 'very-consistent'
            },
            heatingCooling: {
                heatingSystem: {
                    type: 'heat-pump',
                    fuel: 'electricity',
                    efficiency: 9,
                    age: 6
                },
                coolingSystem: {
                    type: 'heat-pump',
                    efficiency: 15,
                    age: 6
                },
                thermostatType: 'programmable',
                zoneCount: 1,
                systemPerformance: 'works-well'
            },
            energyConsumption: {
                estimatedAnnualUsage: 45,
                energyIntensity: 30,
                heatingPct: 30,
                coolingPct: 35
            }
        }
    }
};
// Main function to get apartment defaults based on year built, square footage, and unit position
var getApartmentDefaults = function (yearBuilt, squareFootage, state, unitPosition) {
    if (unitPosition === void 0) { unitPosition = 'interior'; }
    var constructionPeriod = (0, exports.getApartmentConstructionPeriod)(yearBuilt);
    var sizeCategory = (0, exports.getApartmentSizeCategory)(squareFootage);
    var position = (0, exports.getApartmentUnitPosition)(unitPosition);
    // Get base defaults
    var defaults = JSON.parse(JSON.stringify(exports.apartmentDefaults[constructionPeriod][sizeCategory]));
    // Add unit position to home details
    defaults.homeDetails.unitPosition = position;
    // Calculate climate-adjusted energy usage if state is provided
    if (state) {
        var numericZone = (0, housingTypeDefaults_1.getClimateZone)(state);
        var descriptiveZone = (0, housingTypeDefaults_1.getDescriptiveClimateZone)(numericZone);
        var climateAdjustment = exports.apartmentClimateZoneAdjustments[descriptiveZone] || 1.0;
        var sizeAdjustment = exports.apartmentSizeAdjustments[sizeCategory] || 1.0;
        var positionAdjustment = exports.apartmentPositionAdjustments[position] || 1.0;
        var baseEnergyUsage = exports.apartmentEnergyUsageBaseline[constructionPeriod] || 42; // Default to average if not found
        // Calculate adjusted energy usage with all factors
        var adjustedEnergyUsage = Math.round(baseEnergyUsage * climateAdjustment * sizeAdjustment * positionAdjustment);
        // Update energy consumption values
        defaults.energyConsumption.estimatedAnnualUsage = adjustedEnergyUsage;
    }
    return defaults;
};
exports.getApartmentDefaults = getApartmentDefaults;
