/**
 * Helper file for badges system deployment
 * 
 * This file provides a list of files that should be included
 * in a manual git commit for the badges system deployment.
 */

const fs = require('fs');

// Print deployment instructions
console.log('=== BADGES SYSTEM DEPLOYMENT GUIDE ===');
console.log('To deploy the badges system, follow these manual steps:');
console.log('');
console.log('1. Add the following files to git:');
console.log('');

// Define all badge-related files
const badgeFiles = [
  // Components
  'src/components/badges/LevelProgressBar.tsx',
  'src/components/badges/BadgeProgressIndicator.tsx', 
  'src/components/badges/BadgesTab.tsx',
  'src/components/badges/BadgeCard.tsx',
  'src/components/badges/BadgeCollection.tsx',
  'src/components/badges/BadgeDetailModal.tsx',
  
  // Supporting files
  'src/data/badges.ts',
  'src/types/badges.ts',
  'src/hooks/useBadgeProgress.ts',
  'src/services/badgeService.ts',
  'src/utils/cn.ts',
  
  // Documentation
  'badges-system-implementation-summary.md',
  'energy-audit-vault/frontend/components/badges/BadgesTab.md',
  'energy-audit-vault/frontend/components/badges/BadgeProgressIndicator.md',
  'energy-audit-vault/data_flows/badge-achievement-flow.md'
];

// Check which files exist and print them
badgeFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   git add ${file}`);
  }
});

// Check for navigation integration files
if (fs.existsSync('src/components/dashboard2/SimpleDashboardLayout.tsx')) {
  console.log('   git add src/components/dashboard2/SimpleDashboardLayout.tsx');
}

if (fs.existsSync('src/App.tsx')) {
  console.log('   git add src/App.tsx');
}

console.log('');
console.log('2. Commit and push your changes:');
console.log('   git commit -m "Add badges and achievements system"');
console.log('   git push origin master');
console.log('');
console.log('3. Deploy to Heroku:');
console.log('   git push heroku master');
console.log('');
console.log('4. Verify the deployment:');
console.log('   Check the application at: https://energy-audit-store.herokuapp.com/');
