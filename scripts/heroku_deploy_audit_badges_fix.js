const fs = require('fs');
const path = require('path');

// ----- Audit Badges Missing Fix Script -----
// This script adds audit badge definitions to the system and ensures
// audit completions properly track badge progress.
// It addresses the issue where audit badges are completely missing.

// Simple color functions to replace colors
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

// Helper function to combine styling
const colorize = {
  green: {
    bold: (text) => colors.green(colors.bold(text))
  },
  yellow: {
    bold: (text) => colors.yellow(colors.bold(text))
  },
  red: {
    bold: (text) => colors.red(colors.bold(text))
  },
  cyan: {
    bold: (text) => colors.cyan(colors.bold(text))
  }
};

console.log(colorize.green.bold('Audit Badges Missing Fix Deployment'));
console.log(colors.yellow('This script adds audit badge definitions and integrates them with the system'));

// 1. Update the badge definitions in the data file
const updateBadgeDefinitions = () => {
  console.log('Updating badge definitions to include audit badges...');
  
  // Check if data/badges.ts exists
  const badgeDefinitionsPath = path.resolve('src/data/badges.ts');
  if (!fs.existsSync(badgeDefinitionsPath)) {
    // Try alternate location
    const altBadgeDefinitionsPath = path.resolve('src/data/badgeDefinitions.ts');
    if (fs.existsSync(altBadgeDefinitionsPath)) {
      return updateBadgeDefsFile(altBadgeDefinitionsPath);
    }
    
    console.log(colors.yellow('Looking for badge definitions in service files...'));
    // If we don't find the dedicated files, try service files
    const badgeServicePath = path.resolve('src/services/badgeService.ts');
    if (fs.existsSync(badgeServicePath)) {
      return updateBadgeDefsInService(badgeServicePath);
    }
    
    console.error(colors.red('Could not find badge definitions file. Please check your project structure.'));
    return false;
  }
  
  return updateBadgeDefsFile(badgeDefinitionsPath);
};

// Helper function to update badge definitions in a dedicated data file
const updateBadgeDefsFile = (filePath) => {
  try {
    console.log(`Found badge definitions at: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if audit badges already exist
    if (content.includes('audit-bronze') || content.includes('audit_bronze')) {
      console.log(colors.yellow('Audit badge definitions already exist. Skipping update.'));
      return true;
    }
    
    // Determine the badge structure and format
    const usesDashes = content.includes('-bronze') || content.includes('-silver');
    const badgeIdFormat = usesDashes ? 'dashed' : 'underscored';
    console.log(`Using ${badgeIdFormat} format for badge IDs`);
    
    // Find a good insertion point - look for an export or a badge definition object
    let insertPoint;
    let insertContent;
    
    // Look for the BADGES object definition or export statement
    if (content.includes('export const BADGES')) {
      insertPoint = content.indexOf('export const BADGES');
      // Find the opening brace of the object
      const openingBrace = content.indexOf('{', insertPoint);
      // Insert after the opening brace
      insertPoint = openingBrace + 1;
      
      // Format with proper indentation
      const indentation = getIndentation(content, insertPoint);
      insertContent = `\n${indentation}// Audit Badges\n`;
      insertContent += formatBadgeDefinition('audit', 'bronze', 'Audit Novice', 'Complete your first energy audit', badgeIdFormat, indentation);
      insertContent += formatBadgeDefinition('audit', 'silver', 'Audit Enthusiast', 'Complete 3 energy audits', badgeIdFormat, indentation);
      insertContent += formatBadgeDefinition('audit', 'gold', 'Audit Expert', 'Complete 5 energy audits', badgeIdFormat, indentation);
      insertContent += formatBadgeDefinition('audit', 'platinum', 'Audit Master', 'Complete 10 energy audits', badgeIdFormat, indentation);
    } 
    // Try to find a badge array definition
    else if (content.includes('const badges =') || content.includes('const BADGES =')) {
      // Find array start
      const arrayStart = content.indexOf('[', content.indexOf('const badges =') || content.indexOf('const BADGES ='));
      if (arrayStart !== -1) {
        insertPoint = arrayStart + 1;
        
        // Format with proper indentation
        const indentation = getIndentation(content, insertPoint);
        insertContent = `\n${indentation}// Audit Badges\n`;
        insertContent += formatBadgeDefinitionAsObject('audit', 'bronze', 'Audit Novice', 'Complete your first energy audit', badgeIdFormat, indentation);
        insertContent += formatBadgeDefinitionAsObject('audit', 'silver', 'Audit Enthusiast', 'Complete 3 energy audits', badgeIdFormat, indentation);
        insertContent += formatBadgeDefinitionAsObject('audit', 'gold', 'Audit Expert', 'Complete 5 energy audits', badgeIdFormat, indentation);
        insertContent += formatBadgeDefinitionAsObject('audit', 'platinum', 'Audit Master', 'Complete 10 energy audits', badgeIdFormat, indentation);
      } else {
      console.error(colors.red('Could not find appropriate insertion point in badge definitions.'));
        return false;
      }
    } else {
      console.error(colors.red('Could not determine badge definition structure.'));
      return false;
    }
    
    // Update the content with new badge definitions
    content = content.slice(0, insertPoint) + insertContent + content.slice(insertPoint);
    fs.writeFileSync(filePath, content);
    
    console.log(colors.green('✓ Successfully added audit badge definitions!'));
    return true;
  } catch (error) {
    console.error(colors.red('Error updating badge definitions:'), error);
    return false;
  }
};

// Helper function to update badge definitions in a service file
const updateBadgeDefsInService = (filePath) => {
  try {
    console.log(`Found badge service at: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if audit badges already exist
    if (content.includes('audit-bronze') || content.includes('audit_bronze')) {
      console.log(colors.yellow('Audit badge definitions already exist in service. Skipping update.'));
      return true;
    }
    
    // Look for badge evaluation methods that might need updating
    if (content.includes('evaluateAuditBadges')) {
      console.log('Found evaluateAuditBadges method, updating criteria...');
      
      // Find the method definition
      const evalMethodIndex = content.indexOf('evaluateAuditBadges');
      if (evalMethodIndex !== -1) {
        // Find the method body
        const methodBodyStart = content.indexOf('{', evalMethodIndex);
        // Find a good place to update criteria - look for threshold constants
        let thresholdStart = content.indexOf('BRONZE_THRESHOLD', methodBodyStart);
        if (thresholdStart !== -1) {
          // Find the line end
          const lineEnd = content.indexOf('\n', thresholdStart);
          // Check if there's a constant definition
          const constLine = content.substring(thresholdStart, lineEnd);
          
          // If there's a constant definition with a value, update it
          if (constLine.includes('=')) {
            // Find all threshold definitions and update them
            updateThresholdValue(content, 'BRONZE_THRESHOLD', 1, thresholdStart);
            
            // Find silver threshold
            thresholdStart = content.indexOf('SILVER_THRESHOLD', lineEnd);
            if (thresholdStart !== -1) {
              updateThresholdValue(content, 'SILVER_THRESHOLD', 3, thresholdStart);
            }
            
            // Find gold threshold
            thresholdStart = content.indexOf('GOLD_THRESHOLD', lineEnd);
            if (thresholdStart !== -1) {
              updateThresholdValue(content, 'GOLD_THRESHOLD', 5, thresholdStart);
            }
            
            // Check for platinum threshold
            thresholdStart = content.indexOf('PLATINUM_THRESHOLD', lineEnd);
            if (thresholdStart !== -1) {
              updateThresholdValue(content, 'PLATINUM_THRESHOLD', 10, thresholdStart);
            } else {
              // If platinum doesn't exist, add it
              const silverLine = content.indexOf('SILVER_THRESHOLD', methodBodyStart);
              if (silverLine !== -1) {
                const nextLine = content.indexOf('\n', silverLine);
                const indentation = getIndentation(content, silverLine);
                const platLine = `\n${indentation}const PLATINUM_THRESHOLD = 10;`;
                content = content.slice(0, nextLine) + platLine + content.slice(nextLine);
              }
            }
          }
        }
      }
    } else {
      // If no evaluation method exists, look for where badge constants are defined
      console.log('Looking for badge constant definitions to add audit badges...');
      
      // Look for BADGES object or badge constants
      const badgeConstsIndex = content.indexOf('BADGES');
      if (badgeConstsIndex !== -1) {
        // Determine format - dash or underscore
        const usesDashes = content.includes('-bronze') || content.includes('-silver');
        const badgeIdFormat = usesDashes ? 'dashed' : 'underscored';
        
        // Find object definition
        const objectStart = content.indexOf('{', badgeConstsIndex);
        if (objectStart !== -1) {
          const indentation = getIndentation(content, objectStart + 1);
          
          // Create audit badge definitions
          let auditBadges = `\n${indentation}// Audit badges\n`;
          auditBadges += formatBadgeConstant('audit', 'bronze', badgeIdFormat, indentation);
          auditBadges += formatBadgeConstant('audit', 'silver', badgeIdFormat, indentation);
          auditBadges += formatBadgeConstant('audit', 'gold', badgeIdFormat, indentation);
          auditBadges += formatBadgeConstant('audit', 'platinum', badgeIdFormat, indentation);
          
          // Insert after opening brace
          content = content.slice(0, objectStart + 1) + auditBadges + content.slice(objectStart + 1);
        }
      }
    }
    
    // Write updated content
    fs.writeFileSync(filePath, content);
    console.log(colors.green('✓ Successfully updated badge service with audit badges!'));
    return true;
  } catch (error) {
    console.error(colors.red('Error updating badge service:'), error);
    return false;
  }
};

// Helper function to update a threshold value constant
const updateThresholdValue = (content, constName, newValue, startIndex) => {
  // Find the current value
  const lineEnd = content.indexOf('\n', startIndex);
  const constLine = content.substring(startIndex, lineEnd);
  
  // Extract current value - look for pattern like "const NAME = value"
  const currentValueMatch = constLine.match(/=\s*(\d+)/);
  if (currentValueMatch && currentValueMatch[1] !== newValue.toString()) {
    // Value exists and is different, update it
    const newLine = constLine.replace(/=\s*\d+/, `= ${newValue}`);
    content = content.slice(0, startIndex) + newLine + content.slice(lineEnd);
  }
};

// Helper function to detect and return the indentation at a given position
const getIndentation = (content, position) => {
  // Find the start of the line containing the position
  const lineStart = content.lastIndexOf('\n', position) + 1;
  // Count spaces and tabs until non-whitespace character
  let i = lineStart;
  let indentation = '';
  while (i < content.length && (content[i] === ' ' || content[i] === '\t')) {
    indentation += content[i];
    i++;
  }
  return indentation;
};

// Helper function to format a badge definition based on the structure
const formatBadgeDefinition = (category, tier, name, description, format, indentation) => {
  const badgeId = format === 'dashed' ? `${category}-${tier}` : `${category}_${tier}`;
  return `${indentation}'${badgeId}': {\n` +
         `${indentation}  id: '${badgeId}',\n` +
         `${indentation}  name: '${name}',\n` +
         `${indentation}  description: '${description}',\n` +
         `${indentation}  category: '${category}',\n` +
         `${indentation}  tier: '${tier}',\n` +
         `${indentation}  points: ${tier === 'bronze' ? 100 : tier === 'silver' ? 200 : tier === 'gold' ? 300 : 500},\n` +
         `${indentation}  criteria: {\n` +
         `${indentation}    type: 'count',\n` +
         `${indentation}    count: ${tier === 'bronze' ? 1 : tier === 'silver' ? 3 : tier === 'gold' ? 5 : 10},\n` +
         `${indentation}    metric: 'audits'\n` +
         `${indentation}  }\n` +
         `${indentation}},\n`;
};

// Helper function to format a badge definition as an array object
const formatBadgeDefinitionAsObject = (category, tier, name, description, format, indentation) => {
  const badgeId = format === 'dashed' ? `${category}-${tier}` : `${category}_${tier}`;
  return `${indentation}{\n` +
         `${indentation}  id: '${badgeId}',\n` +
         `${indentation}  name: '${name}',\n` +
         `${indentation}  description: '${description}',\n` +
         `${indentation}  category: '${category}',\n` +
         `${indentation}  tier: '${tier}',\n` +
         `${indentation}  points: ${tier === 'bronze' ? 100 : tier === 'silver' ? 200 : tier === 'gold' ? 300 : 500},\n` +
         `${indentation}  criteria: {\n` +
         `${indentation}    type: 'count',\n` +
         `${indentation}    count: ${tier === 'bronze' ? 1 : tier === 'silver' ? 3 : tier === 'gold' ? 5 : 10},\n` +
         `${indentation}    metric: 'audits'\n` +
         `${indentation}  }\n` +
         `${indentation}},\n`;
};

// Helper function to format badge constant definitions
const formatBadgeConstant = (category, tier, format, indentation) => {
  const badgeId = format === 'dashed' ? `${category}-${tier}` : `${category}_${tier}`;
  return `${indentation}${badgeId.toUpperCase()}: '${badgeId}',\n`;
};

// 2. Update EnergyAuditForm to record badge activity on audit completion
const updateEnergyAuditForm = () => {
  console.log('Updating EnergyAuditForm to record audit badge activity...');
  
  // Check if EnergyAuditForm.tsx exists
  const formPath = path.resolve('src/components/audit/EnergyAuditForm.tsx');
  if (!fs.existsSync(formPath)) {
    console.error(colors.red('Could not find EnergyAuditForm.tsx. Please check your project structure.'));
    return false;
  }
  
  try {
    let content = fs.readFileSync(formPath, 'utf8');
    
    // Check if the badge activity recording is already there
    if (content.includes('audit_completed') || content.includes('audit-completed')) {
      console.log(colors.yellow('Audit badge activity recording already exists in form. Checking for complete implementation...'));
      
      // Make sure the recording includes the correct data
      if (!content.includes('propertyType') || !content.includes('yearBuilt')) {
        console.log('Updating existing audit badge activity to include complete metadata...');
        
        // Find the existing activity recording
        const activityIndex = content.indexOf('recordActivity') || content.indexOf('badgeService.recordActivity');
        if (activityIndex !== -1) {
          // Find the closing parenthesis of the recordActivity call
          const closingParenIndex = findMatchingClosingBracket(content, '(', ')', content.indexOf('(', activityIndex));
          
          // Get the content of the recordActivity call
          const activityContent = content.substring(content.indexOf('(', activityIndex), closingParenIndex + 1);
          
          // Check if it has all required fields
          if (!activityContent.includes('propertyType') || !activityContent.includes('yearBuilt')) {
            // It's missing fields, let's update it
            const updatedActivity = activityContent.replace(
              /\)\s*$/,
              `,\n        propertyType: formData.basicInfo.propertyType,\n        yearBuilt: formData.basicInfo.yearBuilt\n      })`
            );
            
            // Replace the content
            content = content.slice(0, content.indexOf('(', activityIndex)) + 
                      updatedActivity + 
                      content.slice(closingParenIndex + 1);
            
            fs.writeFileSync(formPath, content);
            console.log(colors.green('✓ Successfully updated audit badge activity with complete metadata!'));
          } else {
            console.log(colors.green('✓ Audit badge activity already has complete metadata.'));
          }
        }
      } else {
        console.log(colors.green('✓ Audit badge activity recording is already complete.'));
      }
      
      return true;
    }
    
    // Look for the submission success handler - typically in handleSubmit
    const submissionSuccessIndex = content.indexOf('setSubmittedAuditId');
    if (submissionSuccessIndex === -1) {
      console.log(colors.yellow('Could not find submission success handler. Looking for alternatives...'));
      
      // Try to find another indicator of success
      const alternativeSuccessIndex = content.indexOf('trackFormComplete') || 
                                     content.indexOf('success') || 
                                     content.indexOf('onSubmit');
      
      if (alternativeSuccessIndex !== -1) {
        // Look for a surrounding if block with isAuthenticated check
        const nearbyAuthCheck = content.indexOf('isAuthenticated', alternativeSuccessIndex - 200);
        if (nearbyAuthCheck !== -1 && nearbyAuthCheck < alternativeSuccessIndex + 200) {
          // We found a good spot, find a good insertion point
          let insertionPoint = content.indexOf('{', nearbyAuthCheck);
          insertionPoint = content.indexOf('\n', insertionPoint) + 1;
          
          // Format with proper indentation
          const indentation = getIndentation(content, insertionPoint);
          const badgeActivityCode = `${indentation}// Record badge activity for audit completion\n` +
                            `${indentation}try {\n` +
                            `${indentation}  if (user?.id && result?.id) {\n` +
                            `${indentation}    badgeService.recordActivity(user.id, 'audit_completed', {\n` +
                            `${indentation}      auditId: result.id,\n` +
                            `${indentation}      timestamp: new Date().toISOString(),\n` +
                            `${indentation}      propertyType: formData.basicInfo.propertyType,\n` +
                            `${indentation}      yearBuilt: formData.basicInfo.yearBuilt\n` +
                            `${indentation}    });\n` +
                            `${indentation}    console.log('Recorded audit completion for badges');\n` +
                            `${indentation}  }\n` +
                            `${indentation}} catch (error) {\n` +
                            `${indentation}  console.error('Error recording badge activity:', error);\n` +
                            `${indentation}}\n\n`;
          
          // Insert the badge activity code
          content = content.slice(0, insertionPoint) + badgeActivityCode + content.slice(insertionPoint);
          
          // Make sure badgeService is imported
          if (!content.includes('import { badgeService }')) {
            // Find the last import
            const lastImportIndex = content.lastIndexOf('import ');
            const lastImportEnd = content.indexOf('\n', lastImportIndex) + 1;
            
            // Add badgeService import
            content = content.slice(0, lastImportEnd) + 
                      "import { badgeService } from '@/services/badgeService';\n" + 
                      content.slice(lastImportEnd);
          }
          
          fs.writeFileSync(formPath, content);
          console.log(colors.green('✓ Successfully added audit badge activity recording!'));
          return true;
        }
      }
      
      console.error(colors.red('Could not find appropriate insertion point for badge activity.'));
      return false;
    }
    
    // Find the appropriate insertion point after setSubmittedAuditId
    let insertionPoint = content.indexOf(';', submissionSuccessIndex) + 1;
    // Find the next statement
    insertionPoint = content.indexOf('\n', insertionPoint) + 1;
    
    // Format with proper indentation
    const indentation = getIndentation(content, insertionPoint);
    const badgeActivityCode = `\n${indentation}// Record badge activity for audit completion\n` +
                     `${indentation}try {\n` +
                     `${indentation}  // Get user ID from auth context\n` +
                     `${indentation}  const { user } = useAuth();\n` +
                     `${indentation}  if (user?.id && result?.id) {\n` +
                     `${indentation}    badgeService.recordActivity(user.id, 'audit_completed', {\n` +
                     `${indentation}      auditId: result.id,\n` +
                     `${indentation}      timestamp: new Date().toISOString(),\n` +
                     `${indentation}      propertyType: formData.basicInfo.propertyType,\n` +
                     `${indentation}      yearBuilt: formData.basicInfo.yearBuilt\n` +
                     `${indentation}    });\n` +
                     `${indentation}    console.log('Recorded audit completion for badges');\n` +
                     `${indentation}  }\n` +
                     `${indentation}} catch (error) {\n` +
                     `${indentation}  console.error('Error recording badge activity:', error);\n` +
                     `${indentation}}\n`;
    
    // Insert the badge activity code
    content = content.slice(0, insertionPoint) + badgeActivityCode + content.slice(insertionPoint);
    
    // Make sure badgeService and useAuth are imported
    let importsAdded = false;
    if (!content.includes('import { badgeService }')) {
      // Find the last import
      const lastImportIndex = content.lastIndexOf('import ');
      const lastImportEnd = content.indexOf('\n', lastImportIndex) + 1;
      
      // Add badgeService import
      content = content.slice(0, lastImportEnd) + 
                "import { badgeService } from '@/services/badgeService';\n" + 
                content.slice(lastImportEnd);
      importsAdded = true;
    }
    
    // Check for useAuth import if needed
    if (content.includes('const { user } = useAuth();') && !content.includes('import useAuth')) {
      // Find the last import
      const lastImportIndex = content.lastIndexOf('import ');
      const lastImportEnd = content.indexOf('\n', lastImportIndex) + 1;
      
      // Add useAuth import
      content = content.slice(0, lastImportEnd) + 
                "import useAuth from '@/context/AuthContext';\n" + 
                content.slice(lastImportEnd);
      importsAdded = true;
    }
    
    fs.writeFileSync(formPath, content);
    console.log(colors.green('✓ Successfully added audit badge activity recording!'));
    
    if (importsAdded) {
      console.log(colors.green('✓ Added necessary imports for badge integration.'));
    }
    
    return true;
  } catch (error) {
    console.error(colors.red('Error updating EnergyAuditForm:'), error);
    return false;
  }
};

// Helper function to find the matching closing bracket
const findMatchingClosingBracket = (content, openBracket, closeBracket, openingIndex) => {
  let depth = 1;
  let i = openingIndex + 1;
  
  while (i < content.length && depth > 0) {
    if (content[i] === openBracket) {
      depth++;
    } else if (content[i] === closeBracket) {
      depth--;
    }
    
    if (depth === 0) {
      return i;
    }
    
    i++;
  }
  
  return -1;
};

// 3. Update UserDashboardPage to evaluate audit badges based on stats
const updateUserDashboardPage = () => {
  console.log('Updating UserDashboardPage to evaluate audit badges...');
  
  // Check if UserDashboardPage.tsx exists
  let dashboardPath = path.resolve('src/pages/UserDashboardPage.tsx');
  if (!fs.existsSync(dashboardPath)) {
    console.log(colors.yellow('UserDashboardPage.tsx not found, checking NewUserDashboardPage.tsx...'));
    
    dashboardPath = path.resolve('src/pages/NewUserDashboardPage.tsx');
    if (!fs.existsSync(dashboardPath)) {
      console.error(colors.red('Could not find dashboard page. Please check your project structure.'));
      return false;
    }
  }
  
  try {
    let content = fs.readFileSync(dashboardPath, 'utf8');
    
    // Check if audit badge evaluation is already there
    if (content.includes('audits_count_check') || content.includes('audit_count_check') || 
        content.includes('auditCount')) {
      console.log(colors.yellow('Audit badge evaluation already exists in dashboard. Skipping update.'));
      return true;
    }
    
    // Find a good place to add the evaluation - look for useEffect hooks
    let insertPoint;
    
    // Look for fetchDashboardData useEffect
    const fetchEffectIndex = content.indexOf('useEffect');
    if (fetchEffectIndex !== -1) {
      // Find the end of the useEffect
      const effectEndIndex = content.indexOf('}, [', fetchEffectIndex);
      if (effectEndIndex !== -1) {
        // Insert after this useEffect
        insertPoint = content.indexOf(';', effectEndIndex);
        if (insertPoint === -1) {
          insertPoint = content.indexOf('\n', effectEndIndex) + 1;
        } else {
          insertPoint += 1;
        }
      }
    }
    
    if (!insertPoint) {
      // If we couldn't find a good spot, try to insert at component end
      const componentEndIndex = content.lastIndexOf('export default');
      if (componentEndIndex !== -1) {
        // Find the line above export default
        insertPoint = content.lastIndexOf('\n', componentEndIndex) + 1;
      } else {
        console.error(colors.red('Could not find appropriate insertion point for audit badge evaluation.'));
        return false;
      }
    }
    
    // Format with proper indentation
    const indentation = getIndentation(content, insertPoint);
    const badgeEvalCode = `\n${indentation}// Effect to evaluate badges based on dashboard stats\n` +
                  `${indentation}useEffect(() => {\n` +
                  `${indentation}  if (isAuthenticated && stats && !isLoading) {\n` +
                  `${indentation}    const evaluateBadgesFromStats = async () => {\n` +
                  `${indentation}      try {\n` +
                  `${indentation}        // Get user ID from auth context\n` +
                  `${indentation}        const { user } = useAuth();\n` +
                  `${indentation}        if (!user?.id) return;\n` +
                  `${indentation}        \n` +
                  `${indentation}        console.log('Evaluating badges from dashboard stats...');\n` +
                  `${indentation}        \n` +
                  `${indentation}        // Trigger evaluation for audit count\n` +
                  `${indentation}        if (stats.completedAudits && stats.completedAudits > 0) {\n` +
                  `${indentation}          await badgeService.recordActivity(user.id, 'audits_count_check', {\n` +
                  `${indentation}            count: stats.completedAudits,\n` +
                  `${indentation}            timestamp: new Date().toISOString()\n` +
                  `${indentation}          });\n` +
                  `${indentation}          console.log('Evaluated badge status for audit count:', stats.completedAudits);\n` +
                  `${indentation}        }\n` +
                  `${indentation}      } catch (error) {\n` +
                  `${indentation}        // Don't let badge evaluation errors affect dashboard operation\n` +
                  `${indentation}        console.error('Error evaluating badges from dashboard stats:', error);\n` +
                  `${indentation}      }\n` +
                  `${indentation}    };\n` +
                  `${indentation}    \n` +
                  `${indentation}    evaluateBadgesFromStats();\n` +
                  `${indentation}  }\n` +
                  `${indentation}}, [isAuthenticated, stats, isLoading]);\n`;
    
    // Insert the badge evaluation code
    content = content.slice(0, insertPoint) + badgeEvalCode + content.slice(insertPoint);
    
    // Make sure badgeService and useAuth are imported
    let importsAdded = false;
    if (!content.includes('import { badgeService }')) {
      // Find the last import
      const lastImportIndex = content.lastIndexOf('import ');
      const lastImportEnd = content.indexOf('\n', lastImportIndex) + 1;
      
      // Add badgeService import
      content = content.slice(0, lastImportEnd) + 
                "import { badgeService } from '@/services/badgeService';\n" + 
                content.slice(lastImportEnd);
      importsAdded = true;
    }
    
    // Check for useAuth import
    if (!content.includes('import useAuth')) {
      // Find the last import
      const lastImportIndex = content.lastIndexOf('import ');
      const lastImportEnd = content.indexOf('\n', lastImportIndex) + 1;
      
      // Add useAuth import
      content = content.slice(0, lastImportEnd) + 
                "import useAuth from '@/context/AuthContext';\n" + 
                content.slice(lastImportEnd);
      importsAdded = true;
    }
    
    fs.writeFileSync(dashboardPath, content);
    console.log(colors.green('✓ Successfully added audit badge evaluation to dashboard!'));
    
    if (importsAdded) {
      console.log(colors.green('✓ Added necessary imports for badge evaluation.'));
    }
    
    return true;
  } catch (error) {
    console.error(colors.red('Error updating dashboard page:'), error);
    return false;
  }
};

// 4. Update backend badge service to include audit badge evaluation
const updateBackendBadgeService = () => {
  console.log('Updating backend badge service to evaluate audit badges...');
  
  // Check if the backend badge service file exists
  const backendServicePath = path.resolve('backend/src/services/BadgeService.ts');
  if (!fs.existsSync(backendServicePath)) {
    console.log(colors.yellow('Backend badge service not found. Skipping backend update.'));
    return true;
  }
  
  try {
    let content = fs.readFileSync(backendServicePath, 'utf8');
    
    // Check if audit badge evaluation already exists
    if (content.includes('evaluateAuditBadges')) {
      console.log(colors.yellow('Audit badge evaluation already exists in backend service. Checking implementation...'));
      
      // Make sure it has the correct thresholds
      if (!content.includes('BRONZE_THRESHOLD') || !content.includes('SILVER_THRESHOLD') || !content.includes('GOLD_THRESHOLD')) {
        console.log('Adding threshold constants to existing evaluation method...');
        
        // Find the method definition
        const methodIndex = content.indexOf('evaluateAuditBadges');
        if (methodIndex !== -1) {
          // Find method body opening brace
          const methodBodyStart = content.indexOf('{', methodIndex);
          if (methodBodyStart !== -1) {
            // Find method body's first line
            const firstLineStart = content.indexOf('\n', methodBodyStart) + 1;
            
            // Add threshold constants
            const indentation = getIndentation(content, firstLineStart);
            const thresholdsCode = `${indentation}// Audit badges thresholds\n` +
                           `${indentation}const BRONZE_THRESHOLD = 1;\n` +
                           `${indentation}const SILVER_THRESHOLD = 3;\n` +
                           `${indentation}const GOLD_THRESHOLD = 5;\n` +
                           `${indentation}const PLATINUM_THRESHOLD = 10;\n\n`;
            
            content = content.slice(0, firstLineStart) + thresholdsCode + content.slice(firstLineStart);
            fs.writeFileSync(backendServicePath, content);
            console.log(colors.green('✓ Added threshold constants to existing evaluation method!'));
          }
        }
      }
      
      return true;
    }
    
    // Need to add the evaluation method - find a good spot
    const classEndIndex = content.lastIndexOf('}');
    if (classEndIndex !== -1) {
      // Add before the closing brace of the class
      const indentation = getIndentation(content, classEndIndex);
      
      // Create the evaluation method
      const evaluationMethod = `\n${indentation}/**\n` +
                      `${indentation} * Evaluate badges based on audit count\n` +
                      `${indentation} * \n` +
                      `${indentation} * @param userId The user ID to evaluate badges for\n` +
                      `${indentation} * @param auditCount The current audit count\n` +
                      `${indentation} */\n` +
                      `${indentation}async evaluateAuditBadges(userId: string, auditCount: number) {\n` +
                      `${indentation}  try {\n` +
                      `${indentation}    console.log(\`Evaluating audit badges for user \${userId} with count \${auditCount}\`);\n` +
                      `${indentation}    \n` +
                      `${indentation}    // Audit badges thresholds\n` +
                      `${indentation}    const BRONZE_THRESHOLD = 1;\n` +
                      `${indentation}    const SILVER_THRESHOLD = 3;\n` +
                      `${indentation}    const GOLD_THRESHOLD = 5;\n` +
                      `${indentation}    const PLATINUM_THRESHOLD = 10;\n` +
                      `${indentation}    \n` +
                      `${indentation}    // Evaluate bronze (1 audit)\n` +
                      `${indentation}    if (auditCount >= BRONZE_THRESHOLD) {\n` +
                      `${indentation}      await this.awardBadgeIfNotEarned(userId, 'audit-bronze');\n` +
                      `${indentation}    }\n` +
                      `${indentation}    \n` +
                      `${indentation}    // Evaluate silver (3 audits)\n` +
                      `${indentation}    if (auditCount >= SILVER_THRESHOLD) {\n` +
                      `${indentation}      await this.awardBadgeIfNotEarned(userId, 'audit-silver');\n` +
                      `${indentation}    }\n` +
                      `${indentation}    \n` +
                      `${indentation}    // Evaluate gold (5 audits)\n` +
                      `${indentation}    if (auditCount >= GOLD_THRESHOLD) {\n` +
                      `${indentation}      await this.awardBadgeIfNotEarned(userId, 'audit-gold');\n` +
                      `${indentation}    }\n` +
                      `${indentation}    \n` +
                      `${indentation}    // Evaluate platinum (10 audits)\n` +
                      `${indentation}    if (auditCount >= PLATINUM_THRESHOLD) {\n` +
                      `${indentation}      await this.awardBadgeIfNotEarned(userId, 'audit-platinum');\n` +
                      `${indentation}    }\n` +
                      `${indentation}    \n` +
                      `${indentation}    return true;\n` +
                      `${indentation}  } catch (error) {\n` +
                      `${indentation}    console.error(\`Error evaluating audit badges for user \${userId}:\`, error);\n` +
                      `${indentation}    return false;\n` +
                      `${indentation}  }\n` +
                      `${indentation}}\n`;
      
      // Add the helper method for awarding badges if it doesn't exist
      if (!content.includes('awardBadgeIfNotEarned')) {
        const helperMethod = `\n${indentation}/**\n` +
                   `${indentation} * Award a badge if not already earned\n` +
                   `${indentation} * \n` +
                   `${indentation} * @param userId The user ID to award the badge to\n` +
                   `${indentation} * @param badgeId The badge ID to award\n` +
                   `${indentation} * @returns True if badge was awarded, false if already earned\n` +
                   `${indentation} */\n` +
                   `${indentation}private async awardBadgeIfNotEarned(userId: string, badgeId: string): Promise<boolean> {\n` +
                   `${indentation}  try {\n` +
                   `${indentation}    // Check if user already has the badge\n` +
                   `${indentation}    const userBadge = await this.getBadge(userId, badgeId);\n` +
                   `${indentation}    \n` +
                   `${indentation}    // If badge exists and is already earned, do nothing\n` +
                   `${indentation}    if (userBadge && userBadge.earned) {\n` +
                   `${indentation}      console.log(\`User \${userId} already earned badge \${badgeId}\`);\n` +
                   `${indentation}      return false;\n` +
                   `${indentation}    }\n` +
                   `${indentation}    \n` +
                   `${indentation}    // Award the badge\n` +
                   `${indentation}    console.log(\`Awarding badge \${badgeId} to user \${userId}\`);\n` +
                   `${indentation}    await this.awardBadge(userId, badgeId);\n` +
                   `${indentation}    return true;\n` +
                   `${indentation}  } catch (error) {\n` +
                   `${indentation}    console.error(\`Error awarding badge \${badgeId} to user \${userId}:\`, error);\n` +
                   `${indentation}    return false;\n` +
                   `${indentation}  }\n` +
                   `${indentation}}\n`;
        
        content = content.slice(0, classEndIndex) + evaluationMethod + helperMethod + content.slice(classEndIndex);
      } else {
        content = content.slice(0, classEndIndex) + evaluationMethod + content.slice(classEndIndex);
      }
      
      fs.writeFileSync(backendServicePath, content);
      console.log(colors.green('✓ Successfully added audit badge evaluation method to backend service!'));
      return true;
    }
    
    console.error(colors.red('Could not find appropriate position to add evaluation method.'));
    return false;
  } catch (error) {
    console.error(colors.red('Error updating backend badge service:'), error);
    return false;
  }
};

// 5. Update backend controller to handle audit badge activities
const updateBackendController = () => {
  console.log('Updating backend badge controller to handle audit activities...');
  
  // Check if controller exists
  const controllerPath = path.resolve('backend/src/controllers/BadgeController.ts');
  if (!fs.existsSync(controllerPath)) {
    console.log(colors.yellow('Backend badge controller not found. Skipping controller update.'));
    return true;
  }
  
  try {
    let content = fs.readFileSync(controllerPath, 'utf8');
    
    // Check if audit activity handling already exists
    if (content.includes('audit_completed') || content.includes('audits_count_check')) {
      console.log(colors.yellow('Audit activity handling already exists in controller. Skipping update.'));
      return true;
    }
    
    // Look for the activity handler - should be a switch statement or similar
    const activityHandlerIndex = content.indexOf('switch') && content.indexOf('activityType');
    if (activityHandlerIndex !== -1) {
      // Find the switch statement
      const switchIndex = content.indexOf('switch', activityHandlerIndex);
      if (switchIndex !== -1) {
        // Find the default case
        const defaultCaseIndex = content.indexOf('default:', switchIndex);
        if (defaultCaseIndex !== -1) {
          // Insert before the default case
          const indentation = getIndentation(content, defaultCaseIndex);
          
          // Create the new case handlers
          const caseHandlers = `${indentation}case 'audit_completed':\n` +
                     `${indentation}  // Handle audit completion - increment count and evaluate badges\n` +
                     `${indentation}  await this.badgeService.evaluateAuditBadges(userId, 1);\n` +
                     `${indentation}  break;\n` +
                     `\n` +
                     `${indentation}case 'audits_count_check':\n` +
                     `${indentation}  // Handle audit count check from dashboard\n` +
                     `${indentation}  const auditCount = metadata.count || 0;\n` +
                     `${indentation}  await this.badgeService.evaluateAuditBadges(userId, auditCount);\n` +
                     `${indentation}  break;\n` +
                     `\n`;
          
          content = content.slice(0, defaultCaseIndex) + caseHandlers + content.slice(defaultCaseIndex);
          fs.writeFileSync(controllerPath, content);
          console.log(colors.green('✓ Successfully added audit activity handlers to controller!'));
          return true;
        }
      }
    }
    
    console.log(colors.yellow('Could not find activity handler switch statement in controller. Trying alternate approach...'));
    
    // If no switch statement found, try to locate a recordActivity method
    const recordActivityIndex = content.indexOf('recordActivity');
    if (recordActivityIndex !== -1) {
      // Find method body
      const methodBodyStart = content.indexOf('{', recordActivityIndex);
      if (methodBodyStart !== -1) {
        // Find a good insertion point - after the first few lines
        let insertPoint = content.indexOf('\n', methodBodyStart);
        for (let i = 0; i < 3; i++) {
          insertPoint = content.indexOf('\n', insertPoint + 1);
        }
        
        if (insertPoint !== -1) {
          const indentation = getIndentation(content, insertPoint + 1);
          
          // Create the custom handler code
          const customHandler = `\n${indentation}// Handle audit-specific activity types\n` +
                      `${indentation}if (activityType === 'audit_completed') {\n` +
                      `${indentation}  // Trigger audit badge evaluation\n` +
                      `${indentation}  await this.badgeService.evaluateAuditBadges(userId, 1);\n` +
                      `${indentation}} else if (activityType === 'audits_count_check') {\n` +
                      `${indentation}  // Handle audit count check from dashboard\n` +
                      `${indentation}  const auditCount = metadata.count || 0;\n` +
                      `${indentation}  await this.badgeService.evaluateAuditBadges(userId, auditCount);\n` +
                      `${indentation}}\n`;
          
          content = content.slice(0, insertPoint + 1) + customHandler + content.slice(insertPoint + 1);
          fs.writeFileSync(controllerPath, content);
          console.log(colors.green('✓ Successfully added audit activity handling to controller!'));
          return true;
        }
      }
    }
    
    console.error(colors.red('Could not find appropriate place to add audit activity handling in controller.'));
    return false;
  } catch (error) {
    console.error(colors.red('Error updating badge controller:'), error);
    return false;
  }
};

// Main function to run all the updates
const main = async () => {
  console.log(colors.cyan('Starting audit badges fix deployment...'));
  
  // Step 1: Update badge definitions
  const badgeDefsUpdated = updateBadgeDefinitions();
  
  // Step 2: Update EnergyAuditForm
  const formUpdated = updateEnergyAuditForm();
  
  // Step 3: Update UserDashboardPage
  const dashboardUpdated = updateUserDashboardPage();
  
  // Step 4: Update backend badge service
  const backendServiceUpdated = updateBackendBadgeService();
  
  // Step 5: Update backend controller
  const backendControllerUpdated = updateBackendController();
  
  // Report results
  console.log('\n' + colors.cyan('Deployment Results:'));
  console.log(colors.cyan('- Badge Definitions Update: ') + (badgeDefsUpdated ? colors.green('✓ Success') : colors.red('✗ Failed')));
  console.log(colors.cyan('- Energy Audit Form Update: ') + (formUpdated ? colors.green('✓ Success') : colors.red('✗ Failed')));
  console.log(colors.cyan('- Dashboard Page Update: ') + (dashboardUpdated ? colors.green('✓ Success') : colors.red('✗ Failed')));
  console.log(colors.cyan('- Backend Service Update: ') + (backendServiceUpdated ? colors.green('✓ Success') : colors.red('✗ Failed')));
  console.log(colors.cyan('- Backend Controller Update: ') + (backendControllerUpdated ? colors.green('✓ Success') : colors.red('✗ Failed')));
  
  const allSuccessful = badgeDefsUpdated && formUpdated && dashboardUpdated && 
                       (backendServiceUpdated || !fs.existsSync(path.resolve('backend/src/services/BadgeService.ts'))) &&
                       (backendControllerUpdated || !fs.existsSync(path.resolve('backend/src/controllers/BadgeController.ts')));
  
  if (allSuccessful) {
    console.log('\n' + colors.green('Audit badges fix deployed successfully!'));
    console.log(colors.green('The system will now properly define and track audit badges.'));
    console.log(colors.yellow('Next steps:'));
    console.log(colors.yellow('1. Run the SQL script to add missing badges for existing users with audits:'));
    console.log(colors.yellow('   - Connect to your database and run scripts/audit_badges_fix.sql'));
    console.log(colors.yellow('2. Deploy these changes to your environment using git push and Heroku deploy'));
    console.log(colors.yellow('3. Test the system by loading the dashboard and verifying badge status'));
  } else {
    console.log('\n' + colors.red('Audit badges fix deployment had issues.'));
    console.log(colors.yellow('Please check the logs above and fix any errors before deploying.'));
  }
};

// Run the main function
main();
