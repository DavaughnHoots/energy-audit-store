import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../../context/AnalyticsContext';
import AnalyticsConsentModal from '../common/AnalyticsConsentModal';

/**
 * Component responsible for managing analytics consent for the pilot study
 * Determines when to show the consent modal based on user status and consent state
 */
const PilotStudyConsentManager: React.FC = () => {
  const { consentStatus } = useAnalytics();
  const [showConsentModal, setShowConsentModal] = useState(false);
  
  // Check if user should be prompted for consent
  useEffect(() => {
    const isPilotStudy = process.env.REACT_APP_PILOT_STUDY === 'true';
    const hasSeenConsentPrompt = localStorage.getItem('pilot_study_consent_prompted');
    
    // Only show consent modal if:
    // 1. This is the pilot study environment
    // 2. The user hasn't been asked for consent yet or previously denied
    // 3. There's a logged in user (avoid prompting anonymous users)
    if (
      isPilotStudy &&
      consentStatus === 'not_asked' &&
      !hasSeenConsentPrompt &&
      localStorage.getItem('accessToken')
    ) {
      // Small delay to avoid showing modal immediately on load
      const timer = setTimeout(() => {
        setShowConsentModal(true);
        localStorage.setItem('pilot_study_consent_prompted', 'true');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [consentStatus]);
  
  const handleModalClose = () => {
    setShowConsentModal(false);
  };
  
  return (
    <AnalyticsConsentModal
      isOpen={showConsentModal}
      onClose={handleModalClose}
      isPilotStudy={true}
    />
  );
};

export default PilotStudyConsentManager;
