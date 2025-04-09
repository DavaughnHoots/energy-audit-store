import React, { useState } from 'react';
import { Badge, UserBadge } from '../../types/badges';
import BadgeCard from './BadgeCard';
import BadgeDetailModal from './BadgeDetailModal';

interface BadgeCollectionProps {
  badges: Badge[];
  userBadges?: Record<string, UserBadge>;
  title?: string;
  emptyMessage?: string;
  className?: string;
}

/**
 * Displays a collection of badges in a grid layout
 */
const BadgeCollection: React.FC<BadgeCollectionProps> = ({
  badges,
  userBadges = {},
  title,
  emptyMessage = "No badges to display",
  className
}) => {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle opening the badge detail modal
  const handleBadgeClick = (badge: Badge) => {
    setSelectedBadge(badge);
    setIsModalOpen(true);
  };

  // Close the badge detail modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // If there are no badges, show an empty state
  if (badges.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      
      {/* Badge grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {badges.map((badge) => {
          const userBadge = userBadges[badge.id];
          return (
            <BadgeCard
              key={badge.id}
              badge={badge}
              earned={userBadge?.earned || false}
              progress={userBadge?.progress || 0}
              earnedDate={userBadge?.earnedDate}
              onClick={() => handleBadgeClick(badge)}
            />
          );
        })}
      </div>

      {/* Badge detail modal */}
      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          userBadge={userBadges[selectedBadge.id]}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default BadgeCollection;
