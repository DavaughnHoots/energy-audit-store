// Default mappings for advanced form fields based on basic selections

export const occupancyPatternDefaults = {
  'home-all-day': {
    powerConsumption: '6-8kW',
    occupancyHours: {
      weekdays: '19-24' as const,
      weekends: '19-24' as const
    },
    peakUsageTimes: [
      'Morning (6am-12pm)',
      'Afternoon (12pm-6pm)',
      'Evening (6pm-12am)'
    ]
  },
  'work-hours': {
    powerConsumption: '3-5kW',
    occupancyHours: {
      weekdays: '14-16' as const,
      weekends: '19-24' as const
    },
    peakUsageTimes: [
      'Morning (6am-12pm)',
      'Evening (6pm-12am)'
    ]
  },
  'evenings-weekends': {
    powerConsumption: '2-4kW',
    occupancyHours: {
      weekdays: '7-12' as const,
      weekends: '13-18' as const
    },
    peakUsageTimes: [
      'Evening (6pm-12am)'
    ]
  },
  'variable': {
    powerConsumption: '2-4kW',
    occupancyHours: {
      weekdays: '7-12' as const,
      weekends: '13-18' as const
    },
    peakUsageTimes: [
      'Morning (6am-12pm)',
      'Evening (6pm-12am)'
    ]
  }
} as const;

export const seasonDefaults = {
  'mild-winter': {
    powerConsumption: '2-4kW',
    peakUsageTimes: [
      'Morning (6am-12pm)',
      'Evening (6pm-12am)'
    ]
  },
  'moderate-winter': {
    powerConsumption: '6-8kW',
    peakUsageTimes: [
      'Morning (6am-12pm)',
      'Evening (6pm-12am)',
      'Night (12am-6am)'
    ]
  },
  'mild-summer': {
    powerConsumption: '2-4kW',
    peakUsageTimes: [
      'Afternoon (12pm-6pm)',
      'Evening (6pm-12am)'
    ]
  },
  'moderate-summer': {
    powerConsumption: '4-6kW',
    peakUsageTimes: [
      'Afternoon (12pm-6pm)',
      'Evening (6pm-12am)'
    ]
  },
  'peak-summer': {
    powerConsumption: '8-10kW',
    peakUsageTimes: [
      'Morning (6am-12pm)',
      'Afternoon (12pm-6pm)',
      'Evening (6pm-12am)'
    ]
  },
  'spring-fall': {
    powerConsumption: '2-4kW',
    peakUsageTimes: [
      'Morning (6am-12pm)',
      'Evening (6pm-12am)'
    ]
  }
} as const;

export const monthlyBillDefaults = {
    low: {
        powerConsumption: '0-2kW',
        peakUsageTimes: ['Evening (6pm-12am)']
    },
    medium: {
        powerConsumption: '2-4kW',
        peakUsageTimes: ['Morning (6am-12pm)', 'Evening (6pm-12am)']
    },
    high: {
        powerConsumption: '4-6kW',
        peakUsageTimes: ['Morning (6am-12pm)', 'Afternoon (12pm-6pm)', 'Evening (6pm-12am)']
    }
}

// Adjust bill categories based on national averages
export const getBillCategory = (amount: number): keyof typeof monthlyBillDefaults => {
    if (amount <= 115) return 'low';  
    if (amount <= 175) return 'medium'; 
    return 'high';
};