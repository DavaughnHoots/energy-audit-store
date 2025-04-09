import React from 'react';
import BadgesTabComponent from '../badges/BadgesTab';

/**
 * Wrapper for the BadgesTab component to be used in the dashboard
 * This allows the BadgesTab to be exported from the dashboard2 directory
 */
const BadgesTab: React.FC = () => {
  return <BadgesTabComponent />;
};

export default BadgesTab;
