import React, { useEffect, useState } from 'react';
import { Badge } from '../../types/badges';
import { useAuth } from '../../hooks/useAuth';
import { badgeService } from '../../services/badgeService';

interface BadgeNotificationProps {
  onClose: () => void;
}

/**
 * Component to display badge achievement notifications
 * This component polls for new badge achievements and displays a notification
 */
export const BadgeNotification: React.FC<BadgeNotificationProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (!user?.id) return;
    
    // Get last notification timestamp from localStorage
    const lastCheck = localStorage.getItem(`badge_last_check_${user.id}`);
    const lastCheckTime = lastCheck ? parseInt(lastCheck, 10) : 0;
    
    const checkForNewBadges = async () => {
      try {
        const recentAchievements = await badgeService.getRecentAchievements(user.id, 1);
        
        if (recentAchievements.length > 0 && recentAchievements[0]) {
          const achievement = recentAchievements[0];
          const earnedBadges = await badgeService.getUserBadges(user.id);
          
          const userBadge = earnedBadges[achievement.id];
          
          if (userBadge?.earnedDate) {
            const earnedTime = new Date(userBadge.earnedDate).getTime();
            if (earnedTime > lastCheckTime) {
              setNewBadge(achievement);
              setVisible(true);
              localStorage.setItem(`badge_last_check_${user.id}`, Date.now().toString());
            }
          }
        }
      } catch (error) {
        console.error('Error checking for new badges:', error);
      }
    };
    
    // Check immediately on mount
    checkForNewBadges();
    
    // Set up polling interval (every 2 minutes)
    const interval = setInterval(checkForNewBadges, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user?.id]);
  
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      setNewBadge(null);
      onClose();
    }, 300);
  };
  
  if (!newBadge || !visible) {
    return null;
  }
  
  return (
    <div className={`badge-notification-container ${visible ? 'visible' : ''}`}>
      <div className="badge-notification">
        <div className="badge-notification-header">
          <h3>New Achievement!</h3>
          <button className="close-button" onClick={handleClose} aria-label="Close">
            &times;
          </button>
        </div>
        
        <div className="badge-notification-content">
          <div className="badge-icon">
            <img src={newBadge.icon} alt={newBadge.name} />
          </div>
          <div className="badge-info">
            <h4>{newBadge.name}</h4>
            <p>{newBadge.description}</p>
            
            {newBadge.reward && (
              <div className="badge-reward">
                <span className="reward-label">Reward:</span>
                <span className="reward-value">{newBadge.reward.description}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="badge-notification-actions">
          <button onClick={handleClose} className="primary-button">
            Awesome!
          </button>
          <button onClick={() => window.location.href = '/dashboard/badges'} className="secondary-button">
            View All Badges
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * CSS styles for the BadgeNotification component
 * Include this in your global CSS or component styles
 */
export const badgeNotificationStyles = `
.badge-notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.badge-notification-container.visible {
  opacity: 1;
  transform: translateY(0);
}

.badge-notification {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 320px;
  overflow: hidden;
  border-left: 4px solid #ffd700;
}

.badge-notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.badge-notification-header h3 {
  margin: 0;
  font-size: 16px;
  color: #212529;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6c757d;
}

.badge-notification-content {
  padding: 16px;
  display: flex;
  gap: 16px;
}

.badge-icon {
  flex-shrink: 0;
}

.badge-icon img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: contain;
}

.badge-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #212529;
}

.badge-info p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #6c757d;
}

.badge-reward {
  margin-top: 8px;
  font-size: 14px;
}

.reward-label {
  font-weight: bold;
  color: #212529;
  margin-right: 4px;
}

.reward-value {
  color: #28a745;
}

.badge-notification-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.primary-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.secondary-button {
  background-color: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
`;
