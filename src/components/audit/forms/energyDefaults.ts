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
    peakUsageTimes: ['Morning (6am-12pm)', 'Evening (6pm-12am)']
  },
  'work-hours': {
    electricBill: 600,
    gasBill: 80,
    powerConsumption: 20,
    occupancyHours: {
      weekday: '13-18',
      weekend: '19-24'
    },
    peakUsageTimes: ['Morning (6am-12pm)', 'Evening (6pm-12am)']
  },
  'evenings-weekends': {
    electricBill: 400,
    gasBill: 60,
    powerConsumption: 15,
    occupancyHours: {
      weekday: '7-12',
      weekend: '13-18'
    },
    peakUsageTimes: ['Evening (6pm-12am)']
  },
  'variable': {
    electricBill: 500,
    gasBill: 70,
    powerConsumption: 25,
    occupancyHours: {
      weekday: '7-12',
      weekend: '13-18'
    },
    peakUsageTimes: ['Afternoon (12pm-6pm)', 'Evening (6pm-12am)']
  }
} as const;

export const seasonalVariationDefaults = {
  'highest-summer': {
    electricBillMultiplier: 1.4,
    gasBillMultiplier: 0.7,
    powerConsumptionMultiplier: 1.3
  },
  'highest-winter': {
    electricBillMultiplier: 1.3,
    gasBillMultiplier: 1.5,
    powerConsumptionMultiplier: 1.2
  },
  'consistent': {
    electricBillMultiplier: 1.0,
    gasBillMultiplier: 1.0,
    powerConsumptionMultiplier: 1.0
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
