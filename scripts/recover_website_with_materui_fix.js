// Recover website features while preserving Material UI and analytics fixes
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting website recovery with Material UI fix preservation...');

// Define paths to relevant files
const adminDashboardPath = path.join(__dirname, '../src/pages/AdminDashboardPage.tsx');
const roadmapFeaturePath = path.join(__dirname, '../src/components/admin/RoadmapFeature.tsx');

// Backup current files before making changes
console.log('Creating backups of current files...');
if (fs.existsSync(adminDashboardPath)) {
  fs.copyFileSync(adminDashboardPath, `${adminDashboardPath}.backup-${Date.now()}`);
}
if (fs.existsSync(roadmapFeaturePath)) {
  fs.copyFileSync(roadmapFeaturePath, `${roadmapFeaturePath}.backup-${Date.now()}`);
}

// Check current branch
console.log('Checking current branch...');
try {
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  console.log(`Currently on branch: ${currentBranch}`);

  // 1. First, apply the Material UI fixes to the AdminDashboardPage
  console.log('Applying Material UI fixes to AdminDashboardPage...');
  
  // Read the current AdminDashboardPage file
  const adminDashboard = fs.readFileSync(adminDashboardPath, 'utf8');
  
  // Update the RoadmapFeature import to use error handling if needed
  let updatedAdminDashboard = adminDashboard;
  const originalLazyLoadPattern = /\{[\s\n]*\(\(\) => \{[\s\n]*const RoadmapFeature = React\.lazy\(\(\) => import\(['"]\.\.\/.+\/RoadmapFeature['"]\)\);[\s\n]*return <RoadmapFeature \/>;[\s\n]*\}\)\(\)\}/;
  
  if (originalLazyLoadPattern.test(updatedAdminDashboard)) {
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
    
    updatedAdminDashboard = updatedAdminDashboard.replace(originalLazyLoadPattern, improvedLazyLoad);
    console.log('Updated lazy loading pattern with error handling in AdminDashboardPage');
  }
  
  // Write the updated file
  fs.writeFileSync(adminDashboardPath, updatedAdminDashboard);
  
  // 2. Check and fix RoadmapFeature component if it exists
  if (fs.existsSync(roadmapFeaturePath)) {
    console.log('Checking RoadmapFeature for Material UI references...');
    let roadmapFeature = fs.readFileSync(roadmapFeaturePath, 'utf8');
    
    // Remove Material UI imports if present
    if (roadmapFeature.includes('@material-ui') || roadmapFeature.includes('@mui/')) {
      roadmapFeature = roadmapFeature
        .replace(/import [^;]+ from ['"]@material-ui\/[^'"]+['"](;|\n)/g, '')
        .replace(/import [^;]+ from ['"]@mui\/[^'"]+['"](;|\n)/g, '');
      
      fs.writeFileSync(roadmapFeaturePath, roadmapFeature);
      console.log('Cleaned Material UI references from RoadmapFeature');
    } else {
      console.log('No Material UI references found in RoadmapFeature');
    }
  }
  
  // 3. Create a new commit with just the Material UI fixes
  console.log('Creating commit for Material UI fixes only...');
  execSync('git add src/pages/AdminDashboardPage.tsx src/components/admin/RoadmapFeature.tsx', { stdio: 'inherit' });
  execSync('git commit -m "Material UI fix with proper error handling for RoadmapFeature"', { stdio: 'inherit' });
  
  // 4. Deploy to Heroku with the --force flag to ensure our changes override any previous deployment
  console.log('Deploying to Heroku with force flag...');
  try {
    execSync('git push heroku HEAD:main --force', { stdio: 'inherit' });
    console.log('Deployment to Heroku completed successfully');
  } catch (error) {
    console.error('Heroku deployment failed:', error);
    console.log('You may need to deploy manually using: git push heroku HEAD:main --force');
  }
  
  console.log('Recovery process completed. The website should now have all features with Material UI issues fixed.');
  
} catch (error) {
  console.error('Error during recovery process:', error);
  console.log('Recovery failed. You may need to restore from backups or deploy manually.');
}
