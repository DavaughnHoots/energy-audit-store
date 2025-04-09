import { Product } from '../productRecommendationService';

/**
 * Gets default products for a specific category when no matching products are found
 * @param mainCategory The main product category
 * @param subCategory The product subcategory
 * @param type The recommendation type
 * @returns Array of default products for the category
 */
export const getDefaultProductsForCategory = (
  mainCategory: string, 
  subCategory: string, 
  type: string
): Product[] => {
  // HVAC defaults
  if (mainCategory === 'Heating & Cooling') {
    if (subCategory === 'HVAC Systems') {
      return [
        {
          id: 'default-hvac-system-1',
          name: 'Energy Star Heat Pump System',
          category: 'HVAC Systems',
          price: 3200.00,
          energyEfficiency: 'Very High',
          features: ['SEER 18', 'Smart thermostat compatible', '10-year warranty'],
          description: 'High-efficiency heat pump system that can save up to 20% on heating and cooling costs.',
          annualSavings: 450,
          roi: 14,
          paybackPeriod: 7.1
        },
        {
          id: 'default-hvac-system-2',
          name: 'Advanced HVAC with Zone Control',
          category: 'HVAC Systems',
          price: 4500.00,
          energyEfficiency: 'Very High',
          features: ['Multi-zone control', 'Smart home integration', 'Energy monitoring'],
          description: 'Premium HVAC system with zoning capabilities for maximum comfort and efficiency.',
          annualSavings: 590,
          roi: 13,
          paybackPeriod: 7.6
        }
      ];
    } else if (subCategory === 'Thermostats') {
      return [
        {
          id: 'default-thermostat-1',
          name: 'Smart Learning Thermostat',
          category: 'Thermostats',
          price: 249.99,
          energyEfficiency: 'Very High',
          features: ['Learning algorithm', 'Remote control via app', 'Energy usage reports'],
          description: 'Smart thermostat that learns your habits and adjusts temperatures automatically to save energy.',
          annualSavings: 180,
          roi: 72,
          paybackPeriod: 1.4
        },
        {
          id: 'default-thermostat-2',
          name: 'Basic Programmable Thermostat',
          category: 'Thermostats',
          price: 79.99,
          energyEfficiency: 'High',
          features: ['7-day programming', 'Battery backup', 'Energy usage tracking'],
          description: 'Affordable programmable thermostat that lets you set temperature schedules to save energy.',
          annualSavings: 120,
          roi: 150,
          paybackPeriod: 0.7
        }
      ];
    }
  }
  
  // Lighting defaults
  if (mainCategory === 'Lighting & Fans') {
    if (subCategory === 'Light Bulbs') {
      return [
        {
          id: 'default-light-bulb-1',
          name: 'Energy Efficient LED Light Bulb Pack',
          category: 'Light Bulbs',
          price: 29.99,
          energyEfficiency: 'High',
          features: ['Energy Star certified', '10-year lifespan', 'Dimmable'],
          description: 'Pack of 10 energy-efficient LED bulbs that use 85% less energy than traditional bulbs.',
          annualSavings: 55,
          roi: 183,
          paybackPeriod: 0.5
        },
        {
          id: 'default-light-bulb-2',
          name: 'Smart LED Bulbs (4-pack)',
          category: 'Light Bulbs',
          price: 49.99,
          energyEfficiency: 'High',
          features: ['App controlled', 'Color changing', 'Voice assistant compatible'],
          description: 'Smart LED bulbs that can be controlled via phone app or voice commands.',
          annualSavings: 45,
          roi: 90,
          paybackPeriod: 1.1
        }
      ];
    } else if (subCategory === 'Light Fixtures') {
      return [
        {
          id: 'default-fixture-1',
          name: 'Energy Efficient Ceiling Fixtures (2-pack)',
          category: 'Light Fixtures',
          price: 129.99,
          energyEfficiency: 'High',
          features: ['Energy Star certified', 'Modern design', 'LED compatible'],
          description: 'Energy efficient ceiling fixtures that work with LED bulbs for maximum efficiency.',
          annualSavings: 75,
          roi: 58,
          paybackPeriod: 1.7
        },
        {
          id: 'default-fixture-2',
          name: 'Motion-Sensing Outdoor Fixture',
          category: 'Light Fixtures',
          price: 89.99,
          energyEfficiency: 'High',
          features: ['Motion detection', 'Weatherproof', 'Adjustable settings'],
          description: 'Outdoor light fixture with built-in motion sensor for security and efficiency.',
          annualSavings: 50,
          roi: 55,
          paybackPeriod: 1.8
        }
      ];
    } else if (subCategory === 'Ceiling Fans') {
      return [
        {
          id: 'default-fan-1',
          name: 'Energy Star Ceiling Fan with Light',
          category: 'Ceiling Fans',
          price: 179.99,
          energyEfficiency: 'High',
          features: ['Energy Star certified', 'Reversible motor', 'LED light kit'],
          description: 'Energy efficient ceiling fan with integrated lighting that helps reduce both heating and cooling costs.',
          annualSavings: 90,
          roi: 50,
          paybackPeriod: 2.0
        }
      ];
    }
  }
  
  // Insulation defaults
  if (mainCategory === 'Building Products' && subCategory === 'Insulation') {
    return [
      {
        id: 'default-insulation-1',
        name: 'Attic Insulation Kit',
        category: 'Insulation',
        price: 350.00,
        energyEfficiency: 'Very High',
        features: ['R-30 value', 'Covers 500 sq ft', 'DIY installation guide'],
        description: 'Complete kit for adding energy-saving insulation to your attic space.',
        annualSavings: 200,
        roi: 57,
        paybackPeriod: 1.75
      },
      {
        id: 'default-insulation-2',
        name: 'Wall Insulation Upgrade',
        category: 'Insulation',
        price: 1200.00,
        energyEfficiency: 'Very High',
        features: ['Professional installation', 'Blown-in cellulose', 'Soundproofing benefits'],
        description: 'Professional-grade wall insulation upgrade to reduce energy loss through walls.',
        annualSavings: 350,
        roi: 29,
        paybackPeriod: 3.4
      }
    ];
  }
  
  // Windows defaults
  if (mainCategory === 'Building Products' && subCategory === 'Windows') {
    return [
      {
        id: 'default-window-1',
        name: 'Energy Efficient Double-Pane Windows',
        category: 'Windows',
        price: 400.00,
        energyEfficiency: 'High',
        features: ['Double-pane glass', 'Low-E coating', 'Weather stripping'],
        description: 'Energy efficient replacement windows that reduce heat transfer and drafts.',
        annualSavings: 120,
        roi: 30,
        paybackPeriod: 3.3
      }
    ];
  }
  
  // Doors defaults for "Windows & Doors" category
  if (mainCategory === 'Building Products' && subCategory === 'Doors') {
    return [
      {
        id: 'default-door-1',
        name: 'Energy Efficient Exterior Door',
        category: 'Doors',
        price: 350.00,
        energyEfficiency: 'High',
        features: ['Insulated core', 'Weathertight seal', 'Energy Star certified'],
        description: 'Well-insulated exterior door that helps prevent drafts and energy loss.',
        annualSavings: 90,
        roi: 25.7,
        paybackPeriod: 3.9
      }
    ];
  }
  
  // Appliances defaults
  if (mainCategory === 'Appliances') {
    return [
      {
        id: 'default-appliance-1',
        name: 'Energy Star Refrigerator',
        category: 'Appliances',
        price: 1099.99,
        energyEfficiency: 'Very High',
        features: ['Energy Star certified', 'LED lighting', 'Smart cooling technology'],
        description: 'Energy efficient refrigerator that uses up to 40% less energy than standard models.',
        annualSavings: 80,
        roi: 7.3,
        paybackPeriod: 13.7
      },
      {
        id: 'default-appliance-2',
        name: 'High-Efficiency Washer/Dryer Combo',
        category: 'Appliances',
        price: 1399.99,
        energyEfficiency: 'Very High',
        features: ['Energy Star certified', 'Water-saving technology', 'Heat pump drying'],
        description: 'Combined washer/dryer unit that saves both energy and water.',
        annualSavings: 120,
        roi: 8.6,
        paybackPeriod: 11.7
      }
    ];
  }
  
  // Water heater defaults
  if (mainCategory === 'Water Heaters') {
    return [
      {
        id: 'default-water-heater-1',
        name: 'Tankless Water Heater',
        category: 'Water Heaters',
        price: 900.00,
        energyEfficiency: 'Very High',
        features: ['On-demand heating', 'Space-saving design', '20-year lifespan'],
        description: 'Tankless water heater that heats water only when needed, reducing standby energy loss.',
        annualSavings: 110,
        roi: 12.2,
        paybackPeriod: 8.2
      },
      {
        id: 'default-water-heater-2',
        name: 'Heat Pump Water Heater',
        category: 'Water Heaters',
        price: 1300.00,
        energyEfficiency: 'Very High',
        features: ['70% less energy use', 'Smart controls', '10-year warranty'],
        description: 'Advanced water heater that uses heat pump technology to significantly reduce energy use.',
        annualSavings: 270,
        roi: 20.8,
        paybackPeriod: 4.8
      }
    ];
  }
  
  // Smart Home defaults
  if (mainCategory === 'Electronics' && 
     (subCategory === 'Smart Home' || type.includes('smart_home') || type.includes('smart-home'))) {
    return [
      {
        id: 'default-smart-home-1',
        name: 'Smart Home Starter Kit',
        category: 'Smart Home',
        price: 249.99,
        energyEfficiency: 'High',
        features: ['Hub included', 'Energy monitoring', 'Smart plugs', 'App control'],
        description: 'Complete starter kit to make your home smarter and more energy efficient.',
        annualSavings: 120,
        roi: 48,
        paybackPeriod: 2.1
      },
      {
        id: 'default-smart-home-2',
        name: 'Smart Power Strip with Energy Monitoring',
        category: 'Smart Home',
        price: 59.99,
        energyEfficiency: 'High',
        features: ['Individual outlet control', 'Energy usage tracking', 'Voice assistant compatible'],
        description: 'Smart power strip that lets you control and monitor energy usage of connected devices.',
        annualSavings: 45,
        roi: 75,
        paybackPeriod: 1.3
      }
    ];
  }
  
  // Renewable Energy defaults
  if (mainCategory === 'Electronics' && 
     (type.includes('renewable') || type.includes('solar'))) {
    return [
      {
        id: 'default-solar-1',
        name: 'Solar Panel Starter Kit',
        category: 'Renewable Energy',
        price: 1299.99,
        energyEfficiency: 'Very High',
        features: ['400W panel', 'Inverter included', 'Battery storage option'],
        description: 'Entry-level solar panel kit for beginners looking to start with renewable energy.',
        annualSavings: 280,
        roi: 21.5,
        paybackPeriod: 4.6
      },
      {
        id: 'default-solar-2',
        name: 'Home Solar System',
        category: 'Renewable Energy',
        price: 7500.00,
        energyEfficiency: 'Very High',
        features: ['2kW system', 'Professional installation', 'Smart monitoring'],
        description: 'Complete home solar system that can significantly reduce your electricity bills.',
        annualSavings: 950,
        roi: 12.7,
        paybackPeriod: 7.9
      }
    ];
  }
  
  // Dehumidification defaults
  if (type.includes('humidity') || type.includes('dehumid')) {
    return [
      {
        id: 'default-dehumid-1',
        name: 'Energy Efficient Dehumidifier',
        category: 'Dehumidifiers',
        price: 249.99,
        energyEfficiency: 'High',
        features: ['Energy Star certified', 'Auto-shutoff', 'Digital humidity control'],
        description: 'Energy efficient dehumidifier that removes excess moisture while using minimal electricity.',
        annualSavings: 45,
        roi: 18,
        paybackPeriod: 5.6
      },
      {
        id: 'default-dehumid-2',
        name: 'Whole-House Dehumidification System',
        category: 'Dehumidifiers',
        price: 1200.00,
        energyEfficiency: 'Very High',
        features: ['Integrated with HVAC', 'Automatic operation', 'Low maintenance'],
        description: 'Whole-house system that works with your existing HVAC to control humidity throughout your home.',
        annualSavings: 120,
        roi: 10,
        paybackPeriod: 10
      }
    ];
  }
  
  // Generic fallback for any other category
  return [
    {
      id: `default-${type}-1`,
      name: `Energy Efficient ${type.charAt(0).toUpperCase() + type.slice(1)} Solution`,
      category: mainCategory,
      price: 199.99,
      energyEfficiency: 'High',
      features: ['Energy Star certified', 'Easy installation', 'Long lifetime'],
      description: `Default energy-efficient solution for ${type} that can significantly reduce energy usage.`,
      annualSavings: 80,
      roi: 40,
      paybackPeriod: 2.5
    }
  ];
};
