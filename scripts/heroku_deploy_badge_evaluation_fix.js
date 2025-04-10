const fs = require('fs');
const path = require('path');
const { green, yellow, red, bold } = require('picocolors');

// ----- Badge Evaluation Fix -----
// This script adds badge evaluation on dashboard load to ensure
// existing user counts (audits, implementations, savings) trigger
// the appropriate badges, fixing the issue where badges aren't
// earned despite having high activity counts.

console.log(green(bold('Badge Evaluation Fix Deployment')));
console.log(yellow('This script will add badge evaluation logic to the dashboard'));

// Update UserDashboardPage.tsx to add badge evaluation
const addDashboardBadgeEvaluation = () => {
    console.log('Adding badge evaluation to UserDashboardPage.tsx...');

    // Check if UserDashboardPage.tsx exists
    let userDashboardPath = path.resolve('src/pages/UserDashboardPage.tsx');
    if (!fs.existsSync(userDashboardPath)) {
        console.log(yellow('UserDashboardPage.tsx not found, checking NewUserDashboardPage.tsx...'));
        userDashboardPath = path.resolve('src/pages/NewUserDashboardPage.tsx');

        if (!fs.existsSync(userDashboardPath)) {
            console.error(red('Could not find dashboard page file. Please check the repository structure.'));
            return false;
        }
    }

    console.log(`Found dashboard file at: ${userDashboardPath}`);

    try {
        // Read the file
        let dashboardContent = fs.readFileSync(userDashboardPath, 'utf8');

        // First, add the import for badgeService if it doesn't exist
        if (!dashboardContent.includes('import { badgeService }')) {
            console.log('Adding badgeService import...');

            // Find the last import statement to add our import after it
            const importSection = dashboardContent.match(/import.*?;(\r?\n|$)/g);
            if (importSection && importSection.length > 0) {
                const lastImport = importSection[importSection.length - 1];
                const lastImportIndex = dashboardContent.lastIndexOf(lastImport) + lastImport.length;

                // Add our import after the last import statement
                dashboardContent =
                    dashboardContent.slice(0, lastImportIndex) +
                    `\nimport { badgeService } from '../services/BadgeService';\n` +
                    dashboardContent.slice(lastImportIndex);
            } else {
              dashboardContent = `import { badgeService } from '../services/BadgeService';\n${dashboardContent}`
            }

            console.log('badgeService import added.');
        } else {
            console.log('badgeService import already exists, skipping.');
        }

      // Check if badge evaluation logic exists
        if (!dashboardContent.includes('await badgeService.evaluateBadges()')) {
            console.log('Adding badge evaluation call to useEffect...');
            const useEffectMatch = dashboardContent.match(/useEffect\s*\(\s*\(\s*\)\s*=>\s*\{/);

            if (useEffectMatch) {
                const useEffectStartIndex = useEffectMatch.index + useEffectMatch[0].length;
              const useEffectEndIndex = dashboardContent.indexOf('}', useEffectStartIndex)
              if(useEffectEndIndex !== -1){
                dashboardContent =
                dashboardContent.slice(0, useEffectEndIndex) +
                  `\n    await badgeService.evaluateBadges();\n` +
                  dashboardContent.slice(useEffectEndIndex);
              } else {
                  console.error(red("Could not add badge evaluation call, could not find the end of useEffect"));
                return false
              }


               console.log('Badge evaluation call added to useEffect.');
            } else {
                console.error(red('Could not find useEffect to inject badge evaluation logic.'));
                return false;
            }
        } else {
            console.log('Badge evaluation call already exists, skipping.');
        }



        // Write the modified content back to the file
        fs.writeFileSync(userDashboardPath, dashboardContent, 'utf8');
        console.log(green('UserDashboardPage.tsx updated with badge evaluation logic!'));
        return true;

    } catch (error) {
        console.error(red(`Error updating dashboard file: ${error.message}`));
      return false
    }
};
addDashboardBadgeEvaluation()