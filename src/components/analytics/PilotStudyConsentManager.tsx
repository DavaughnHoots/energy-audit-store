import React, { useEffect } from 'react';
import { useAnalytics } from '../../context/AnalyticsContext';

/**
 * Component responsible for managing analytics consent for the pilot study
 * For pilot study, we automatically grant consent without showing a modal
 * Users are informed via the site-wide banner instead
 */
const PilotStudyConsentManager: React.FC = () => {
  const { consentStatus, updateConsent } = useAnalytics();
  
  // Auto-grant consent without showing modal
  useEffect(() => {
    const isPilotStudy = process.env.REACT_APP_PILOT_STUDY === 'true';
    const hasSeenConsentPrompt = localStorage.getItem('pilot_study_consent_prompted');
    
    // Force pilot study mode to true for the pilot study phase
    const forcePilotMode = true;
    
    // Auto-grant consent if:
    // 1. This is the pilot study environment
    // 2. The user hasn't been asked for consent yet
    if (
      (isPilotStudy || forcePilotMode) &&
      consentStatus === 'not_asked' &&
      !hasSeenConsentPrompt
    ) {
      // Automatically grant consent without showing the popup
      updateConsent(true);
      localStorage.setItem('pilot_study_consent_prompted', 'true');
      console.log('Analytics consent automatically granted for pilot study');
    }
  }, [consentStatus, updateConsent]);
  
  // No UI rendered - consent is handled automatically
  return null;
};

export default PilotStudyConsentManager;
