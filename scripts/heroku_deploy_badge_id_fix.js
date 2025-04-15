/**
 * Badge ID Format Fix Deployment Script
 * 
 * This script deploys a fix for the badge ID format mismatch issue
 * that prevents badges from being properly displayed in the Achievements tab.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BRANCH_NAME = 'fix/badge-id-format-mismatch';
const COMMIT_MESSAGE = 'Fix badge ID format mismatch to correctly display badges';

// Files to modify
const TARGET_FILE = 'src/components/badges/RealBadgesTab.fixed.tsx';
const OUTPUT_FILE = 'src/components/badges/RealBadgesTab.id-fixed.tsx';

// Utility function for colored console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command, description) {
  log(`\n-------- ${description} --------`, 'cyan');
  log(`Executing: ${command}`, 'yellow');
  
  try {
    const output = execSync(command, { encoding: 'utf8' });
    log(output, 'green');
    log(`✓ ${description} completed successfully!`, 'green');
    return output;
  } catch (error) {
    log(`✗ Error during ${description}:`, 'red');
    log(error.message, 'red');
    throw error;
  }
}

function checkFileExists(filePath) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  return fullPath;
}

function createIdNormalizationFunctions() {
  return `
/**
 * Normalize a badge ID to handle different formats
 * This function converts between different ID formats (hyphenated vs camelCase)
 * @param id The original badge ID
 * @returns The normalized badge ID
 */
function normalizeBadgeId(id) {
  // Convert to lowercase for case-insensitive matching
  const lowercaseId = id.toLowerCase();
  
  // Generate possible ID formats
  const variants = [];
  
  // Add the original ID
  variants.push(lowercaseId);
  
  // If ID has hyphens, create a variant without them (camelCase)
  if (lowercaseId.includes('-')) {
    // Convert from hyphenated to camelCase
    // e.g., "audit-bronze" -> "auditBronze"
    const camelCase = lowercaseId.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    variants.push(camelCase);
    
    // Also add a variant with pluralized first part for audit/audits mismatches
    if (lowercaseId.startsWith('audit-')) {
      variants.push('audits-' + lowercaseId.substring(6));
    } else if (lowercaseId.startsWith('audits-')) {
      variants.push('audit-' + lowercaseId.substring(7));
    }
  } else {
    // If ID doesn't have hyphens, create a hyphenated variant
    // Look for capital letters and convert to hyphenated lowercase
    // e.g., "auditBronze" -> "audit-bronze"
    const hyphenated = lowercaseId.replace(/([A-Z])/g, '-$1').toLowerCase();
    if (hyphenated !== lowercaseId) {
      variants.push(hyphenated);
    }
  }
  
  // For common ID patterns, add specific mappings
  const commonMappings = {
    'audit-bronze': ['auditbronze', 'auditBronze', 'audits-bronze'],
    'audit-silver': ['auditsilver', 'auditSilver', 'audits-silver'],
    'audit-gold': ['auditgold', 'auditGold', 'audits-gold'],
    'audit-platinum': ['auditplatinum', 'auditPlatinum', 'audits-platinum']
  };
  
  // If this ID has a specific mapping, add those variants too
  if (commonMappings[lowercaseId]) {
    variants.push(...commonMappings[lowercaseId]);
  }
  
  // Return all possible variants for matching
  return [...new Set(variants)]; // Remove duplicates
}

/**
 * Helper function to find a badge definition with ID normalization
 * This function tries multiple ID formats to find a match
 * @param allBadges Array of all badge definitions
 * @param badgeId The badge ID to search for
 * @returns The matching badge definition or null if not found
 */
function getNormalizedBadgeDefinition(allBadges, badgeId) {
  if (!badgeId) return null;
  
  // Try direct match first (most efficient)
  const directMatch = allBadges.find(b => b && b.id === badgeId);
  if (directMatch) return directMatch;
  
  // If no direct match, try normalized variants
  const idVariants = normalizeBadgeId(badgeId);
  
  // Log the variants for debugging
  console.log(\`💡 Trying normalized variants for '\${badgeId}':\`, idVariants.join(', '));
  
  // Try each variant
  for (const variant of idVariants) {
    const match = allBadges.find(b => b && b.id.toLowerCase() === variant);
    if (match) {
      console.log(\`✅ Found match using variant '\${variant}' for original ID '\${badgeId}'\`);
      return match;
    }
  }
  
  console.warn(\`❌ No badge definition found for ID '\${badgeId}' after trying all variants\`);
  return null;
}
`;
}

async function deploy() {
  try {
    // Check git status
    log('Checking git status...', 'blue');
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (gitStatus.trim()) {
      log('Warning: You have uncommitted changes. These will be included in the deployment.', 'yellow');
      log(gitStatus, 'yellow');
      log('Continuing in 5 seconds... Press Ctrl+C to abort.', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Verify required files exist
    checkFileExists(TARGET_FILE);
    
    // Create and switch to new branch
    try {
      executeCommand(`git checkout -b ${BRANCH_NAME}`, 'Creating new branch');
    } catch (error) {
      // Branch might already exist, try switching to it
      executeCommand(`git checkout ${BRANCH_NAME}`, 'Switching to existing branch');
    }
    
    // Read the current file
    log('Reading target file...', 'blue');
    const fileContent = fs.readFileSync(TARGET_FILE, 'utf8');
    
    // Modify file to add the ID normalization functions
    log('Modifying file content...', 'blue');
    
    // Find the prepareBadgesForDisplay function and modify it to use normalization
    let modifiedContent = fileContent.replace(
      /function prepareBadgesForDisplay\([^)]*\)[\s\S]*?\{[\s\S]*?const badgeDefinition = allBadges\.find\(b => b && b\.id === badgeId\);/g,
      'function prepareBadgesForDisplay(allBadges, userBadges) {\n  // Use enhanced ID normalization\n  if (!allBadges || !Array.isArray(allBadges) || !userBadges || !Array.isArray(userBadges)) {\n    console.warn(\'Invalid inputs to prepareBadgesForDisplay\', { \n      allBadgesType: typeof allBadges,\n      allBadgesIsArray: Array.isArray(allBadges),\n      allBadgesLength: allBadges?.length || 0,\n      userBadgesType: typeof userBadges,\n      userBadgesIsArray: Array.isArray(userBadges),\n      userBadgesLength: userBadges?.length || 0 \n    });\n    return [];\n  }\n  \n  if (userBadges.length === 0 || allBadges.length === 0) {\n    return [];\n  }\n  \n  const badgeDefinitions = [];\n  \n  // Loop through user badges and find the corresponding badge definition\n  userBadges.forEach(userBadge => {\n    if (!userBadge) return;\n    \n    // Get the badge ID - it might be in different locations depending on data format\n    const badgeId = userBadge.badgeId || userBadge.id;\n    \n    if (!badgeId) {\n      console.warn(\'User badge missing ID\', userBadge);\n      return;\n    }\n    \n    // Find the matching badge definition with improved ID normalization\n    const badgeDefinition = getNormalizedBadgeDefinition(allBadges, badgeId);'
    );
    
    // Add the normalization functions near the end of the file
    // Insert before the export
    modifiedContent = modifiedContent.replace(
      /export default RealBadgesTabFixed;/g,
      createIdNormalizationFunctions() + '\n\nexport default RealBadgesTabFixed;'
    );
    
    // Write the modified content to the new file
    log(`Writing modified content to ${OUTPUT_FILE}...`, 'blue');
    fs.writeFileSync(OUTPUT_FILE, modifiedContent, 'utf8');
    
    // Update App.tsx to use the new component
    log('Updating BadgesTab.tsx to use the ID-fixed component...', 'blue');
    const badgesTabPath = 'src/components/badges/BadgesTab.tsx';
    const badgesTabContent = fs.readFileSync(badgesTabPath, 'utf8');
    const updatedBadgesTabContent = badgesTabContent
      .replace(
        /import RealBadgesTab(Fixed|Enhanced) from '.\/RealBadgesTab\.(fixed|enhanced)';/g,
        "import RealBadgesTabIdFixed from './RealBadgesTab.id-fixed';"
      )
      .replace(
        /return <RealBadgesTab(Fixed|Enhanced) \/?>/g,
        'return <RealBadgesTabIdFixed />;'
      );
    fs.writeFileSync(badgesTabPath, updatedBadgesTabContent, 'utf8');
    
    // Stage the changed files
    executeCommand(`git add ${OUTPUT_FILE} ${badgesTabPath}`, 'Staging changes');
    
    // Commit changes
    executeCommand(`git commit -m "${COMMIT_MESSAGE}"`, 'Committing changes');
    
    // Push to GitHub
    executeCommand(`git push -u origin ${BRANCH_NAME}`, 'Pushing to GitHub');
    
    log('\n======== MANUAL HEROKU DEPLOYMENT STEPS ========', 'magenta');
    log('1. Deploy to Heroku with:', 'blue');
    log(`   git push heroku ${BRANCH_NAME}:main`, 'cyan');
    log('2. Verify the deployment with:', 'blue');
    log('   heroku logs --tail', 'cyan');
    log('3. Check the badges display with both user accounts:', 'blue');
    log('   - Verify if badges now appear properly', 'cyan');
    log('   - Check the console for ID normalization logs', 'cyan');
    log('   - Note which ID mappings are being used', 'cyan');
    log('=================================================', 'magenta');
    
    log('\nGitHub branch has been created and pushed.', 'green');
    log('Please follow the manual Heroku deployment steps above.', 'green');
    
  } catch (error) {
    log('Deployment failed!', 'red');
    log(error.stack || error.message, 'red');
    process.exit(1);
  }
}

deploy();
