// Default mappings for advanced form fields based on basic selections

export const heatingSystemDefaults = {
  'furnace': {
    fuel: 'natural-gas' as const,
    efficiency: 80, // AFUE rating
    age: 10,
    lastService: new Date().toISOString().slice(0, 10)
  },
  'central-heating': {
    fuel: 'natural-gas' as const,
    efficiency: 87, // AFUE rating
    age: 12,
    lastService: new Date().toISOString().slice(0, 10)
  },
  'heat-pump': {
    fuel: 'electricity' as const,
    efficiency: 250, // HSPF rating
    age: 8,
    lastService: new Date().toISOString().slice(0, 10)
  },
  'boiler': {
    fuel: 'natural-gas' as const,
    efficiency: 85, // AFUE rating
    age: 12,
    lastService: new Date().toISOString().slice(0, 10)
  },
  'electric-baseboard': {
    fuel: 'electricity' as const,
    efficiency: 100, // Direct conversion
    age: 15,
    lastService: new Date().toISOString().slice(0, 10)
  },
  'not-sure': {
    fuel: 'not-sure' as const,
    efficiency: 80,
    age: 10,
    lastService: new Date().toISOString().slice(0, 10)
  }
} as const;

export const coolingSystemDefaults = {
  'central-ac': {
    efficiency: 13, // SEER rating
    age: 10
  },
  'heat-pump': {
    efficiency: 14, // SEER rating
    age: 8
  },
  'mini-split': {
    efficiency: 16, // SEER rating
    age: 5
  },
  'window-units': {
    efficiency: 10, // EER rating
    age: 7
  },
  'none': {
    efficiency: 0,
    age: 0
  }
} as const;

export const systemPerformanceDefaults = {
  'works-well': {
    heatingEfficiencyMultiplier: 1.0,
    coolingEfficiencyMultiplier: 1.0,
    maintenanceRecommendation: 'routine'
  },
  'some-problems': {
    heatingEfficiencyMultiplier: 0.8,
    coolingEfficiencyMultiplier: 0.8,
    maintenanceRecommendation: 'service-soon'
  },
  'needs-attention': {
    heatingEfficiencyMultiplier: 0.6,
    coolingEfficiencyMultiplier: 0.6,
    maintenanceRecommendation: 'service-urgent'
  }
} as const;

export const thermostatDefaults = {
  'manual': {
    zoneCount: 1,
    estimatedSavings: 0
  },
  'programmable': {
    zoneCount: 1,
    estimatedSavings: 10 // Percentage
  },
  'smart': {
    zoneCount: 1,
    estimatedSavings: 15 // Percentage
  },
  'not-sure': {
    zoneCount: 1,
    estimatedSavings: 0 // Conservative estimate
  }
} as const;

// Validation ranges for efficiency ratings
export const efficiencyRanges = {
  furnace: { min: 80, max: 98.5, unit: 'AFUE' },
  boiler: { min: 80, max: 95, unit: 'AFUE' },
  centralHeating: { min: 80, max: 95, unit: 'AFUE' },
  heatPump: { 
    heating: { min: 7.7, max: 13.5, unit: 'HSPF' },
    cooling: { min: 13, max: 21, unit: 'SEER' }
  },
  centralAC: { min: 13, max: 21, unit: 'SEER' },
  miniSplit: { min: 15, max: 30, unit: 'SEER' },
  windowUnit: { min: 9.8, max: 12, unit: 'EER' }
} as const;
