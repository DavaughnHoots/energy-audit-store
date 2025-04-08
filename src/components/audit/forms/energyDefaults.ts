// Default mappings for advanced form fields based on basic selections

export const occupancyPatternDefaults = {
  'home-all-day': {
    electricBill: 800,
    gasBill: 100,
    powerConsumption: 30,
    occupancyHours: {
      weekday: '19-24',
      weekend: '19-24'
    },
    peakUsageTimes: ['Morning (6am-12pm)', 'Evening (6pm-12am)'],
    occupancyFactor: 1.0, // Highest occupancy factor for all-day occupancy
    durationHours: 20.0    // Nearly full day at home
  },
  'work-hours': {
    electricBill: 600,
    gasBill: 80,
    powerConsumption: 20,
    occupancyHours: {
      weekday: '13-18',
      weekend: '19-24'
    },
    peakUsageTimes: ['Morning (6am-12pm)', 'Evening (6pm-12am)'],
    occupancyFactor: 0.8, // Moderate occupancy factor for work-hours pattern
    durationHours: 14.0   // Standard evening + night hours
  },
  'evenings-weekends': {
    electricBill: 400,
    gasBill: 60,
    powerConsumption: 15,
    occupancyHours: {
      weekday: '7-12',
      weekend: '13-18'
    },
    peakUsageTimes: ['Evening (6pm-12am)'],
    occupancyFactor: 0.6, // Lower occupancy factor for evenings-weekends pattern
    durationHours: 10.0   // Limited evening hours on weekdays + weekend time
  },
  'variable': {
    electricBill: 500,
    gasBill: 70,
    powerConsumption: 25,
    occupancyHours: {
      weekday: '7-12',
      weekend: '13-18'
    },
    peakUsageTimes: ['Afternoon (12pm-6pm)', 'Evening (6pm-12am)'],
    occupancyFactor: 0.7, // Moderate-low occupancy factor for variable pattern
    durationHours: 12.0   // Midpoint value for variable schedule
  }
} as const;

export const seasonalVariationDefaults = {
  'highest-summer': {
    electricBillMultiplier: 1.4,
    gasBillMultiplier: 0.7,
    powerConsumptionMultiplier: 1.3,
    seasonalFactor: 1.2 // Higher factor for summer-peaking usage
  },
  'highest-winter': {
    electricBillMultiplier: 1.3,
    gasBillMultiplier: 1.5,
    powerConsumptionMultiplier: 1.2,
    seasonalFactor: 1.1 // Moderate-high factor for winter-peaking usage
  },
  'consistent': {
    electricBillMultiplier: 1.0,
    gasBillMultiplier: 1.0,
    powerConsumptionMultiplier: 1.0,
    seasonalFactor: 0.9 // Lower factor for consistent usage
  }
} as const;

export const monthlyBillRanges = {
  'low': {
    range: '0-100',
    typical: {
      electric: 75,
      gas: 25
    }
  },
  'medium': {
    range: '101-250',
    typical: {
      electric: 150,
      gas: 50
    }
  },
  'high': {
    range: '251+',
    typical: {
      electric: 300,
      gas: 100
    }
  }
} as const;

export const peakTimeOptions = [
  { id: 'morning', label: 'Morning (6am-12pm)' },
  { id: 'afternoon', label: 'Afternoon (12pm-6pm)' },
  { id: 'evening', label: 'Evening (6pm-12am)' },
  { id: 'night', label: 'Night (12am-6am)' }
] as const;

export const occupancyHourOptions = [
  { value: '0-6', label: '0-6 hours' },
  { value: '7-12', label: '7-12 hours' },
  { value: '13-18', label: '13-18 hours' },
  { value: '19-24', label: '19-24 hours' }
] as const;
