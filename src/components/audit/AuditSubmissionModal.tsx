import React from 'react';
import { Link } from 'react-router-dom';

interface AuditSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditId: string;
  isAuthenticated: boolean;
}

const AuditSubmissionModal: React.FC<AuditSubmissionModalProps> = ({
  isOpen,
  onClose,
  auditId,
  isAuthenticated
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Energy Audit Submitted Successfully!
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Your audit has been saved and recommendations are ready.
          </p>
          
          {!isAuthenticated && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Create an account to:
                <ul className="list-disc list-inside mt-2 text-left">
                  <li>Save your audit results</li>
                  <li>Track your progress over time</li>
                  <li>Get personalized recommendations</li>
                  <li>Access detailed energy reports</li>
                </ul>
              </p>
              <Link
                to={`/sign-up?auditId=${auditId}`}
                className="inline-block w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 mb-2"
              >
                Create Account
              </Link>
              <Link
                to={`/sign-in?auditId=${auditId}`}
                className="inline-block w-full px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50"
              >
                Sign In
              </Link>
            </div>
          )}
          
          <div className="mt-4">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {isAuthenticated ? 'Close' : 'Continue as Guest'}
            </button>
            {!isAuthenticated && (
              <p className="text-xs text-gray-400 mt-2">
                Your audit ID: {auditId}
                <br />
                Save this ID to access your results later
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditSubmissionModal;
