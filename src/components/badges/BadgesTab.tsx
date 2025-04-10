import React from 'react';
import RealBadgesTab from './RealBadgesTab';

/**
 * Main tab component that displays the user's badge collection and level progress
 * This component now uses the real badge data from the API
 */
const BadgesTab: React.FC = () => {
  // Now using the real implementation that fetches data from the API
  return <RealBadgesTab />;
};

export default BadgesTab;
