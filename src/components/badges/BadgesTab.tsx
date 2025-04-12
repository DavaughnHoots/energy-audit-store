import React from 'react';
import RealBadgesTabFixed from './RealBadgesTab.fixed';

/**
 * Main tab component that displays the user's badge collection and level progress
 * This component now uses the fixed implementation with advanced badge rendering
 */
const BadgesTab: React.FC = () => {
  // Now using the fixed implementation that properly handles badge display
  return <RealBadgesTabFixed />;
};

export default BadgesTab;
