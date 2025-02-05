import React, { useState } from 'react';
import { X, Download, Loader2, UserPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
}

const AuditSubmissionModal: React.FC<Props> = ({ isOpen, onClose, formData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGuestDownload = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/energy-audit/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'energy-audit-report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Store anonymous data for analytics if user consents
      if (window.localStorage.getItem('allowAnonymousData') === 'true') {
        await fetch('/api/analytics/anonymous-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ auditData: formData })
        });
      }

      onClose();
    } catch (err) {
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = () => {
    // Save form data to session storage before redirect
    sessionStorage.setItem('pendingAuditData', JSON.stringify(formData));
    window.location.href = '/sign-up?returnTo=audit';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Complete Your Energy Audit
        </h2>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <p className="text-gray-600 mb-6">
          Create a free account to save your results and get personalized recommendations,
          or download a one-time report.
        </p>

        <div className="space-y-4">
          <button
            onClick={handleSignup}
            className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Save & Create Account
          </button>

          <button
            onClick={handleGuestDownload}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Download className="h-5 w-5 mr-2" />
            )}
            Download Report Only
          </button>

          <div className="text-sm text-gray-500">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={localStorage.getItem('allowAnonymousData') === 'true'}
                onChange={(e) => {
                  localStorage.setItem('allowAnonymousData', e.target.checked.toString());
                }}
              />
              Help improve our recommendations by allowing anonymous data collection
            </label>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Account Benefits
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Save and track multiple property audits</li>
            <li>• Get personalized energy-saving recommendations</li>
            <li>• Compare efficiency with similar homes</li>
            <li>• Access exclusive discounts on energy-efficient products</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuditSubmissionModal;