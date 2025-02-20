// Default values for different property types and sizes
export const homeDefaults = {
  'single-family': {
    small: { // under 1,500 sq ft
      squareFootage: 1200,
      stories: 1,
      bedrooms: 2,
      bathrooms: 1.5,
      wallLength: 40,
      wallWidth: 30,
      ceilingHeight: 8,
      numRooms: 6,
      numFloors: 1
    },
    medium: { // 1,500-2,500 sq ft
      squareFootage: 2000,
      stories: 2,
      bedrooms: 3,
      bathrooms: 2.5,
      wallLength: 50,
      wallWidth: 40,
      ceilingHeight: 9,
      numRooms: 8,
      numFloors: 2
    },
    large: { // over 2,500 sq ft
      squareFootage: 3000,
      stories: 2,
      bedrooms: 4,
      bathrooms: 3,
      wallLength: 60,
      wallWidth: 50,
      ceilingHeight: 9,
      numRooms: 10,
      numFloors: 2
    }
  },
  'townhouse': {
    small: {
      squareFootage: 1000,
      stories: 2,
      bedrooms: 2,
      bathrooms: 1.5,
      wallLength: 25,
      wallWidth: 20,
      ceilingHeight: 8,
      numRooms: 5,
      numFloors: 2
    },
    medium: {
      squareFootage: 1800,
      stories: 3,
      bedrooms: 3,
      bathrooms: 2.5,
      wallLength: 30,
      wallWidth: 20,
      ceilingHeight: 8,
      numRooms: 7,
      numFloors: 3
    },
    large: {
      squareFootage: 2500,
      stories: 3,
      bedrooms: 4,
      bathrooms: 3.5,
      wallLength: 35,
      wallWidth: 25,
      ceilingHeight: 9,
      numRooms: 9,
      numFloors: 3
    }
  },
  'duplex': {
    small: {
      squareFootage: 800,
      stories: 1,
      bedrooms: 1,
      bathrooms: 1,
      wallLength: 30,
      wallWidth: 25,
      ceilingHeight: 8,
      numRooms: 4,
      numFloors: 1
    },
    medium: {
      squareFootage: 1200,
      stories: 2,
      bedrooms: 2,
      bathrooms: 1.5,
      wallLength: 35,
      wallWidth: 30,
      ceilingHeight: 8,
      numRooms: 6,
      numFloors: 2
    },
    large: {
      squareFootage: 1800,
      stories: 2,
      bedrooms: 3,
      bathrooms: 2,
      wallLength: 40,
      wallWidth: 35,
      ceilingHeight: 8,
      numRooms: 8,
      numFloors: 2
    }
  },
  'mobile-home': {
    small: {
      squareFootage: 600,
      stories: 1,
      bedrooms: 1,
      bathrooms: 1,
      wallLength: 40,
      wallWidth: 15,
      ceilingHeight: 7,
      numRooms: 4,
      numFloors: 1
    },
    medium: {
      squareFootage: 1000,
      stories: 1,
      bedrooms: 2,
      bathrooms: 2,
      wallLength: 50,
      wallWidth: 20,
      ceilingHeight: 7,
      numRooms: 6,
      numFloors: 1
    },
    large: {
      squareFootage: 1400,
      stories: 1,
      bedrooms: 3,
      bathrooms: 2,
      wallLength: 70,
      wallWidth: 20,
      ceilingHeight: 7,
      numRooms: 7,
      numFloors: 1
    }
  }
} as const;

// Helper function to get size category based on square footage
export const getSizeCategory = (squareFootage: number) => {
  if (squareFootage <= 1500) return 'small';
  if (squareFootage <= 2500) return 'medium';
  return 'large';
};

// Helper function to validate dimensions
export const validateDimensions = (length: number, width: number, squareFootage: number) => {
  const calculatedArea = length * width;
  const tolerance = 0.2; // 20% tolerance
  const minArea = squareFootage * (1 - tolerance);
  const maxArea = squareFootage * (1 + tolerance);
  return calculatedArea >= minArea && calculatedArea <= maxArea;
};

// Helper function to get default values based on property type and size
export const getDefaultValues = (propertyType: string, sizeCategory: 'small' | 'medium' | 'large') => {
  return homeDefaults[propertyType as keyof typeof homeDefaults]?.[sizeCategory] || homeDefaults['single-family'].medium;
};
