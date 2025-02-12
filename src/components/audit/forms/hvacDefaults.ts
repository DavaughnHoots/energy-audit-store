// Default mappings for advanced form fields based on basic selections

export const heatingSystemDefaults = {
  'furnace': {
    fuelType: 'natural-gas' as const,
    age: 15,
    lastService: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0]
  },
  'boiler': {
    fuelType: 'natural-gas' as const,
    age: 15,
    lastService: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0]
  },
  'heat-pump': {
    fuelType: 'electric' as const,
    age: 12,
    lastService: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0]
  },
  'electric-baseboard': {
    fuelType: 'electric' as const,
    age: 10,
    lastService: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0]
  },
  'other': {
    fuelType: 'natural-gas' as const,
    age: 10,
    lastService: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0]
  }
} as const;

export const fuelTypeDefaults = {
  'natural-gas': {
    age: 12,
    lastService: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0]
  },
  'oil': {
    age: 15,
    lastService: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0]
  },
  'electric': {
    age: 8,
    lastService: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString().split('T')[0]
  },
  'propane': {
    age: 10,
    lastService: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0]
  },
  'other': {
    age: 10,
    lastService: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0]
  }
} as const;

export const coolingSystemDefaults = {
  'central': {
    age: 10
  },
  'window-unit': {
    age: 5
  },
  'portable': {
    age: 3
  },
  'none': {
    age: 0
  }
} as const;
