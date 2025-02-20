// Default mappings for advanced form fields based on basic selections

export const windowCountDefaults = {
  'few': {
    numWindows: 8,
    windowType: 'not-sure' as const,
    windowCondition: 'fair' as const,
    weatherStripping: 'not-sure' as const,
    estimatedRValue: 1.5
  },
  'average': {
    numWindows: 12,
    windowType: 'double' as const,
    windowCondition: 'good' as const,
    weatherStripping: 'foam' as const,
    estimatedRValue: 2
  },
  'many': {
    numWindows: 16,
    windowType: 'double' as const,
    windowCondition: 'good' as const,
    weatherStripping: 'foam' as const,
    estimatedRValue: 2
  }
} as const;

export const temperatureConsistencyDefaults = {
  'very-consistent': {
    insulation: {
      attic: 'good' as const,
      walls: 'good' as const,
      basement: 'good' as const,
      floor: 'good' as const
    },
    estimatedRValues: {
      attic: 49,
      walls: 21,
      basement: 15,
      floor: 30
    },
    windowCondition: 'excellent' as const,
    weatherStripping: 'foam' as const,
    airLeaks: ['none'],
    estimatedACH: 0.3
  },
  'some-variations': {
    insulation: {
      attic: 'average' as const,
      walls: 'average' as const,
      basement: 'average' as const,
      floor: 'average' as const
    },
    estimatedRValues: {
      attic: 30,
      walls: 13,
      basement: 10,
      floor: 19
    },
    windowCondition: 'good' as const,
    weatherStripping: 'foam' as const,
    airLeaks: ['minor-drafts'],
    estimatedACH: 0.5
  },
  'large-variations': {
    insulation: {
      attic: 'poor' as const,
      walls: 'poor' as const,
      basement: 'poor' as const,
      floor: 'poor' as const
    },
    estimatedRValues: {
      attic: 11,
      walls: 7,
      basement: 4,
      floor: 6
    },
    windowCondition: 'fair' as const,
    weatherStripping: 'none' as const,
    airLeaks: ['major-drafts', 'visible-gaps'],
    estimatedACH: 1.2
  }
} as const;

export const airLeakOptions: Array<{ id: string; label: string }> = [
  { id: 'none', label: 'No noticeable drafts or leaks' },
  { id: 'minor-drafts', label: 'Minor drafts around windows/doors' },
  { id: 'major-drafts', label: 'Significant drafts in multiple areas' },
  { id: 'visible-gaps', label: 'Visible gaps or cracks' },
  { id: 'whistling', label: 'Whistling sounds during windy days' }
];

export const windowTypeDefaults = {
  'single': { estimatedRValue: 1 },
  'double': { estimatedRValue: 2 },
  'triple': { estimatedRValue: 3 },
  'not-sure': { estimatedRValue: 1.5 }
} as const;

export const windowConditionDefaults = {
  'excellent': { estimatedACH: 0.3 },
  'good': { estimatedACH: 0.5 },
  'fair': { estimatedACH: 0.8 },
  'poor': { estimatedACH: 1.2 }
} as const;
