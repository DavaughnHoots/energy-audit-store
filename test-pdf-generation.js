const fs = require('fs');
const path = require('path');
const { 
  reportGenerationService
} = require('./backend/src/services/report-generation/index.js');

// __dirname is already available in CommonJS

// Define mock data scenarios
const mockScenarios = [
  {
    name: 'complete-data',
    auditData: {
      basicInfo: {
        fullName: 'John Smith',
        email: 'john@example.com',
        phone: '555-123-4567',
        address: '123 Main St, Anytown, US 12345',
        propertyType: 'single-family',
        yearBuilt: 1995,
        occupants: 4,
        auditDate: '2025-03-24'
      },
      homeDetails: {
        squareFootage: 2400,
        stories: 2,
        bedrooms: 4,
        bathrooms: 2.5,
        homeType: 'detached',
        homeSize: 2400,
        constructionPeriod: '1980-2000',
        numRooms: 8,
        numFloors: 2,
        wallLength: 50,
        wallWidth: 30,
        ceilingHeight: 9,
        basementType: 'finished',
        basementHeating: 'heated'
      },
      currentConditions: {
        insulation: {
          attic: 'good',
          walls: 'average',
          basement: 'poor',
          floor: 'average'
        },
        windowType: 'double',
        windowCondition: 'good',
        numWindows: 12,
        windowCount: 'average',
        doorCount: 3,
        airLeaks: ['around windows', 'at doors'],
        weatherStripping: 'average',
        temperatureConsistency: 'some-variations',
        comfortIssues: ['cold spots', 'drafts'],
        bulbPercentages: {
          led: 30,
          cfl: 20,
          incandescent: 50
        }
      },
      heatingCooling: {
        heatingSystem: {
          type: 'forced air',
          fuel: 'natural gas',
          fuelType: 'natural gas',
          age: 12,
          efficiency: 85,
          lastService: '2024-09-01'
        },
        coolingSystem: {
          type: 'central ac',
          age: 10,
          efficiency: 14
        },
        thermostatType: 'programmable',
        zoneCount: 1,
        systemPerformance: 'some-problems'
      },
      energyConsumption: {
        electricBill: 150,
        gasBill: 80,
        seasonalVariation: 'high',
        powerConsumption: 900,
        occupancyPattern: 'evenings and weekends',
        occupancyHours: {
          weekday: '6pm-8am',
          weekend: 'all day'
        },
        peakUsageTimes: ['morning', 'evening'],
        monthlyBill: 230,
        season: 'winter',
        powerFactor: 0.9,
        seasonalFactor: 1.1,
        occupancyFactor: 0.7
      }
    },
    recommendations: [
      {
        id: 'rec-001',
        title: 'Install LED Bulbs',
        description: 'Replace all incandescent bulbs with LED alternatives to reduce electricity usage.',
        priority: 'high',
        status: 'active',
        estimatedSavings: 250,
        estimatedCost: 120,
        paybackPeriod: 0.5,
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        lastUpdate: '2025-03-24'
      },
      {
        id: 'rec-002',
        title: 'Seal Air Leaks',
        description: 'Apply weatherstripping and caulk to seal air leaks around doors and windows.',
        priority: 'medium',
        status: 'active',
        estimatedSavings: 180,
        estimatedCost: 75,
        paybackPeriod: 0.4,
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        lastUpdate: '2025-03-24'
      },
      {
        id: 'rec-003',
        title: 'Add Attic Insulation',
        description: 'Increase attic insulation to R-49 to reduce heat loss in winter and heat gain in summer.',
        priority: 'high',
        status: 'active',
        estimatedSavings: 320,
        estimatedCost: 1200,
        paybackPeriod: 3.8,
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        lastUpdate: '2025-03-24'
      }
    ]
  },
  {
    name: 'incomplete-data',
    auditData: {
      basicInfo: {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '555-987-6543',
        address: '456 Elm St, Othertown, US 54321',
        propertyType: 'townhouse', 
        yearBuilt: 2005,
        occupants: 2,
        auditDate: '2025-03-24'
      },
      homeDetails: {
        squareFootage: 1800,
        stories: 2,
        bedrooms: 3,
        bathrooms: 2,
        homeType: 'attached',
        homeSize: 1800,
        constructionPeriod: 'after-2000',
        numRooms: 6,
        numFloors: 2,
        wallLength: 40,
        wallWidth: 25,
        ceilingHeight: 10,
        basementType: 'none',
        basementHeating: 'unheated'
      },
      currentConditions: {
        insulation: {
          attic: 'average',
          walls: 'average',
          basement: 'not-applicable',
          floor: 'good'
        },
        windowType: 'double',
        windowCondition: 'good',
        numWindows: 8,
        windowCount: 'average',
        doorCount: 2,
        airLeaks: ['at doors'],
        weatherStripping: 'good',
        temperatureConsistency: 'some-variations',
        comfortIssues: []
        // Missing bulbPercentages
      },
      heatingCooling: {
        heatingSystem: {
          type: 'forced air',
          fuel: 'electric',
          fuelType: 'electric',
          age: 8,
          efficiency: 95,
          lastService: '2024-06-15'
        },
        coolingSystem: {
          type: 'central ac',
          age: 8,
          efficiency: 16
        },
        thermostatType: 'smart',
        zoneCount: 1,
        systemPerformance: 'works-well'
      },
      energyConsumption: {
        electricBill: 180,
        gasBill: 0, // Electric heating
        seasonalVariation: 'moderate',
        powerConsumption: 1200,
        occupancyPattern: 'evenings and weekends',
        occupancyHours: {
          weekday: '5pm-8am',
          weekend: 'all day'
        },
        peakUsageTimes: ['evening'],
        monthlyBill: 180,
        season: 'summer'
        // Missing factors
      }
    },
    recommendations: [
      {
        id: 'rec-001',
        title: 'Install Smart Power Strips',
        description: 'Use smart power strips to reduce phantom power usage from electronics.',
        priority: 'medium',
        status: 'active',
        estimatedSavings: 120,
        estimatedCost: 80,
        paybackPeriod: 0.7,
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        lastUpdate: '2025-03-24'
      },
      {
        id: 'rec-002',
        title: 'Improve Air Sealing at Doors',
        description: 'Replace door sweeps and weatherstripping to reduce air leakage.',
        priority: 'medium',
        status: 'active',
        estimatedSavings: 85,
        estimatedCost: 60,
        paybackPeriod: 0.7,
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        lastUpdate: '2025-03-24'
      }
    ]
  },
  {
    name: 'edge-case-data',
    auditData: {
      basicInfo: {
        fullName: 'Edge Case',
        email: 'edge@example.com',
        phone: '555-111-2222',
        address: '789 Edge St, Extremeville, US 99999',
        propertyType: 'condo',
        yearBuilt: 1950,
        occupants: 6, // High occupancy
        auditDate: '2025-03-24'
      },
      homeDetails: {
        squareFootage: 8500, // Very large
        stories: 4, // Many stories
        bedrooms: 7,
        bathrooms: 5.5,
        homeType: 'attached',
        homeSize: 8500,
        constructionPeriod: 'before-1980',
        numRooms: 15,
        numFloors: 4,
        wallLength: 100,
        wallWidth: 85,
        ceilingHeight: 12, // High ceilings
        basementType: 'unfinished',
        basementHeating: 'unheated'
      },
      currentConditions: {
        insulation: {
          attic: 'poor',
          walls: 'poor',
          basement: 'poor',
          floor: 'poor'
        },
        windowType: 'single', // Worst type
        windowCondition: 'poor', // Worst condition
        numWindows: 35, // Many windows
        windowCount: 'many',
        doorCount: 8,
        airLeaks: ['around windows', 'at doors', 'foundation', 'outlets', 'attic'],
        weatherStripping: 'poor',
        temperatureConsistency: 'large-variations',
        comfortIssues: ['cold spots', 'drafts', 'hot spots', 'humidity'],
        bulbPercentages: {
          led: 0,
          cfl: 0,
          incandescent: 100 // All incandescent
        }
      },
      heatingCooling: {
        heatingSystem: {
          type: 'boiler',
          fuel: 'oil',
          fuelType: 'oil',
          age: 30, // Very old
          efficiency: 55, // Very inefficient
          lastService: '2020-01-01' // Long time since service
        },
        coolingSystem: {
          type: 'window units',
          age: 20, // Very old
          efficiency: 8 // Very inefficient
        },
        thermostatType: 'manual', // Least efficient type
        zoneCount: 3,
        systemPerformance: 'needs-attention'
      },
      energyConsumption: {
        electricBill: 450, // Very high
        gasBill: 0,
        oilBill: 280, // Very high
        seasonalVariation: 'extreme',
        powerConsumption: 3500, // Very high
        occupancyPattern: 'all day',
        occupancyHours: {
          weekday: 'all day',
          weekend: 'all day'
        },
        peakUsageTimes: ['morning', 'day', 'evening', 'night'], // All times
        monthlyBill: 730, // Very high
        season: 'winter',
        powerFactor: 0.65, // Poor
        seasonalFactor: 1.4, // Extreme variation
        occupancyFactor: 0.95 // High occupancy
      }
    },
    recommendations: [
      {
        id: 'rec-001',
        title: 'Replace Heating System',
        description: 'Replace the aging oil boiler with a high-efficiency heat pump system.',
        priority: 'high',
        status: 'active',
        estimatedSavings: 1800, // High savings
        estimatedCost: 12000, // High cost
        paybackPeriod: 6.7,
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        lastUpdate: '2025-03-24'
      },
      {
        id: 'rec-002',
        title: 'Replace Windows',
        description: 'Replace single-pane windows with high-efficiency double or triple-pane windows.',
        priority: 'high',
        status: 'active',
        estimatedSavings: 1200,
        estimatedCost: 18000,
        paybackPeriod: 15, // Long payback
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        lastUpdate: '2025-03-24'
      },
      {
        id: 'rec-003',
        title: 'Comprehensive Air Sealing',
        description: 'Perform professional air sealing throughout the home to address multiple leak areas.',
        priority: 'high',
        status: 'active',
        estimatedSavings: 950,
        estimatedCost: 3500,
        paybackPeriod: 3.7,
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        lastUpdate: '2025-03-24'
      },
      {
        id: 'rec-004',
        title: 'Replace All Lighting with LEDs',
        description: 'Replace all incandescent bulbs with LED alternatives.',
        priority: 'high',
        status: 'active',
        estimatedSavings: 650,
        estimatedCost: 800,
        paybackPeriod: 1.2,
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        lastUpdate: '2025-03-24'
      },
      {
        id: 'rec-005',
        title: 'Upgrade to Smart Thermostats',
        description: 'Replace manual thermostats with programmable smart thermostats in all zones.',
        priority: 'medium',
        status: 'active',
        estimatedSavings: 420,
        estimatedCost: 750,
        paybackPeriod: 1.8,
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        lastUpdate: '2025-03-24'
      }
    ]
  },
  {
    name: 'problematic-data',
    auditData: {
      basicInfo: {
        fullName: 'Problem User',
        email: 'problem@example.com',
        phone: '555-333-4444',
        address: '101 Problem Ave, Bugtown, US 11111',
        propertyType: 'mobile-home',
        yearBuilt: undefined, // Undefined value
        occupants: NaN, // NaN value
        auditDate: '2025-03-24'
      },
      homeDetails: {
        squareFootage: -500, // Negative square footage
        stories: 1,
        bedrooms: 2,
        bathrooms: 1,
        homeType: 'detached',
        homeSize: null, // Null value
        constructionPeriod: 'after-2000',
        numRooms: 4,
        numFloors: 1,
        wallLength: 60,
        wallWidth: 15,
        ceilingHeight: 8,
        basementType: 'none',
        basementHeating: 'unheated'
      },
      currentConditions: {
        insulation: {
          attic: undefined, // Undefined value
          walls: null, // Null value
          basement: 'not-applicable',
          floor: 'poor'
        },
        windowType: 'single',
        windowCondition: 'fair',
        numWindows: 6,
        windowCount: 'few',
        doorCount: 2,
        airLeaks: [],
        weatherStripping: 'fair',
        temperatureConsistency: 'some-variations',
        comfortIssues: ['drafts'],
        bulbPercentages: {
          led: null, // Null values for bulbs
          cfl: undefined,
          incandescent: NaN
        }
      },
      heatingCooling: {
        heatingSystem: {
          type: '',
          fuel: '',
          fuelType: '',
          age: -5, // Negative age
          efficiency: 150, // Impossible efficiency
          lastService: 'never'
        },
        coolingSystem: {
          type: 'window units',
          age: NaN, // NaN value
          efficiency: null // Null value
        },
        thermostatType: 'manual',
        zoneCount: 1,
        systemPerformance: 'needs-attention'
      },
      energyConsumption: {
        electricBill: 0, // Zero bill
        gasBill: -50, // Negative bill
        seasonalVariation: '',
        powerConsumption: undefined, // Undefined value
        occupancyPattern: '',
        occupancyHours: {
          weekday: '',
          weekend: ''
        },
        peakUsageTimes: [],
        monthlyBill: NaN, // NaN value
        season: ''
      }
    },
    recommendations: [
      {
        id: 'rec-001',
        title: 'Install Weather Stripping',
        description: 'Add weather stripping to doors and windows to reduce drafts.',
        priority: 'medium',
        status: 'active',
        estimatedSavings: undefined, // Undefined value
        estimatedCost: NaN, // NaN value
        paybackPeriod: null, // Null value
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        lastUpdate: '2025-03-24'
      }
    ]
  },
  {
    name: 'zero-recommendations',
    auditData: {
      basicInfo: {
        fullName: 'Zero Recommendations',
        email: 'zero@example.com',
        phone: '555-000-0000',
        address: '000 Zero St, Zeroville, US 00000',
        propertyType: 'single-family',
        yearBuilt: 2020,
        occupants: 2,
        auditDate: '2025-03-24'
      },
      homeDetails: {
        squareFootage: 1500,
        stories: 1,
        bedrooms: 3,
        bathrooms: 2,
        homeType: 'detached',
        homeSize: 1500,
        constructionPeriod: 'after-2000',
        numRooms: 6,
        numFloors: 1,
        wallLength: 40,
        wallWidth: 30,
        ceilingHeight: 10,
        basementType: 'none',
        basementHeating: 'unheated'
      },
      currentConditions: {
        insulation: {
          attic: 'excellent',
          walls: 'excellent',
          basement: 'not-applicable',
          floor: 'excellent'
        },
        windowType: 'triple',
        windowCondition: 'excellent',
        numWindows: 8,
        windowCount: 'average',
        doorCount: 2,
        airLeaks: [],
        weatherStripping: 'excellent',
        temperatureConsistency: 'very-consistent',
        comfortIssues: [],
        bulbPercentages: {
          led: 100,
          cfl: 0,
          incandescent: 0
        }
      },
      heatingCooling: {
        heatingSystem: {
          type: 'heat pump',
          fuel: 'electric',
          fuelType: 'electric',
          age: 2,
          efficiency: 98,
          lastService: '2024-12-01'
        },
        coolingSystem: {
          type: 'heat pump',
          age: 2,
          efficiency: 22
        },
        thermostatType: 'smart',
        zoneCount: 2,
        systemPerformance: 'works-well'
      },
      energyConsumption: {
        electricBill: 80,
        gasBill: 0,
        seasonalVariation: 'low',
        powerConsumption: 600,
        occupancyPattern: 'evenings and weekends',
        occupancyHours: {
          weekday: '6pm-8am',
          weekend: 'all day'
        },
        peakUsageTimes: ['evening'],
        monthlyBill: 80,
        season: 'spring',
        powerFactor: 0.95,
        seasonalFactor: 1.05,
        occupancyFactor: 0.65
      }
    },
    recommendations: [] // No recommendations
  }
];

// Ensure output directory exists
const outputDir = path.join(__dirname, 'test-pdfs');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate PDFs for each scenario
async function generateTestPDFs() {
  console.log('Generating test PDFs...');
  
  for (const scenario of mockScenarios) {
    console.log(`Processing scenario: ${scenario.name}`);
    
    try {
      // Generate the PDF
      const pdfBuffer = await reportGenerationService.generateReport(
        scenario.auditData,
        scenario.recommendations
      );
      
      // Save the PDF to a file
      const outputPath = path.join(outputDir, `${scenario.name}.pdf`);
      fs.writeFileSync(outputPath, pdfBuffer);
      
      console.log(`Generated PDF: ${outputPath}`);
    } catch (error) {
      console.error(`Error generating PDF for scenario ${scenario.name}:`);
      console.error(error);
    }
  }
  
  console.log('PDF generation complete!');
}

// Run the generator
generateTestPDFs()
  .then(() => console.log('All done!'))
  .catch(err => console.error('Fatal error:', err));
