/**
 * Force Render Fix for Badge Loading
 * Adds a timeout mechanism to the SynchronizedBadgesTab component
 * This forces the UI to render after a timeout even if allBadges or readyToRender checks fail
 */

const fs = require('fs');
const path = require('path');

// Path to the component file
const filePath = path.join(process.cwd(), 'src/components/badges/SynchronizedBadgesTab.tsx');

// Read the file
console.log(`Reading ${filePath}...`);
let content = fs.readFileSync(filePath, 'utf8');

// Add force render state
content = content.replace(
  'const [readyToRender, setReadyToRender] = useState<boolean>(false);',
  'const [readyToRender, setReadyToRender] = useState<boolean>(false);\n  const [forceRender, setForceRender] = useState<boolean>(false);'
);

// Add force render timeout hook
const forceRenderHook = `
  // Force render after 5 seconds to avoid infinite loading state
  useEffect(() => {
    console.log("⚠️ Setting up force render timeout");
    const timer = setTimeout(() => {
      if (!readyToRender) {
        console.log("⚠️ Force rendering after timeout - current state:", {
          loading,
          allBadgesExists: !!allBadges,
          allBadgesIsArray: Array.isArray(allBadges),
          allBadgesLength: Array.isArray(allBadges) ? allBadges.length : 'N/A',
          earnedBadgesExists: !!earnedBadges,
          dashboardDataExists: !!dashboardData,
          readyToRender
        });
        setForceRender(true);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [loading, allBadges, earnedBadges, readyToRender]);
`;

// Add the force render hook after the existing useEffect
content = content.replace(
  /\/\/\s*Prepare the badge data for display after loading is done\s*useEffect\([^;]+;/s,
  match => match + forceRenderHook
);

// Modify the loading condition to also check for forceRender
content = content.replace(
  'if (loading) {',
  'if (loading && !forceRender) {'
);

// Modify the readyToRender condition to also check for forceRender
content = content.replace(
  'if (!readyToRender) {',
  'if (!readyToRender && !forceRender) {'
);

// Add force render banner to the component render
const forceRenderBanner = `
  // If we're forcing render, show a banner warning
  const renderingMode = forceRender && !readyToRender ? (
    <div className="mb-6 p-3 bg-amber-50 rounded-lg text-sm flex items-center">
      <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
      <div>
        <span className="font-semibold">Partial data mode:</span> Some achievement data may be incomplete. 
        <button 
          onClick={() => refreshBadges()} 
          className="ml-2 text-blue-600 underline"
        >
          Refresh
        </button>
      </div>
    </div>
  ) : null;
`;

content = content.replace(
  '{/* Dashboard data banner - updated to handle estimated data */}',
  `{/* Force rendering banner if needed */}\n      {renderingMode}\n      \n      {/* Dashboard data banner - updated to handle estimated data */}`
);

// Insert the renderingMode constant definition before the return statement
const returnStartPattern = /\s*return \(\s*<div className="max-w-6xl mx-auto px-4 py-6">/;
content = content.replace(returnStartPattern, match => {
  return forceRenderBanner + match;
});

// Add forceRender to debug info
content = content.replace(
  '{dashboardData && <p><strong>Estimated Data:</strong> {isEstimatedData ? \'Yes\' : \'No\'}</p>}',
  '{dashboardData && <p><strong>Estimated Data:</strong> {isEstimatedData ? \'Yes\' : \'No\'}</p>}\n              <p><strong>Force Render:</strong> {forceRender ? \'Yes\' : \'No\'}</p>'
);

// Add readyToRender to debug info
content = content.replace(
  '{earnedBadges && earnedBadges.length > 0 && <p><strong>Sample Badge ID:</strong> {earnedBadges[0]?.badgeId}</p>}',
  '{earnedBadges && earnedBadges.length > 0 && <p><strong>Sample Badge ID:</strong> {earnedBadges[0]?.badgeId}</p>}\n              <p><strong>Ready to Render:</strong> {readyToRender ? \'Yes\' : \'No\'}</p>'
);

// Adjust the condition for setting readyToRender to be more relaxed
content = content.replace(
  'if (!loading && allBadges && allBadges.length > 0) {',
  'if (!loading && userBadges) {'
);

// Update the logging to include more diagnostic info
content = content.replace(
  'console.log("🔄 Ready to render badges", {',
  'console.log("🔄 Ready to render badges - data check:", {'
);

content = content.replace(
  'allBadgesCount: allBadges?.length || 0,',
  'allBadgesExists: !!allBadges,\n        allBadgesIsArray: Array.isArray(allBadges),\n        allBadgesCount: Array.isArray(allBadges) ? allBadges.length : 0,'
);

// Add userBadgesType to the logging
content = content.replace(
  'dashboardEstimated: dashboardData?.estimated || false',
  'dashboardEstimated: dashboardData?.estimated || false,\n        userBadgesType: typeof userBadges'
);

// Write the updated file
console.log('Writing updated component...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('SynchronizedBadgesTab.tsx has been updated with force render timeout!');
console.log('This will prevent the UI from getting stuck in loading state.');
