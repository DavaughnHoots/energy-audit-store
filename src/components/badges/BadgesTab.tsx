import React from 'react';
import RealBadgesTabBadgeEvalFix from './RealBadgesTab.badge-eval-fix';

/**
 * Main tab component that displays the user's badge collection and level progress
 * This component now uses the fixed implementation with advanced badge evaluation logic
 */
const BadgesTab: React.FC = () => {
  // Now using the evaluation-fixed implementation that properly handles badge statuses
  return <RealBadgesTabBadgeEvalFix />;
};

export default BadgesTab;