/**
 * Script to fix the toLocaleString null reference issue in ProductDetailModal
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// File paths
const modalPath = path.join(__dirname, '../src/components/products/ProductDetailModal.tsx');
const backupPath = `${modalPath}.backup-${Date.now()}`;

// Create backup of original file
function createBackup() {
  try {
    fs.copyFileSync(modalPath, backupPath);
    console.log(`Created backup at ${path.basename(backupPath)}`);
    return true;
  } catch (err) {
    console.error('Error creating backup:', err);
    return false;
  }
}

// Apply fixes to the ProductDetailModal component
function applyFixes() {
  try {
    // Read the original file
    let content = fs.readFileSync(modalPath, 'utf8');
    
    // Add utility functions after component declaration
    const utilityFunctions = `
  // Safe formatting utility functions
  const safeToLocaleString = (value: any, fallback: string = '0'): string => {
    if (value === undefined || value === null) return fallback;
    if (typeof value.toLocaleString === 'function') return value.toLocaleString();
    return String(value);
  };

  const safeToFixed = (value: any, decimals: number = 0, fallback: string = '0'): string => {
    if (value === undefined || value === null) return fallback;
    if (typeof value === 'number') return value.toFixed(decimals);
    if (typeof value.toFixed === 'function') return value.toFixed(decimals);
    return fallback;
  };
`;
    
    // Insert utility functions after the state declarations
    const statePattern = /const \[imageDownloadTracked, setImageDownloadTracked\] = useState\(false\);/;
    content = content.replace(statePattern, `$&\n${utilityFunctions}`);
    
    // Replace formatting calls with safe alternatives
    // Basic product properties
    content = content.replace(/\$\{product\.price\.toLocaleString\(\)\}/g, '${safeToLocaleString(product?.price)}');
    content = content.replace(/\$\{product\.annualSavings\.toLocaleString\(\)\}/g, '${safeToLocaleString(product?.annualSavings)}');
    content = content.replace(/\{\(product\.roi \* 100\)\.toFixed\(1\)\}%/g, '{safeToFixed(product?.roi * 100, 1)}%');
    content = content.replace(/\{product\.paybackPeriod\.toFixed\(1\)\}/g, '{safeToFixed(product?.paybackPeriod, 1)}');
    
    // Enhanced metrics
    content = content.replace(/\$\{product\.enhancedMetrics\.monthlySavings\.toFixed\(2\)\}/g, '${safeToFixed(product?.enhancedMetrics?.monthlySavings, 2)}');
    content = content.replace(/\$\{product\.enhancedMetrics\.fiveYearSavings\.toLocaleString\(\)\}/g, '${safeToLocaleString(product?.enhancedMetrics?.fiveYearSavings)}');
    content = content.replace(/\$\{product\.enhancedMetrics\.tenYearSavings\.toLocaleString\(\)\}/g, '${safeToLocaleString(product?.enhancedMetrics?.tenYearSavings)}');
    content = content.replace(/\{product\.enhancedMetrics\.percentageReduction\.toFixed\(1\)\}%/g, '{safeToFixed(product?.enhancedMetrics?.percentageReduction, 1)}%');
    
    // CO2 reduction
    content = content.replace(/\{product\.enhancedMetrics\.co2Reduction\.annual\.toFixed\(0\)\}/g, '{safeToFixed(product?.enhancedMetrics?.co2Reduction?.annual, 0)}');
    content = content.replace(/\{product\.enhancedMetrics\.co2Reduction\.fiveYear\.toFixed\(0\)\}/g, '{safeToFixed(product?.enhancedMetrics?.co2Reduction?.fiveYear, 0)}');
    content = content.replace(/\{product\.enhancedMetrics\.co2Reduction\.tenYear\.toFixed\(0\)\}/g, '{safeToFixed(product?.enhancedMetrics?.co2Reduction?.tenYear, 0)}');
    content = content.replace(/\{product\.enhancedMetrics\.co2Reduction\.equivalentTrees\}/g, '{product?.enhancedMetrics?.co2Reduction?.equivalentTrees || 0}');
    content = content.replace(/\{product\.enhancedMetrics\.co2Reduction\.equivalentMilesDriven\.toLocaleString\(\)\}/g, '{safeToLocaleString(product?.enhancedMetrics?.co2Reduction?.equivalentMilesDriven)}');
    
    // Energy calculations
    content = content.replace(
      /\$\{\(\(product\.auditContext\.energyInfo\.electricityCost [|][|] 0\) [+] [\s\n]*\(product\.auditContext\.energyInfo\.gasCost [|][|] 0\) [-] [\s\n]*product\.annualSavings\)\.toLocaleString\(\)\}/g, 
      '${safeToLocaleString(((product?.auditContext?.energyInfo?.electricityCost || 0) + (product?.auditContext?.energyInfo?.gasCost || 0) - (product?.annualSavings || 0)))}'
    );
    content = content.replace(
      /\$\{\(product\.annualSavings [*] 10 [-] product\.price\)\.toLocaleString\(\)\}/g, 
      '${safeToLocaleString((product?.annualSavings || 0) * 10 - (product?.price || 0))}'
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(modalPath, content, 'utf8');
    console.log('✅ Successfully applied fixes to ProductDetailModal');
    return true;
  } catch (err) {
    console.error('Error applying fixes:', err);
    return false;
  }
}

// Update the build trigger to force a Heroku rebuild
function updateBuildTrigger() {
  const buildTriggerPath = path.join(__dirname, '../.build-trigger');
  const timestamp = new Date().toISOString();
  
  try {
    fs.writeFileSync(buildTriggerPath, timestamp);
    console.log(`✅ Updated build trigger with timestamp: ${timestamp}`);
    return true;
  } catch (err) {
    console.error('❌ Error updating build trigger:', err);
    return false;
  }
}

// Push the changes to Heroku
function deployToHeroku() {
  try {
    console.log('\n🚀 Initiating Heroku deployment...');
    
    // Add the files to git
    console.log('\n📦 Adding files to git...');
    execSync('git add src/components/products/ProductDetailModal.tsx .build-trigger', {
      stdio: 'inherit'
    });
    
    // Commit the changes
    console.log('\n✍️ Committing changes...');
    execSync('git commit -m "Fix: Add null checks to ProductDetailModal toLocaleString calls"', {
      stdio: 'inherit'
    });
    
    // Remind user to push to Heroku (we don't do it automatically as per organization standards)
    console.log('\n⚠️ IMPORTANT: As per organization standards, please manually push to Heroku with:\n');
    console.log('  git push heroku HEAD:main\n');
    
    return true;
  } catch (err) {
    console.error('\n❌ Preparation for deployment failed:', err);
    return false;
  }
}

// Main function
function main() {
  console.log('=== Fixing ProductDetailModal Component ===\n');
  
  // Create backup
  if (!createBackup()) {
    console.error('❌ Cannot proceed without backup');
    process.exit(1);
  }
  
  // Apply fixes
  if (!applyFixes()) {
    console.error('❌ Failed to apply fixes');
    console.log('Restoring from backup...');
    fs.copyFileSync(backupPath, modalPath);
    console.log('Original file restored');
    process.exit(1);
  }
  
  // Update build trigger
  if (!updateBuildTrigger()) {
    console.error('❌ Failed to update build trigger. Deployment preparation aborted.');
    process.exit(1);
  }
  
  // Deploy to Heroku
  if (!deployToHeroku()) {
    console.error('❌ Deployment preparation failed.');
    process.exit(1);
  }
  
  console.log(`\n✨ ProductDetailModal fix completed successfully! ✨\n
This fix addresses the 'Cannot read properties of undefined (reading 'toLocaleString')' error by:\n
1. Adding utility functions for safe formatting\n2. Adding null checks with optional chaining\n3. Providing fallback values when data is missing\n
The fix should prevent any crashes when viewing product details.\n`);
  console.log('Please follow the deployment steps in energy-audit-vault/operations/deployment/product-detail-modal-fix-deployment.md');
}

// Run the script
main();
