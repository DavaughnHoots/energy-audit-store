import React from 'react';
import { useUserBadges } from '../../hooks/useBadgeProgress';
import { Badge, UserBadge } from '../../types/badges';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * BadgeDiagnostics component
 * Shows raw badge data to help diagnose issues
 */
const BadgeDiagnostics: React.FC = () => {
  // Use the badge hook to fetch real data
  const { 
    loading, 
    error, 
    allBadges, 
    earnedBadges, 
    inProgressBadges, 
    lockedBadges,
    points,
    userBadges,
    refreshBadges
  } = useUserBadges();

  // If we're loading, show a loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
          <p className="text-gray-600">Loading badge diagnostics...</p>
        </div>
      </div>
    );
  }

  // If there's an error, show an error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 flex justify-center items-center min-h-[300px]">
        <div className="p-6 bg-red-50 rounded-lg text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Badges</h2>
          <p className="text-gray-700">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            onClick={() => refreshBadges()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate totals 
  const totalEarned = earnedBadges?.length || 0;
  const totalLocked = lockedBadges?.length || 0;
  const totalInProgress = inProgressBadges?.length || 0;
  const totalBadges = allBadges?.length || 0;
  
  // Sort by section
  const safeBadges = userBadges || {};
  const safeAllBadges = allBadges || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Badge Diagnostics</h1>
      
      {/* Summary counts */}
      <div className="p-4 bg-gray-50 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Badge Counts</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-500">Total Badges</p>
            <p className="text-2xl font-bold">{totalBadges}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-500">Earned</p>
            <p className="text-2xl font-bold">{totalEarned}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold">{totalInProgress}</p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <p className="text-sm text-gray-500">Locked</p>
            <p className="text-2xl font-bold">{totalLocked}</p>
          </div>
        </div>
      </div>

      {/* User points section */}
      <div className="p-4 bg-gray-50 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">User Points Data</h2>
        <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
          <pre className="text-sm">{JSON.stringify(points, null, 2)}</pre>
        </div>
      </div>

      {/* All Badges section */}
      <div className="p-4 bg-gray-50 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">All Badge Definitions ({safeAllBadges.length})</h2>
        <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
          <pre className="text-sm">{JSON.stringify(safeAllBadges, null, 2)}</pre>
        </div>
      </div>

      {/* User Badges section */}
      <div className="p-4 bg-gray-50 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">User Badges Structure</h2>
        <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
          <p className="mb-2 text-sm">Type: {typeof userBadges}</p>
          <p className="mb-2 text-sm">Is Array: {Array.isArray(userBadges) ? 'Yes' : 'No'}</p>
          <p className="mb-2 text-sm">Keys: {userBadges ? Object.keys(safeBadges).join(', ') : 'None'}</p>
          <pre className="text-sm">{JSON.stringify(safeBadges, null, 2)}</pre>
        </div>
      </div>

      {/* Earned Badges section */}
      <div className="p-4 bg-gray-50 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Earned Badges Raw Data ({totalEarned})</h2>
        <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
          <pre className="text-sm">{JSON.stringify(earnedBadges, null, 2)}</pre>
        </div>
      </div>

      {/* In Progress Badges section */}
      <div className="p-4 bg-gray-50 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">In Progress Badges Raw Data ({totalInProgress})</h2>
        <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
          <pre className="text-sm">{JSON.stringify(inProgressBadges, null, 2)}</pre>
        </div>
      </div>

      {/* Locked Badges section */}
      <div className="p-4 bg-gray-50 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Locked Badges Raw Data ({totalLocked})</h2>
        <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
          <pre className="text-sm">{JSON.stringify(lockedBadges, null, 2)}</pre>
        </div>
      </div>

      {/* API Response structure */}
      <div className="p-4 bg-gray-50 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Common Badge Data Issues</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Empty Object</strong>: userBadges is an empty object ({})</li>
            <li><strong>Wrong Format</strong>: Data structure is Array instead of Object</li>
            <li><strong>Key Issues</strong>: Badge IDs don't match between userBadges and allBadges</li>
            <li><strong>Missing Properties</strong>: earned or progress properties missing</li>
            <li><strong>Category Issues</strong>: Category names are case-sensitive</li>
          </ul>
        </div>
      </div>

      {/* Refresh button */}
      <div className="mt-6 text-center">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          onClick={() => refreshBadges()}
        >
          Refresh Badge Data
        </button>
      </div>
    </div>
  );
};

export default BadgeDiagnostics;