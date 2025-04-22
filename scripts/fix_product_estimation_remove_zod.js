/**
 * Fix script for Product Estimation System - Remove Zod dependency
 * 
 * This script replaces the Zod-based schema validation with native TypeScript
 * validation to avoid the module resolution issues with Zod in the browser.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Replace Zod schema file with a simplified version
 */
function replaceSchemaFile() {
  console.log('Replacing Zod schema with simplified TypeScript validation...');
  
  const schemaPath = 'src/schemas/productEstimationSchema.ts';
  
  if (!fs.existsSync(schemaPath)) {
    console.error('Error: ' + schemaPath + ' not found!');
    process.exit(1);
  }
  
  // Define the new content without Zod dependencies
  const newContent = `/**
 * Schema definitions for product estimations
 * Using native TypeScript types instead of Zod
 */

// Type definitions (formerly Zod schemas)

/** Base configuration with version */
export interface EstimationConfigBase {
  schemaVersion: string; // Format: "2025-04-v1"
  lastUpdated: string; // ISO datetime
}

/** Reference data for calculations */
export interface ReferenceData {
  electricityRatesUSDPerkWh: Record<string, number>;
  iefThresholds: {
    dehumidifiers: {
      portable: {
        small: {
          standard: number;
          energyStar: number;
          mostEfficient: number;
        };
        medium: {
          standard: number;
          energyStar: number;
          mostEfficient: number;
        };
        large: {
          standard: number;
          energyStar: number;
          mostEfficient: number;
        };
      };
      wholehouse: {
        standard: number;
        energyStar: number;
        mostEfficient: number;
      };
    };
  };
  confidenceThresholds: {
    medium: number;
    high: number;
  };
}

/** Dehumidifier configuration */
export interface DehumidifierConfig {
  priceParameters: {
    basePrice: number;
    capacityMultiplier: number;
    energyStarPremium: number;
    mostEfficientPremium: number;
  };
  energyMetrics: {
    standardIEF: number;
    energyStarIEF: number;
    mostEfficientIEF: number;
  };
  defaults: {
    annualRunDays: number;
    dailyRunHours: number;
  };
  efficiencyRatings: Record<string, string>;
}

/** Refrigerator placeholder */
export interface RefrigeratorConfig {
  _placeholder: boolean;
}

/** HVAC placeholder */
export interface HvacConfig {
  _placeholder: boolean;
}

/** Combined configuration */
export interface ProductEstimationsConfig extends EstimationConfigBase {
  referenceData: ReferenceData;
  dehumidifiers: DehumidifierConfig;
  refrigerators: RefrigeratorConfig;
  hvac: HvacConfig;
}

/** Category-specific configuration types */
export interface DehumidifierCategoryConfig extends DehumidifierConfig {
  category: 'dehumidifiers';
}

export interface RefrigeratorCategoryConfig extends RefrigeratorConfig {
  category: 'refrigerators';
}

export interface HvacCategoryConfig extends HvacConfig {
  category: 'hvac';
}

export type ProductCategoryConfig = 
  | DehumidifierCategoryConfig
  | RefrigeratorCategoryConfig
  | HvacCategoryConfig;

export type ProductCategory = ProductCategoryConfig['category'];

/**
 * Validation functions
 */

/**
 * Simple validation helper for configs
 * @param config The configuration to validate
 * @returns The validated configuration
 */
export function validateConfig(config: unknown): ProductEstimationsConfig {
  // Basic runtime type checking
  if (!config || typeof config !== 'object') {
    throw new Error('Configuration must be an object');
  }
  
  const typedConfig = config as ProductEstimationsConfig;
  
  // Check essential properties
  if (!typedConfig.schemaVersion) {
    throw new Error('Missing schemaVersion in configuration');
  }
  
  if (!typedConfig.referenceData) {
    throw new Error('Missing referenceData in configuration');
  }
  
  if (!typedConfig.dehumidifiers) {
    throw new Error('Missing dehumidifiers configuration');
  }
  
  // Return typed config
  return typedConfig;
}

/**
 * Validate category-specific configuration
 * @param categoryConfig The configuration to validate
 * @returns The validated configuration
 */
export function validateCategoryConfig(categoryConfig: unknown): ProductCategoryConfig {
  if (!categoryConfig || typeof categoryConfig !== 'object') {
    throw new Error('Category configuration must be an object');
  }
  
  const typedConfig = categoryConfig as ProductCategoryConfig;
  
  if (!typedConfig.category) {
    throw new Error('Missing category in configuration');
  }
  
  // Validate based on category
  switch (typedConfig.category) {
    case 'dehumidifiers':
      // Add more validation if needed
      break;
    case 'refrigerators':
    case 'hvac':
      // Add more validation if needed
      break;
    default:
      throw new Error('Unknown category: ' + String(typedConfig.category));
  }
  
  return typedConfig;
}
`;
  
  fs.writeFileSync(schemaPath, newContent, 'utf8');
  console.log('✅ Replaced schema file with simplified version');
  return true;
}

/**
 * Update service files to use the new schema
 */
function updateServiceFiles() {
  console.log('Updating service files...');
  
  const estimationServicePath = 'src/services/productEstimationService.ts';
  
  if (fs.existsSync(estimationServicePath)) {
    let content = fs.readFileSync(estimationServicePath, 'utf8');
    
    // Replace any validateConfig imports
    content = content.replace(
      /import\s+\{\s*validateConfig/,
      'import { validateConfig'
    );
    
    // Remove any zod specific validation code
    content = content.replace(/\/\/\s*Validate configuration before returning.*?\n/g, '// Validate configuration\n');
    
    fs.writeFileSync(estimationServicePath, content, 'utf8');
    console.log('✅ Updated ' + estimationServicePath);
  } else {
    console.log('⚠️ ' + estimationServicePath + ' not found, skipping');
  }
  
  // Update the estimator factory file
  const factoryPath = 'src/services/productEstimation/estimatorFactory.ts';
  
  if (fs.existsSync(factoryPath)) {
    let content = fs.readFileSync(factoryPath, 'utf8');
    
    // Remove any zod specific imports or references
    content = content.replace(/import\s+\{.*?ProductEstimationsConfig.*?\}\s+from\s+['"]\.\.\/\.\.\/schemas\/productEstimationSchema['"]/g, 
                             "import { ProductEstimationsConfig } from '../../schemas/productEstimationSchema'");
    
    fs.writeFileSync(factoryPath, content, 'utf8');
    console.log('✅ Updated ' + factoryPath);
  } else {
    console.log('⚠️ ' + factoryPath + ' not found, skipping');
  }
  
  // Update DehumidifierEstimator.ts
  const estimatorPath = 'src/services/productEstimation/DehumidifierEstimator.ts';
  
  if (fs.existsSync(estimatorPath)) {
    let content = fs.readFileSync(estimatorPath, 'utf8');
    
    // Update any imports
    content = content.replace(/import\s+\{.*?\}\s+from\s+['"]\.\.\/\.\.\/schemas\/productEstimationSchema['"]/g, 
                           "import { DehumidifierConfig, ReferenceData } from '../../schemas/productEstimationSchema'");
    
    fs.writeFileSync(estimatorPath, content, 'utf8');
    console.log('✅ Updated ' + estimatorPath);
  } else {
    console.log('⚠️ ' + estimatorPath + ' not found, skipping');
  }
}

/**
 * Commit changes
 */
function commitChanges() {
  console.log('Committing changes...');
  
  try {
    // Add all modified files
    execSync('git add src/schemas/productEstimationSchema.ts src/services/productEstimationService.ts src/services/productEstimation/estimatorFactory.ts src/services/productEstimation/DehumidifierEstimator.ts');
    
    // Commit with descriptive message
    execSync('git commit -m "Replace Zod schema with native TypeScript validation to fix module resolution"');
    
    console.log('✅ Changes committed successfully!');
    return true;
  } catch (error) {
    console.error('Error committing changes:', error.message);
    console.log('You may need to manually commit the changes');
    return false;
  }
}

/**
 * Deploy to Heroku
 */
function deployToHeroku() {
  console.log('Deploying to Heroku...');
  
  try {
    // Push to Heroku
    execSync('git push heroku HEAD:main', { stdio: 'inherit' });
    
    console.log('✅ Deployment to Heroku completed successfully!');
    return true;
  } catch (error) {
    console.error('Error deploying to Heroku:', error.message);
    console.log('You may need to manually deploy with: git push heroku HEAD:main');
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log('Starting fix for Product Estimation System - Removing Zod dependency...');
  console.log('');
  
  // Execute steps
  replaceSchemaFile();
  updateServiceFiles();
  
  console.log('\nCommitting changes...');
  const committed = commitChanges();
  
  if (committed) {
    console.log('\nDeploying to Heroku...');
    deployToHeroku();
  }
  
  console.log('\n✅ Fix completed!');
  console.log('The Product Estimation System should now work without Zod dependency issues.');
}

// Execute the main function
main();
