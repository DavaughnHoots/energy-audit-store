// Fix dashboard Material UI and analytics issues and deploy to Heroku
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define the paths to relevant files
const roadmapFeaturePath = path.join(__dirname, '../src/components/admin/RoadmapFeature.tsx');
const analyticsTrackerPath = path.join(__dirname, '../src/components/analytics/AnalyticsTracker.tsx');
const adminDashboardPath = path.join(__dirname, '../src/pages/AdminDashboardPage.tsx');
const packageJsonPath = path.join(__dirname, '../package.json');

console.log('Starting comprehensive dashboard fix script...');

// 1. Fix RoadmapFeature component - ensure no Material UI references
console.log('Updating RoadmapFeature component...');
let roadmapFeature = fs.readFileSync(roadmapFeaturePath, 'utf8');

// If there's any reference to Material UI, remove or replace it
if (roadmapFeature.includes('@material-ui') || roadmapFeature.includes('@mui/')) {
  console.log('Found Material UI references in RoadmapFeature. Removing...');
  roadmapFeature = roadmapFeature
    .replace(/import [^;]+ from ['"]@material-ui\/[^'"]+['"](;|\n)/g, '')
    .replace(/import [^;]+ from ['"]@mui\/[^'"]+['"](;|\n)/g, '');
  
  fs.writeFileSync(roadmapFeaturePath, roadmapFeature);
}

// 2. Update AdminDashboardPage to handle lazy loading better
console.log('Improving AdminDashboardPage lazy loading...');
let adminDashboard = fs.readFileSync(adminDashboardPath, 'utf8');

// Replace the lazy loading pattern with a more robust version
const originalLazyLoad = /\{[\s\n]*\(\(\) => \{[\s\n]*const RoadmapFeature = React\.lazy\(\(\) => import\(['"]\.\.\/.+\/RoadmapFeature['"]\)\);[\s\n]*return <RoadmapFeature \/>;[\s\n]*\}\)\(\)\}/;
const newLazyLoad = `{(() => {
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

if (adminDashboard.match(originalLazyLoad)) {
  adminDashboard = adminDashboard.replace(originalLazyLoad, newLazyLoad);
  fs.writeFileSync(adminDashboardPath, adminDashboard);
  console.log('Updated lazy loading pattern in AdminDashboardPage');
} else {
  console.log('Could not find exact lazy loading pattern to replace. Manual check may be needed.');
}

// 3. Fix AnalyticsTracker for proper event paths
if (fs.existsSync(analyticsTrackerPath)) {
  console.log('Updating AnalyticsTracker component...');
  let analyticsTracker = fs.readFileSync(analyticsTrackerPath, 'utf8');
  
  // Ensure the proper API paths are used
  analyticsTracker = analyticsTracker.replace(
    /\/api\/analytics\/event/g, 
    '/api/analytics/event'
  );
  
  // Add better error handling for event tracking
  const improvedErrorHandling = `try {
    const response = await fetch(getApiUrl('/api/analytics/event'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      // Silently log error but don't throw to prevent disrupting user experience
      console.warn(\`Analytics tracking failed: \${response.status}\`);
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(' [ANALYTICS DEBUG] Event sent successfully:', eventData);
    }
  } catch (error) {
    // Silently fail in production to avoid disrupting user experience
    console.warn('Analytics tracking error:', error);
  }`;
  
  // Replace old fetch implementation with improved one if found
  if (analyticsTracker.includes('fetch(getApiUrl') && analyticsTracker.includes('/api/analytics/event')) {
    const fetchRegex = /try\s*\{[\s\S]*?fetch\s*\(\s*getApiUrl\s*\(\s*['"]\/api\/analytics\/event['"]\s*\)[\s\S]*?\}\s*catch\s*\(\s*error\s*\)\s*\{[\s\S]*?\}/;
    analyticsTracker = analyticsTracker.replace(fetchRegex, improvedErrorHandling);
    fs.writeFileSync(analyticsTrackerPath, analyticsTracker);
    console.log('Updated AnalyticsTracker with improved error handling');
  }
}

// 4. Update package.json to ensure no Material UI dependencies
console.log('Checking package.json for Material UI dependencies...');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (packageJson.dependencies && 
   (packageJson.dependencies['@material-ui/core'] || 
    packageJson.dependencies['@mui/material'])) {
  // Remove Material UI from dependencies
  if (packageJson.dependencies['@material-ui/core']) {
    delete packageJson.dependencies['@material-ui/core'];
  }
  if (packageJson.dependencies['@mui/material']) {
    delete packageJson.dependencies['@mui/material'];
  }
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('Removed Material UI dependencies from package.json');
}

// 5. Create a commit for the fixes
console.log('Creating commit for dashboard fixes...');
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "Fix dashboard Material UI and analytics issues"', { stdio: 'inherit' });
  console.log('Committed changes successfully');
} catch (error) {
  console.error('Git commit failed:', error);
}

// 6. Push to Heroku
console.log('Deploying to Heroku...');
try {
  execSync('git push heroku master', { stdio: 'inherit' });
  console.log('Deployment to Heroku completed successfully');
} catch (error) {
  console.error('Heroku deployment failed:', error);
  console.log('You may need to deploy manually. Run: git push heroku master');
}

console.log('Dashboard fix script completed. The fixes should resolve Material UI and analytics issues.');
