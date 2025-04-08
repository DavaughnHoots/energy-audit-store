// Default mappings for advanced form fields based on basic selections

export const homeTypeDefaults = {
'apartment': {
    numFloors: 1,
    ceilingHeight: 8,
    wallLength: 35, // Adjusted from 30
    wallWidth: 27, // Adjusted from 20
    basementType: 'none',
    basementHeating: undefined
},
'single-family': {
    numFloors: 2,
    ceilingHeight: 9,
    wallLength: 45, // Adjusted from 50
    wallWidth: 30, // Adjusted from 35
    basementType: 'full',
    basementHeating: 'heated'
},
  'townhouse': {
    numFloors: 3,
    ceilingHeight: 9,
    wallLength: 40,
    wallWidth: 20,
    basementType: 'full' as const,
    basementHeating: 'heated' as const
  },
  'duplex': {
    numFloors: 2,
    ceilingHeight: 9,
    wallLength: 45,
    wallWidth: 25,
    basementType: 'full' as const,
    basementHeating: 'heated' as const
  },
  'other': {
    numFloors: 1,
    ceilingHeight: 8,
    wallLength: 40,
    wallWidth: 30,
    basementType: 'slab' as const,
    basementHeating: undefined
  }
} as const;

export const constructionPeriodDefaults = {
  'before-1980': {
    ceilingHeight: 8,
    basementType: 'full' as const,
    basementHeating: 'unheated' as const
  },
  '1980-2000': {
    ceilingHeight: 9,
    basementType: 'full' as const,
    basementHeating: 'partial' as const
  },
  'after-2000': {
    ceilingHeight: 9,
    basementType: 'full' as const,
    basementHeating: 'heated' as const
  }
} as const;

export const sizeCategoryDefaults = {
  'small': {
    wallLength: 35,
    wallWidth: 25,
    numFloors: 1
  },
  'medium': {
    wallLength: 45,
    wallWidth: 30,
    numFloors: 2
  },
  'large': {
    wallLength: 55,
    wallWidth: 35,
    numFloors: 2
  }
} as const;
