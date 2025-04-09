import React from 'react';
import { Badge, UserBadge } from '../../types/badges';
import { cn } from '../../utils/cn';

interface BadgeDetailModalProps {
  badge: Badge;
  userBadge?: UserBadge;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * A modal component for displaying detailed badge information
 */
const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({
  badge,
  userBadge,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const earned = userBadge?.earned || false;
  const progress = userBadge?.progress || 0;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        className="relative w-full max-w-md bg-white rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Close</span>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Badge header */}
        <div className="flex items-center mb-6">
          <div className="text-4xl mr-4">{badge.icon}</div>
          <div>
            <h2 className="text-2xl font-bold">{badge.name}</h2>
            <p className="text-sm text-gray-500 capitalize">{badge.category} • {badge.tier}</p>
          </div>
        </div>

        {/* Badge description */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Description</h3>
          <p className="text-gray-700">{badge.description}</p>
        </div>

        {/* Progress section */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Progress</h3>
          {earned ? (
            <div className="flex items-center text-green-600">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Earned {userBadge?.earnedDate ? `on ${userBadge.earnedDate.toLocaleDateString()}` : ''}</span>
            </div>
          ) : (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">{progress}% complete</span>
                <span className="text-sm">{Math.round(badge.criteria.threshold * (progress / 100))} / {badge.criteria.threshold}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {badge.criteria.type === 'savingsAmount' && `Save $${badge.criteria.threshold} on energy costs`}
                {badge.criteria.type === 'auditCount' && `Complete ${badge.criteria.threshold} energy audit${badge.criteria.threshold > 1 ? 's' : ''}`}
                {badge.criteria.type === 'implementedCount' && `Implement ${badge.criteria.threshold} energy-saving recommendation${badge.criteria.threshold > 1 ? 's' : ''}`}
                {badge.criteria.type === 'custom' && 'Complete a special challenge'}
              </p>
            </div>
          )}
        </div>

        {/* Reward section */}
        {badge.reward && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Reward</h3>
            <div className={cn(
              "p-3 rounded-lg border",
              earned ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
            )}>
              <p className="text-gray-700">{badge.reward.description}</p>
              {earned && badge.reward.value && (
                <p className="mt-2 text-sm font-medium">
                  {badge.reward.type === 'discount' && `Discount code: ${badge.reward.value}`}
                  {badge.reward.type === 'content' && 'Available in your content library'}
                  {badge.reward.type === 'feature' && 'Feature unlocked'}
                  {badge.reward.type === 'recognition' && 'Recognition unlocked'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
          {!earned && progress > 0 && (
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              View {badge.category === 'audits' ? 'Audits' : 
                    badge.category === 'improvements' ? 'Recommendations' :
                    badge.category === 'savings' ? 'Savings' :
                    badge.category === 'education' ? 'Courses' : 
                    'Details'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BadgeDetailModal;
