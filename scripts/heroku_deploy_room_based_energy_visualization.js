/**
 * Deployment script for room-based energy consumption visualization
 * 
 * This deployment updates the dashboard to show energy consumption by room (Living Room, Kitchen, etc.)
 * instead of the abstract categories (Base, Seasonal, etc.) to make the data more intuitive for users.
 */

const { execSync } = require('child_process');

console.log('🚀 Starting deployment of room-based energy visualization...');

try {
  // Push code to GitHub
  console.log('🔄 Pushing code to GitHub...');
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "Add room-based energy consumption visualization to dashboard"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ Successfully pushed code to GitHub');

  // Deploy to Heroku
  console.log('🔄 Deploying to Heroku...');
  execSync('git push heroku main', { stdio: 'inherit' });
  console.log('✅ Successfully deployed to Heroku');

  console.log('\n🎉 Room-based energy visualization has been successfully deployed!');
  console.log('\nKey changes:');
  console.log('1. Added room-based energy consumption visualization to the dashboard');
  console.log('2. Implemented toggle between technical and room-based views');
  console.log('3. Added room-specific color coding and tooltips for better understanding');
  console.log('4. Created comprehensive documentation for the implementation');
  
  console.log('\nThis update makes energy consumption data more intuitive and actionable');
  console.log('for users by showing consumption by familiar room categories instead of');
  console.log('technical categories that may be difficult to understand.');

} catch (error) {
  console.error('❌ Deployment failed', error);
  process.exit(1);
}
