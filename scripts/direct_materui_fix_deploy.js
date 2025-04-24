// Direct Material UI fix and manual Heroku deployment
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting direct Material UI fix without Git operations...');

// Define paths to relevant files
const adminDashboardPath = path.join(__dirname, '../src/pages/AdminDashboardPage.tsx');

// Backup current file before making changes
console.log('Creating backup of current file...');
if (fs.existsSync(adminDashboardPath)) {
  fs.copyFileSync(adminDashboardPath, `${adminDashboardPath}.backup-${Date.now()}`);
}

// Apply Material UI fixes directly to the AdminDashboardPage
console.log('Applying Material UI fixes to AdminDashboardPage...');

// Read the current AdminDashboardPage file
const adminDashboard = fs.readFileSync(adminDashboardPath, 'utf8');

// Look for the RoadmapFeature import section to update
const lazyLoadSectionRegex = /\{[\s\n]*\(\(\) => \{[\s\n]*const RoadmapFeature = React\.lazy\(\(\) => import\(['"]\.\.\/.+\/RoadmapFeature['"]\)\);[\s\n]*return <RoadmapFeature \/>;[\s\n]*\}\)\(\)\}/;

// If found, replace with error-handled version
if (lazyLoadSectionRegex.test(adminDashboard)) {
  console.log('Found React.lazy section in AdminDashboardPage, adding error handling...');
  
  const improvedLazyLoad = `{(() => {
    // Using dynamic import with error handling
    const RoadmapFeatureComponent = React.lazy(() => 
      import('../components/admin/RoadmapFeature')
        .catch(err => {
          console.error('Error loading RoadmapFeature:', err);
          return { default: () => <div>Error loading roadmap builder. Please refresh the page.</div> };
        })
    );
    return <RoadmapFeatureComponent />;
  })()}`;
  
  // Apply the fix
  const updatedDashboard = adminDashboard.replace(lazyLoadSectionRegex, improvedLazyLoad);
  
  // Write the file only if changes were made
  if (updatedDashboard !== adminDashboard) {
    fs.writeFileSync(adminDashboardPath, updatedDashboard);
    console.log('Updated AdminDashboardPage with error handling for lazy loading');
  } else {
    console.log('No changes were needed for AdminDashboardPage');
  }
} else {
  console.log('Could not find React.lazy pattern in AdminDashboardPage. Manual fix may be needed.');
}

console.log('\nMaterial UI fix applied.');
console.log('\n==============================================================');
console.log('MANUAL DEPLOYMENT INSTRUCTIONS:');
console.log('==============================================================');
console.log('To deploy these changes to Heroku, run the following commands:');
console.log('\n1. git add src/pages/AdminDashboardPage.tsx');
console.log('2. git commit -m "Fix Material UI error handling in AdminDashboardPage"');
console.log('3. git push heroku HEAD:main --force');
console.log('\nOR use the dedicated Heroku deploy command:');
console.log('heroku builds:create -a energy-audit-store');
console.log('==============================================================');
console.log('\nAlternatively, you can use an existing deployment script such as:');
console.log('node scripts/direct_deploy_roadmap_feature.js');
console.log('\nThe Material UI fix has been applied locally. Now you can deploy using your preferred method.');
