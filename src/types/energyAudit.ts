// src/types/energyAudit.ts

export interface BasicInfo {
    fullName: string;
    email: string;
    phone?: string;
    address: string;
    auditDate: string;
  }
  
  export interface HomeDetails {
    yearBuilt: number;
    homeSize: number;
    numRooms: number;
    homeType: 'apartment' | 'single-family' | 'townhouse' | 'duplex' | 'other';
    numFloors: number;
    basementType: 'full' | 'partial' | 'crawlspace' | 'slab' | 'none' | 'other';
    basementHeating?: 'heated' | 'unheated' | 'partial';
  }
  
  export interface CurrentConditions {
    insulation: {
      attic: 'poor' | 'average' | 'good' | 'excellent' | 'not-sure';
      walls: 'poor' | 'average' | 'good' | 'excellent' | 'not-sure';
      basement: 'poor' | 'average' | 'good' | 'excellent' | 'not-sure';
      floor: 'poor' | 'average' | 'good' | 'excellent' | 'not-sure';
    };
    windowType: 'single' | 'double' | 'triple' | 'not-sure';
    numWindows: number;
    windowCondition: 'excellent' | 'good' | 'fair' | 'poor';
    weatherStripping: 'door-sweep' | 'foam' | 'metal' | 'none' | 'not-sure';
  }
  
  export interface HeatingCooling {
    heatingSystem: {
      type: 'furnace' | 'boiler' | 'heat-pump' | 'electric-baseboard' | 'other';
      fuelType: 'natural-gas' | 'oil' | 'electric' | 'propane' | 'other';
      age: number;
      lastService: string;
    };
    coolingSystem: {
      type: 'central' | 'window-unit' | 'portable' | 'none';
      age: number;
    };
  }
  
  export interface EnergyConsumption {
    powerConsumption: string; // e.g., "2-4kW"
    occupancyHours: {
      weekdays: '0-6' | '7-12' | '13-18' | '19-24';
      weekends: '0-6' | '7-12' | '13-18' | '19-24';
    };
    season: 'mild-winter' | 'moderate-winter' | 'mild-summer' | 'moderate-summer' | 'peak-summer' | 'spring-fall';
    occupancyPattern: string;
    monthlyBill: number;
    peakUsageTimes: string[];
  }
  
  export interface EnergyAuditData {
    basicInfo: BasicInfo;
    homeDetails: HomeDetails;
    currentConditions: CurrentConditions;
    heatingCooling: HeatingCooling;
    energyConsumption: EnergyConsumption;
    // Additional sections will be added as needed
  }
  
  // Validation functions
  export const validateBasicInfo = (data: BasicInfo): string[] => {
    const errors: string[] = [];
    
    if (!data.fullName.trim()) {
      errors.push('Full name is required');
    }
    
    if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push('Valid email is required');
    }
    
    if (data.phone && !data.phone.match(/^\+?[\d\s-]+$/)) {
      errors.push('Invalid phone number format');
    }
    
    if (!data.address.trim()) {
      errors.push('Address is required');
    }
    
    return errors;
  };
  
  export const validateHomeDetails = (data: HomeDetails): string[] => {
    const errors: string[] = [];
    const currentYear = new Date().getFullYear();
    
    if (data.yearBuilt < 1800 || data.yearBuilt > currentYear) {
      errors.push('Invalid year built');
    }
    
    if (data.homeSize < 100 || data.homeSize > 50000) {
      errors.push('Home size must be between 100 and 50,000 square feet');
    }
    
    if (data.numRooms < 1 || data.numRooms > 100) {
      errors.push('Number of rooms must be between 1 and 100');
    }
    
    if (data.numFloors < 1 || data.numFloors > 100) {
      errors.push('Number of floors must be between 1 and 100');
    }
    
    return errors;
  };