import React, { KeyboardEvent } from 'react';

export interface RegionProps {
  area: string;
  description: string;
  position: { 
    top?: string; 
    left?: string; 
    right?: string;
    bottom?: string;
    width: string; 
    height: string;
    transform?: string;
  };
  onClick: () => void;
  highlightColor?: string;
  className?: string;
}

/**
 * Accessible interactive region for house diagram
 * Provides proper keyboard support and ARIA attributes
 */
const HouseRegion: React.FC<RegionProps> = ({
  area,
  description,
  position,
  onClick,
  highlightColor = 'orange-200',
  className = '',
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${area}: ${description}`}
      className={`absolute cursor-pointer hover:bg-${highlightColor} transition-colors border border-transparent hover:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${className}`}
      style={position}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    />
  );
};

export default HouseRegion;
