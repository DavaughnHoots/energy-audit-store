// Default mappings for advanced form fields based on basic selections

export const windowTypeDefaults = {
  'single': {
    windowCondition: 'fair' as const,
    numWindows: 10,
    weatherStripping: 'none' as const
  },
  'double': {
    windowCondition: 'good' as const,
    numWindows: 12,
    weatherStripping: 'foam' as const
  },
  'triple': {
    windowCondition: 'excellent' as const,
    numWindows: 12,
    weatherStripping: 'foam' as const
  },
  'not-sure': {
    windowCondition: 'fair' as const,
    numWindows: 8,
    weatherStripping: 'not-sure' as const
  }
} as const;

export const insulationConditionDefaults = {
  'poor': {
    insulation: {
      attic: 'poor' as const,
      walls: 'poor' as const,
      basement: 'poor' as const,
      floor: 'poor' as const
    }
  },
  'average': {
    insulation: {
      attic: 'average' as const,
      walls: 'average' as const,
      basement: 'average' as const,
      floor: 'average' as const
    }
  },
  'good': {
    insulation: {
      attic: 'good' as const,
      walls: 'good' as const,
      basement: 'good' as const,
      floor: 'good' as const
    }
  },
  'not-sure': {
    insulation: {
      attic: 'not-sure' as const,
      walls: 'not-sure' as const,
      basement: 'not-sure' as const,
      floor: 'not-sure' as const
    }
  }
} as const;

export const windowConditionDefaults = {
  'excellent': {
    weatherStripping: 'foam' as const
  },
  'good': {
    weatherStripping: 'foam' as const
  },
  'fair': {
    weatherStripping: 'door-sweep' as const
  },
  'poor': {
    weatherStripping: 'none' as const
  }
} as const;
