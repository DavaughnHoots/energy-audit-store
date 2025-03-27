"use strict";
// Duplex-specific defaults based on research data
// See duplex-defaults.md for detailed documentation and sources
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDuplexDefaults = exports.duplexDefaults = exports.duplexEnergyUsageBaseline = exports.duplexClimateZoneAdjustments = exports.duplexConfigurationAdjustments = exports.duplexSizeAdjustments = exports.getDuplexUnitConfiguration = exports.getDuplexSizeCategory = exports.getDuplexConstructionPeriod = void 0;
var housingTypeDefaults_1 = require("./housingTypeDefaults");
// Helper functions to determine construction period from year built
var getDuplexConstructionPeriod = function (yearBuilt) {
    if (yearBuilt < 1980)
        return 'pre-1980';
    if (yearBuilt < 2000)
        return '1980-2000';
    return 'post-2000';
};
exports.getDuplexConstructionPeriod = getDuplexConstructionPeriod;
// Helper functions to determine size category based on square footage
var getDuplexSizeCategory = function (squareFootage) {
    if (squareFootage < 1500)
        return 'small';
    if (squareFootage <= 2500)
        return 'medium';
    return 'large';
};
exports.getDuplexSizeCategory = getDuplexSizeCategory;
// Helper function to determine duplex unit configuration type
var getDuplexUnitConfiguration = function (configuration) {
    if (configuration === 'stacked')
        return 'stacked';
    if (configuration === 'front-to-back')
        return 'front-to-back';
    return 'side-by-side'; // Default to side-by-side unit
};
exports.getDuplexUnitConfiguration = getDuplexUnitConfiguration;
// Size adjustment factors for energy usage
exports.duplexSizeAdjustments = {
    'small': 0.9,
    'medium': 1.0,
    'large': 1.2
};
// Unit configuration adjustment factors for energy usage
exports.duplexConfigurationAdjustments = {
    'side-by-side': 1.0, // Baseline
    'stacked': 0.95, // 5% less energy due to less exterior wall exposure
    'front-to-back': 1.05 // 5% more energy due to more exterior wall exposure
};
// Climate zone adjustment multipliers for energy usage
exports.duplexClimateZoneAdjustments = {
    'cold-very-cold': 1.2,
    'mixed-humid': 1.0,
    'hot-humid': 0.9,
    'hot-dry-mixed-dry': 0.95
};
// Energy usage baseline by construction period and unit configuration (MMBtu/yr) - medium size baseline
exports.duplexEnergyUsageBaseline = {
    'pre-1980': {
        'side-by-side': 75,
        'stacked': 70,
        'front-to-back': 78
    },
    '1980-2000': {
        'side-by-side': 55,
        'stacked': 52,
        'front-to-back': 58
    },
    'post-2000': {
        'side-by-side': 40,
        'stacked': 38,
        'front-to-back': 42
    }
};
// Define the duplex defaults structure
exports.duplexDefaults = {
    'pre-1980': {
        'small': {
            'side-by-side': {
                homeDetails: {
                    squareFootage: 1200,
                    stories: 2,
                    bedrooms: 2,
                    bathrooms: 1.5,
                    ceilingHeight: 8,
                    numRooms: 5,
                    homeType: 'duplex',
                    unitConfiguration: 'side-by-side'
                },
                currentConditions: {
                    insulation: {
                        attic: 'below-average',
                        walls: 'poor',
                        floor: 'poor',
                        basement: 'none',
                        sharedWall: 'minimal'
                    },
                    windowType: 'single-with-storm',
                    windowCondition: 'fair',
                    numWindows: 8,
                    windowCount: 'few',
                    airLeaks: ['major-drafts', 'attic-bypasses', 'rim-joist-leakage'],
                    weatherStripping: 'minimal',
                    estimatedACH: 12,
                    temperatureConsistency: 'large-variations'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace',
                        fuel: 'natural-gas',
                        efficiency: 65,
                        age: 25
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
                    estimatedAnnualUsage: 60,
                    energyIntensity: 50,
                    heatingPct: 55,
                    coolingPct: 10
                }
            },
            'stacked': {
                homeDetails: {
                    squareFootage: 1200,
                    stories: 1,
                    bedrooms: 2,
                    bathrooms: 1,
                    ceilingHeight: 8,
                    numRooms: 5,
                    homeType: 'duplex',
                    unitConfiguration: 'stacked'
                },
                currentConditions: {
                    insulation: {
                        attic: 'below-average',
                        walls: 'poor',
                        floor: 'poor',
                        basement: 'none',
                        sharedFloor: 'minimal'
                    },
                    windowType: 'single-with-storm',
                    windowCondition: 'fair',
                    numWindows: 6,
                    windowCount: 'few',
                    airLeaks: ['major-drafts', 'visible-gaps'],
                    weatherStripping: 'minimal',
                    estimatedACH: 12,
                    temperatureConsistency: 'large-variations'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace',
                        fuel: 'natural-gas',
                        efficiency: 65,
                        age: 25
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
                    energyIntensity: 46,
                    heatingPct: 50,
                    coolingPct: 10
                }
            },
            'front-to-back': {
                homeDetails: {
                    squareFootage: 1200,
                    stories: 1,
                    bedrooms: 2,
                    bathrooms: 1,
                    ceilingHeight: 8,
                    numRooms: 5,
                    homeType: 'duplex',
                    unitConfiguration: 'front-to-back'
                },
                currentConditions: {
                    insulation: {
                        attic: 'below-average',
                        walls: 'poor',
                        floor: 'poor',
                        basement: 'none',
                        sharedWall: 'minimal'
                    },
                    windowType: 'single-with-storm',
                    windowCondition: 'fair',
                    numWindows: 7,
                    windowCount: 'few',
                    airLeaks: ['major-drafts', 'visible-gaps'],
                    weatherStripping: 'minimal',
                    estimatedACH: 12,
                    temperatureConsistency: 'large-variations'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace',
                        fuel: 'natural-gas',
                        efficiency: 65,
                        age: 25
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
                    estimatedAnnualUsage: 63,
                    energyIntensity: 53,
                    heatingPct: 55,
                    coolingPct: 10
                }
            }
        },
        'medium': {
            'side-by-side': {
                homeDetails: {
                    squareFootage: 1800,
                    stories: 2,
                    bedrooms: 3,
                    bathrooms: 2,
                    ceilingHeight: 8,
                    numRooms: 7,
                    homeType: 'duplex',
                    unitConfiguration: 'side-by-side'
                },
                currentConditions: {
                    insulation: {
                        attic: 'below-average',
                        walls: 'below-average',
                        floor: 'below-average',
                        basement: 'none',
                        sharedWall: 'minimal'
                    },
                    windowType: 'single-with-storm',
                    windowCondition: 'fair',
                    numWindows: 12,
                    windowCount: 'average',
                    airLeaks: ['major-drafts', 'attic-bypasses'],
                    weatherStripping: 'minimal',
                    estimatedACH: 10,
                    temperatureConsistency: 'large-variations'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace',
                        fuel: 'natural-gas',
                        efficiency: 65,
                        age: 20
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 9,
                        age: 15
                    },
                    thermostatType: 'manual',
                    zoneCount: 1,
                    systemPerformance: 'some-problems'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 75,
                    energyIntensity: 42,
                    heatingPct: 55,
                    coolingPct: 10
                }
            },
            'stacked': {
                homeDetails: {
                    squareFootage: 1800,
                    stories: 1,
                    bedrooms: 3,
                    bathrooms: 2,
                    ceilingHeight: 8,
                    numRooms: 7,
                    homeType: 'duplex',
                    unitConfiguration: 'stacked'
                },
                currentConditions: {
                    insulation: {
                        attic: 'below-average',
                        walls: 'below-average',
                        floor: 'below-average',
                        basement: 'none',
                        sharedFloor: 'minimal'
                    },
                    windowType: 'single-with-storm',
                    windowCondition: 'fair',
                    numWindows: 10,
                    windowCount: 'average',
                    airLeaks: ['major-drafts', 'visible-gaps'],
                    weatherStripping: 'minimal',
                    estimatedACH: 10,
                    temperatureConsistency: 'large-variations'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace',
                        fuel: 'natural-gas',
                        efficiency: 65,
                        age: 20
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 9,
                        age: 15
                    },
                    thermostatType: 'manual',
                    zoneCount: 1,
                    systemPerformance: 'some-problems'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 70,
                    energyIntensity: 39,
                    heatingPct: 55,
                    coolingPct: 10
                }
            },
            'front-to-back': {
                homeDetails: {
                    squareFootage: 1800,
                    stories: 2,
                    bedrooms: 3,
                    bathrooms: 2,
                    ceilingHeight: 8,
                    numRooms: 7,
                    homeType: 'duplex',
                    unitConfiguration: 'front-to-back'
                },
                currentConditions: {
                    insulation: {
                        attic: 'below-average',
                        walls: 'below-average',
                        floor: 'below-average',
                        basement: 'none',
                        sharedWall: 'minimal'
                    },
                    windowType: 'single-with-storm',
                    windowCondition: 'fair',
                    numWindows: 12,
                    windowCount: 'average',
                    airLeaks: ['major-drafts', 'visible-gaps'],
                    weatherStripping: 'minimal',
                    estimatedACH: 10,
                    temperatureConsistency: 'large-variations'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace',
                        fuel: 'natural-gas',
                        efficiency: 65,
                        age: 20
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 9,
                        age: 15
                    },
                    thermostatType: 'manual',
                    zoneCount: 1,
                    systemPerformance: 'some-problems'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 78,
                    energyIntensity: 43,
                    heatingPct: 55,
                    coolingPct: 10
                }
            }
        },
        'large': {
            'side-by-side': {
                homeDetails: {
                    squareFootage: 2800,
                    stories: 3,
                    bedrooms: 4,
                    bathrooms: 2.5,
                    ceilingHeight: 8,
                    numRooms: 9,
                    homeType: 'duplex',
                    unitConfiguration: 'side-by-side'
                },
                currentConditions: {
                    insulation: {
                        attic: 'below-average',
                        walls: 'below-average',
                        floor: 'below-average',
                        basement: 'none',
                        sharedWall: 'minimal'
                    },
                    windowType: 'single-with-storm',
                    windowCondition: 'fair',
                    numWindows: 16,
                    windowCount: 'many',
                    airLeaks: ['major-drafts', 'visible-gaps'],
                    weatherStripping: 'minimal',
                    estimatedACH: 12,
                    temperatureConsistency: 'large-variations'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace',
                        fuel: 'natural-gas',
                        efficiency: 65,
                        age: 20
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 8,
                        age: 15
                    },
                    thermostatType: 'manual',
                    zoneCount: 1,
                    systemPerformance: 'needs-attention'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 110,
                    energyIntensity: 39,
                    heatingPct: 55,
                    coolingPct: 15
                }
            },
            'stacked': {
                homeDetails: {
                    squareFootage: 2800,
                    stories: 2,
                    bedrooms: 4,
                    bathrooms: 2.5,
                    ceilingHeight: 8,
                    numRooms: 9,
                    homeType: 'duplex',
                    unitConfiguration: 'stacked'
                },
                currentConditions: {
                    insulation: {
                        attic: 'below-average',
                        walls: 'below-average',
                        floor: 'below-average',
                        basement: 'none',
                        sharedFloor: 'minimal'
                    },
                    windowType: 'single-with-storm',
                    windowCondition: 'fair',
                    numWindows: 14,
                    windowCount: 'many',
                    airLeaks: ['major-drafts', 'visible-gaps'],
                    weatherStripping: 'minimal',
                    estimatedACH: 12,
                    temperatureConsistency: 'large-variations'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace',
                        fuel: 'natural-gas',
                        efficiency: 65,
                        age: 20
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 8,
                        age: 15
                    },
                    thermostatType: 'manual',
                    zoneCount: 1,
                    systemPerformance: 'needs-attention'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 105,
                    energyIntensity: 38,
                    heatingPct: 55,
                    coolingPct: 15
                }
            },
            'front-to-back': {
                homeDetails: {
                    squareFootage: 2800,
                    stories: 3,
                    bedrooms: 4,
                    bathrooms: 2.5,
                    ceilingHeight: 8,
                    numRooms: 9,
                    homeType: 'duplex',
                    unitConfiguration: 'front-to-back'
                },
                currentConditions: {
                    insulation: {
                        attic: 'below-average',
                        walls: 'below-average',
                        floor: 'below-average',
                        basement: 'none',
                        sharedWall: 'minimal'
                    },
                    windowType: 'single-with-storm',
                    windowCondition: 'fair',
                    numWindows: 16,
                    windowCount: 'many',
                    airLeaks: ['major-drafts', 'visible-gaps'],
                    weatherStripping: 'minimal',
                    estimatedACH: 12,
                    temperatureConsistency: 'large-variations'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace',
                        fuel: 'natural-gas',
                        efficiency: 65,
                        age: 20
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 8,
                        age: 15
                    },
                    thermostatType: 'manual',
                    zoneCount: 1,
                    systemPerformance: 'needs-attention'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 115,
                    energyIntensity: 41,
                    heatingPct: 55,
                    coolingPct: 15
                }
            }
        }
    },
    '1980-2000': {
        'small': {
            'side-by-side': {
                homeDetails: {
                    squareFootage: 1200,
                    stories: 2,
                    bedrooms: 2,
                    bathrooms: 1.5,
                    ceilingHeight: 8,
                    numRooms: 5,
                    homeType: 'duplex',
                    unitConfiguration: 'side-by-side'
                },
                currentConditions: {
                    insulation: {
                        attic: 'average',
                        walls: 'average',
                        floor: 'average',
                        basement: 'none',
                        sharedWall: 'average'
                    },
                    windowType: 'double-clear',
                    windowCondition: 'good',
                    numWindows: 8,
                    windowCount: 'average',
                    airLeaks: ['minor-drafts'],
                    weatherStripping: 'basic',
                    estimatedACH: 6,
                    temperatureConsistency: 'some-variations'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace',
                        fuel: 'natural-gas',
                        efficiency: 80,
                        age: 15
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 10,
                        age: 15
                    },
                    thermostatType: 'programmable',
                    zoneCount: 1,
                    systemPerformance: 'works-well'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 45,
                    energyIntensity: 38,
                    heatingPct: 45,
                    coolingPct: 15
                }
            },
            'stacked': {
                homeDetails: {
                    squareFootage: 1200,
                    stories: 1,
                    bedrooms: 2,
                    bathrooms: 1.5,
                    ceilingHeight: 8,
                    numRooms: 5,
                    homeType: 'duplex',
                    unitConfiguration: 'stacked'
                },
                currentConditions: {
                    insulation: {
                        attic: 'average',
                        walls: 'average',
                        floor: 'average',
                        basement: 'none',
                        sharedFloor: 'average'
                    },
                    windowType: 'double-clear',
                    windowCondition: 'good',
                    numWindows: 6,
                    windowCount: 'few',
                    airLeaks: ['minor-drafts'],
                    weatherStripping: 'basic',
                    estimatedACH: 6,
                    temperatureConsistency: 'some-variations'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace',
                        fuel: 'natural-gas',
                        efficiency: 80,
                        age: 15
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 10,
                        age: 15
                    },
                    thermostatType: 'programmable',
                    zoneCount: 1,
                    systemPerformance: 'works-well'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 42,
                    energyIntensity: 35,
                    heatingPct: 45,
                    coolingPct: 15
                }
            },
            'front-to-back': {
                homeDetails: {
                    squareFootage: 1200,
                    stories: 2,
                    bedrooms: 2,
                    bathrooms: 1.5,
                    ceilingHeight: 8,
                    numRooms: 5,
                    homeType: 'duplex',
                    unitConfiguration: 'front-to-back'
                },
                currentConditions: {
                    insulation: {
                        attic: 'average',
                        walls: 'average',
                        floor: 'average',
                        basement: 'none',
                        sharedWall: 'average'
                    },
                    windowType: 'double-clear',
                    windowCondition: 'good',
                    numWindows: 7,
                    windowCount: 'few',
                    airLeaks: ['minor-drafts'],
                    weatherStripping: 'basic',
                    estimatedACH: 6,
                    temperatureConsistency: 'some-variations'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace',
                        fuel: 'natural-gas',
                        efficiency: 80,
                        age: 15
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 10,
                        age: 15
                    },
                    thermostatType: 'programmable',
                    zoneCount: 1,
                    systemPerformance: 'works-well'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 47,
                    energyIntensity: 39,
                    heatingPct: 45,
                    coolingPct: 15
                }
            }
        },
        'medium': {
            'side-by-side': {
                homeDetails: {
                    squareFootage: 1800,
                    stories: 2,
                    bedrooms: 3,
                    bathrooms: 2.5,
                    ceilingHeight: 8,
                    numRooms: 7,
                    homeType: 'duplex',
                    unitConfiguration: 'side-by-side'
                },
                currentConditions: {
                    insulation: {
                        attic: 'average',
                        walls: 'average',
                        floor: 'average',
                        basement: 'none',
                        sharedWall: 'average'
                    },
                    windowType: 'double-clear',
                    windowCondition: 'good',
                    numWindows: 12,
                    windowCount: 'average',
                    airLeaks: ['minor-drafts', 'duct-leakage'],
                    weatherStripping: 'basic',
                    estimatedACH: 6,
                    temperatureConsistency: 'some-variations'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace',
                        fuel: 'natural-gas',
                        efficiency: 80,
                        age: 15
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 10,
                        age: 15
                    },
                    thermostatType: 'programmable',
                    zoneCount: 1,
                    systemPerformance: 'works-well'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 55,
                    energyIntensity: 31,
                    heatingPct: 45,
                    coolingPct: 20
                }
            },
            'stacked': {
                homeDetails: {
                    squareFootage: 1800,
                    stories: 1,
                    bedrooms: 3,
                    bathrooms: 2,
                    ceilingHeight: 8,
                    numRooms: 7,
                    homeType: 'duplex',
                    unitConfiguration: 'stacked'
                },
                currentConditions: {
                    insulation: {
                        attic: 'average',
                        walls: 'average',
                        floor: 'average',
                        basement: 'none',
                        sharedFloor: 'average'
                    },
                    windowType: 'double-clear',
                    windowCondition: 'good',
                    numWindows: 10,
                    windowCount: 'average',
                    airLeaks: ['minor-drafts'],
                    weatherStripping: 'basic',
                    estimatedACH: 6,
                    temperatureConsistency: 'some-variations'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace',
                        fuel: 'natural-gas',
                        efficiency: 80,
                        age: 15
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 10,
                        age: 15
                    },
                    thermostatType: 'programmable',
                    zoneCount: 1,
                    systemPerformance: 'works-well'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 52,
                    energyIntensity: 29,
                    heatingPct: 45,
                    coolingPct: 20
                }
            },
            'front-to-back': {
                homeDetails: {
                    squareFootage: 1800,
                    stories: 2,
                    bedrooms: 3,
                    bathrooms: 2,
                    ceilingHeight: 8,
                    numRooms: 7,
                    homeType: 'duplex',
                    unitConfiguration: 'front-to-back'
                },
                currentConditions: {
                    insulation: {
                        attic: 'average',
                        walls: 'average',
                        floor: 'average',
                        basement: 'none',
                        sharedWall: 'average'
                    },
                    windowType: 'double-clear',
                    windowCondition: 'good',
                    numWindows: 12,
                    windowCount: 'average',
                    airLeaks: ['minor-drafts', 'duct-leakage'],
                    weatherStripping: 'basic',
                    estimatedACH: 6,
                    temperatureConsistency: 'some-variations'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace',
                        fuel: 'natural-gas',
                        efficiency: 80,
                        age: 15
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 10,
                        age: 15
                    },
                    thermostatType: 'programmable',
                    zoneCount: 1,
                    systemPerformance: 'works-well'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 58,
                    energyIntensity: 32,
                    heatingPct: 45,
                    coolingPct: 20
                }
            }
        },
        'large': {
            'side-by-side': {
                homeDetails: {
                    squareFootage: 2800,
                    stories: 3,
                    bedrooms: 4,
                    bathrooms: 2.5,
                    ceilingHeight: 9,
                    numRooms: 9,
                    homeType: 'duplex',
                    unitConfiguration: 'side-by-side'
                },
                currentConditions: {
                    insulation: {
                        attic: 'average',
                        walls: 'average',
                        floor: 'average',
                        basement: 'none',
                        sharedWall: 'average'
                    },
                    windowType: 'double-clear',
                    windowCondition: 'good',
                    numWindows: 16,
                    windowCount: 'many',
                    airLeaks: ['minor-drafts', 'duct-leakage'],
                    weatherStripping: 'basic',
                    estimatedACH: 5,
                    temperatureConsistency: 'some-variations'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace',
                        fuel: 'natural-gas',
                        efficiency: 82,
                        age: 12
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 11,
                        age: 12
                    },
                    thermostatType: 'programmable',
                    zoneCount: 2,
                    systemPerformance: 'works-well'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 75,
                    energyIntensity: 27,
                    heatingPct: 45,
                    coolingPct: 25
                }
            },
            'stacked': {
                homeDetails: {
                    squareFootage: 2800,
                    stories: 2,
                    bedrooms: 4,
                    bathrooms: 2.5,
                    ceilingHeight: 9,
                    numRooms: 9,
                    homeType: 'duplex',
                    unitConfiguration: 'stacked'
                },
                currentConditions: {
                    insulation: {
                        attic: 'average',
                        walls: 'average',
                        floor: 'average',
                        basement: 'none',
                        sharedFloor: 'average'
                    },
                    windowType: 'double-clear',
                    windowCondition: 'good',
                    numWindows: 14,
                    windowCount: 'many',
                    airLeaks: ['minor-drafts'],
                    weatherStripping: 'basic',
                    estimatedACH: 5,
                    temperatureConsistency: 'some-variations'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace',
                        fuel: 'natural-gas',
                        efficiency: 82,
                        age: 12
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 11,
                        age: 12
                    },
                    thermostatType: 'programmable',
                    zoneCount: 2,
                    systemPerformance: 'works-well'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 70,
                    energyIntensity: 25,
                    heatingPct: 45,
                    coolingPct: 25
                }
            },
            'front-to-back': {
                homeDetails: {
                    squareFootage: 2800,
                    stories: 3,
                    bedrooms: 4,
                    bathrooms: 2.5,
                    ceilingHeight: 9,
                    numRooms: 9,
                    homeType: 'duplex',
                    unitConfiguration: 'front-to-back'
                },
                currentConditions: {
                    insulation: {
                        attic: 'average',
                        walls: 'average',
                        floor: 'average',
                        basement: 'none',
                        sharedWall: 'average'
                    },
                    windowType: 'double-clear',
                    windowCondition: 'good',
                    numWindows: 16,
                    windowCount: 'many',
                    airLeaks: ['minor-drafts', 'duct-leakage'],
                    weatherStripping: 'basic',
                    estimatedACH: 5,
                    temperatureConsistency: 'some-variations'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace',
                        fuel: 'natural-gas',
                        efficiency: 82,
                        age: 12
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 11,
                        age: 12
                    },
                    thermostatType: 'programmable',
                    zoneCount: 2,
                    systemPerformance: 'works-well'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 78,
                    energyIntensity: 28,
                    heatingPct: 45,
                    coolingPct: 25
                }
            }
        }
    },
    'post-2000': {
        'small': {
            'side-by-side': {
                homeDetails: {
                    squareFootage: 1200,
                    stories: 2,
                    bedrooms: 2,
                    bathrooms: 1.5,
                    ceilingHeight: 9,
                    numRooms: 5,
                    homeType: 'duplex',
                    unitConfiguration: 'side-by-side'
                },
                currentConditions: {
                    insulation: {
                        attic: 'good',
                        walls: 'good',
                        floor: 'good',
                        basement: 'none',
                        sharedWall: 'good'
                    },
                    windowType: 'double-low-e',
                    windowCondition: 'excellent',
                    numWindows: 8,
                    windowCount: 'average',
                    airLeaks: ['none'],
                    weatherStripping: 'foam',
                    estimatedACH: 3,
                    temperatureConsistency: 'very-consistent'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace-high-efficiency',
                        fuel: 'natural-gas',
                        efficiency: 95,
                        age: 5
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 15,
                        age: 5
                    },
                    thermostatType: 'smart',
                    zoneCount: 1,
                    systemPerformance: 'works-well'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 35,
                    energyIntensity: 29,
                    heatingPct: 40,
                    coolingPct: 15
                }
            },
            'stacked': {
                homeDetails: {
                    squareFootage: 1200,
                    stories: 1,
                    bedrooms: 2,
                    bathrooms: 1.5,
                    ceilingHeight: 9,
                    numRooms: 5,
                    homeType: 'duplex',
                    unitConfiguration: 'stacked'
                },
                currentConditions: {
                    insulation: {
                        attic: 'good',
                        walls: 'good',
                        floor: 'good',
                        basement: 'none',
                        sharedFloor: 'good'
                    },
                    windowType: 'double-low-e',
                    windowCondition: 'excellent',
                    numWindows: 6,
                    windowCount: 'few',
                    airLeaks: ['none'],
                    weatherStripping: 'foam',
                    estimatedACH: 3,
                    temperatureConsistency: 'very-consistent'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace-high-efficiency',
                        fuel: 'natural-gas',
                        efficiency: 95,
                        age: 5
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 15,
                        age: 5
                    },
                    thermostatType: 'smart',
                    zoneCount: 1,
                    systemPerformance: 'works-well'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 32,
                    energyIntensity: 27,
                    heatingPct: 40,
                    coolingPct: 15
                }
            },
            'front-to-back': {
                homeDetails: {
                    squareFootage: 1200,
                    stories: 2,
                    bedrooms: 2,
                    bathrooms: 1.5,
                    ceilingHeight: 9,
                    numRooms: 5,
                    homeType: 'duplex',
                    unitConfiguration: 'front-to-back'
                },
                currentConditions: {
                    insulation: {
                        attic: 'good',
                        walls: 'good',
                        floor: 'good',
                        basement: 'none',
                        sharedWall: 'good'
                    },
                    windowType: 'double-low-e',
                    windowCondition: 'excellent',
                    numWindows: 7,
                    windowCount: 'few',
                    airLeaks: ['none'],
                    weatherStripping: 'foam',
                    estimatedACH: 3,
                    temperatureConsistency: 'very-consistent'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace-high-efficiency',
                        fuel: 'natural-gas',
                        efficiency: 95,
                        age: 5
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 15,
                        age: 5
                    },
                    thermostatType: 'smart',
                    zoneCount: 1,
                    systemPerformance: 'works-well'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 37,
                    energyIntensity: 31,
                    heatingPct: 40,
                    coolingPct: 15
                }
            }
        },
        'medium': {
            'side-by-side': {
                homeDetails: {
                    squareFootage: 1800,
                    stories: 2,
                    bedrooms: 3,
                    bathrooms: 2.5,
                    ceilingHeight: 9,
                    numRooms: 7,
                    homeType: 'duplex',
                    unitConfiguration: 'side-by-side'
                },
                currentConditions: {
                    insulation: {
                        attic: 'good',
                        walls: 'good',
                        floor: 'good',
                        basement: 'none',
                        sharedWall: 'good'
                    },
                    windowType: 'double-low-e',
                    windowCondition: 'excellent',
                    numWindows: 12,
                    windowCount: 'average',
                    airLeaks: ['none'],
                    weatherStripping: 'foam',
                    estimatedACH: 3,
                    temperatureConsistency: 'very-consistent'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace-high-efficiency',
                        fuel: 'natural-gas',
                        efficiency: 95,
                        age: 5
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 16,
                        age: 5
                    },
                    thermostatType: 'smart',
                    zoneCount: 2,
                    systemPerformance: 'works-well'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 45,
                    energyIntensity: 25,
                    heatingPct: 40,
                    coolingPct: 25
                }
            },
            'stacked': {
                homeDetails: {
                    squareFootage: 1800,
                    stories: 1,
                    bedrooms: 3,
                    bathrooms: 2,
                    ceilingHeight: 9,
                    numRooms: 7,
                    homeType: 'duplex',
                    unitConfiguration: 'stacked'
                },
                currentConditions: {
                    insulation: {
                        attic: 'good',
                        walls: 'good',
                        floor: 'good',
                        basement: 'none',
                        sharedFloor: 'good'
                    },
                    windowType: 'double-low-e',
                    windowCondition: 'excellent',
                    numWindows: 10,
                    windowCount: 'average',
                    airLeaks: ['none'],
                    weatherStripping: 'foam',
                    estimatedACH: 3,
                    temperatureConsistency: 'very-consistent'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace-high-efficiency',
                        fuel: 'natural-gas',
                        efficiency: 95,
                        age: 5
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 16,
                        age: 5
                    },
                    thermostatType: 'smart',
                    zoneCount: 2,
                    systemPerformance: 'works-well'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 42,
                    energyIntensity: 23,
                    heatingPct: 40,
                    coolingPct: 25
                }
            },
            'front-to-back': {
                homeDetails: {
                    squareFootage: 1800,
                    stories: 2,
                    bedrooms: 3,
                    bathrooms: 2,
                    ceilingHeight: 9,
                    numRooms: 7,
                    homeType: 'duplex',
                    unitConfiguration: 'front-to-back'
                },
                currentConditions: {
                    insulation: {
                        attic: 'good',
                        walls: 'good',
                        floor: 'good',
                        basement: 'none',
                        sharedWall: 'good'
                    },
                    windowType: 'double-low-e',
                    windowCondition: 'excellent',
                    numWindows: 12,
                    windowCount: 'average',
                    airLeaks: ['none'],
                    weatherStripping: 'foam',
                    estimatedACH: 3,
                    temperatureConsistency: 'very-consistent'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace-high-efficiency',
                        fuel: 'natural-gas',
                        efficiency: 95,
                        age: 5
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 16,
                        age: 5
                    },
                    thermostatType: 'smart',
                    zoneCount: 2,
                    systemPerformance: 'works-well'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 47,
                    energyIntensity: 26,
                    heatingPct: 40,
                    coolingPct: 25
                }
            }
        },
        'large': {
            'side-by-side': {
                homeDetails: {
                    squareFootage: 2800,
                    stories: 3,
                    bedrooms: 4,
                    bathrooms: 3,
                    ceilingHeight: 9,
                    numRooms: 9,
                    homeType: 'duplex',
                    unitConfiguration: 'side-by-side'
                },
                currentConditions: {
                    insulation: {
                        attic: 'good',
                        walls: 'good',
                        floor: 'good',
                        basement: 'average',
                        sharedWall: 'good'
                    },
                    windowType: 'double-low-e',
                    windowCondition: 'excellent',
                    numWindows: 16,
                    windowCount: 'many',
                    airLeaks: ['none'],
                    weatherStripping: 'foam',
                    estimatedACH: 3,
                    temperatureConsistency: 'very-consistent'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace-high-efficiency',
                        fuel: 'natural-gas',
                        efficiency: 96,
                        age: 3
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 18,
                        age: 3
                    },
                    thermostatType: 'smart',
                    zoneCount: 3,
                    systemPerformance: 'works-well'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 65,
                    energyIntensity: 23,
                    heatingPct: 40,
                    coolingPct: 30
                }
            },
            'stacked': {
                homeDetails: {
                    squareFootage: 2800,
                    stories: 2,
                    bedrooms: 4,
                    bathrooms: 3,
                    ceilingHeight: 9,
                    numRooms: 9,
                    homeType: 'duplex',
                    unitConfiguration: 'stacked'
                },
                currentConditions: {
                    insulation: {
                        attic: 'good',
                        walls: 'good',
                        floor: 'good',
                        basement: 'average',
                        sharedFloor: 'good'
                    },
                    windowType: 'double-low-e',
                    windowCondition: 'excellent',
                    numWindows: 14,
                    windowCount: 'many',
                    airLeaks: ['none'],
                    weatherStripping: 'foam',
                    estimatedACH: 3,
                    temperatureConsistency: 'very-consistent'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace-high-efficiency',
                        fuel: 'natural-gas',
                        efficiency: 96,
                        age: 3
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 18,
                        age: 3
                    },
                    thermostatType: 'smart',
                    zoneCount: 3,
                    systemPerformance: 'works-well'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 60,
                    energyIntensity: 21,
                    heatingPct: 40,
                    coolingPct: 30
                }
            },
            'front-to-back': {
                homeDetails: {
                    squareFootage: 2800,
                    stories: 3,
                    bedrooms: 4,
                    bathrooms: 3,
                    ceilingHeight: 9,
                    numRooms: 9,
                    homeType: 'duplex',
                    unitConfiguration: 'front-to-back'
                },
                currentConditions: {
                    insulation: {
                        attic: 'good',
                        walls: 'good',
                        floor: 'good',
                        basement: 'average',
                        sharedWall: 'good'
                    },
                    windowType: 'double-low-e',
                    windowCondition: 'excellent',
                    numWindows: 16,
                    windowCount: 'many',
                    airLeaks: ['none'],
                    weatherStripping: 'foam',
                    estimatedACH: 3,
                    temperatureConsistency: 'very-consistent'
                },
                heatingCooling: {
                    heatingSystem: {
                        type: 'gas-furnace-high-efficiency',
                        fuel: 'natural-gas',
                        efficiency: 96,
                        age: 3
                    },
                    coolingSystem: {
                        type: 'central-ac',
                        efficiency: 18,
                        age: 3
                    },
                    thermostatType: 'smart',
                    zoneCount: 3,
                    systemPerformance: 'works-well'
                },
                energyConsumption: {
                    estimatedAnnualUsage: 68,
                    energyIntensity: 24,
                    heatingPct: 40,
                    coolingPct: 30
                }
            }
        }
    }
};
// Main function to get duplex defaults based on year built, square footage, and unit configuration
var getDuplexDefaults = function (yearBuilt, squareFootage, state, unitConfiguration) {
    var _a;
    if (unitConfiguration === void 0) { unitConfiguration = 'side-by-side'; }
    var constructionPeriod = (0, exports.getDuplexConstructionPeriod)(yearBuilt);
    var sizeCategory = (0, exports.getDuplexSizeCategory)(squareFootage);
    var configuration = (0, exports.getDuplexUnitConfiguration)(unitConfiguration);
    // Get base defaults
    var defaults = JSON.parse(JSON.stringify(exports.duplexDefaults[constructionPeriod][sizeCategory][configuration]));
    // Calculate climate-adjusted energy usage if state is provided
    if (state) {
        var numericZone = (0, housingTypeDefaults_1.getClimateZone)(state);
        var descriptiveZone = (0, housingTypeDefaults_1.getDescriptiveClimateZone)(numericZone);
        var climateAdjustment = exports.duplexClimateZoneAdjustments[descriptiveZone] || 1.0;
        var sizeAdjustment = exports.duplexSizeAdjustments[sizeCategory] || 1.0;
        var configAdjustment = exports.duplexConfigurationAdjustments[configuration] || 1.0;
        var baseEnergyUsage = ((_a = exports.duplexEnergyUsageBaseline[constructionPeriod]) === null || _a === void 0 ? void 0 : _a[configuration]) || 55; // Default to average if not found
        // Calculate adjusted energy usage with all factors
        var adjustedEnergyUsage = Math.round(baseEnergyUsage * climateAdjustment * sizeAdjustment * configAdjustment);
        // Update energy consumption values
        defaults.energyConsumption.estimatedAnnualUsage = adjustedEnergyUsage;
    }
    return defaults;
};
exports.getDuplexDefaults = getDuplexDefaults;
