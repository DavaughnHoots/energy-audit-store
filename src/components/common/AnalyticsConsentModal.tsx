import React, { useState } from 'react';
import { useAnalytics } from '../../context/AnalyticsContext';

interface AnalyticsConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPilotStudy?: boolean;
}

const AnalyticsConsentModal: React.FC<AnalyticsConsentModalProps> = ({
  isOpen,
  onClose,
  isPilotStudy = true
}) => {
  const { updateConsent, consentStatus } = useAnalytics();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConsent = async (consent: boolean) => {
    setIsLoading(true);
    try {
      await updateConsent(consent);
      onClose();
    } catch (error) {
      console.error('Error updating consent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {isPilotStudy ? 'Pilot Study Data Collection Consent' : 'Analytics Consent'}
          </h2>
          
          <div className="prose prose-sm mb-6">
            {isPilotStudy ? (
              <>
                <p className="text-gray-600 mb-4">
                  Thank you for participating in our pilot study for the Energy Efficiency Platform!
                </p>
                <p className="text-gray-600 mb-4">
                  As part of this study, we would like to collect anonymous usage data to help us improve the platform. 
                  This includes:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-600">
                  <li>Pages you visit and features you use</li>
                  <li>Time spent on different sections</li>
                  <li>Task completion and success rates</li>
                  <li>Form interactions and feature usage</li>
                  <li>Technical performance metrics</li>
                </ul>
                <p className="text-gray-600 mb-4">
                  No personally identifiable information will be included in the analytics. All data is 
                  stored securely and will only be used for research and improvement purposes.
                </p>
                <p className="text-gray-600 mb-4">
                  Your participation helps us create a better platform for everyone. You can change your 
                  consent decision at any time in your account settings.
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  We use anonymous analytics to improve your experience with our platform. 
                  This helps us understand how people use our service and identify areas for improvement.
                </p>
                <p className="text-gray-600 mb-4">
                  All data collected is anonymous and securely stored. You can change your consent decision 
                  at any time in your account settings.
                </p>
              </>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={() => handleConsent(false)}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {isPilotStudy ? 'Decline Participation' : 'Decline'}
            </button>
            <button
              type="button"
              onClick={() => handleConsent(true)}
              disabled={isLoading}
              className="px-4 py-2 text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                isPilotStudy ? 'Consent to Participation' : 'Accept'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsConsentModal;
