// src/components/education/pdf/ui/SectionHeader.tsx
import React from 'react';

interface SectionHeaderProps {
  title: string;
  level?: 1 | 2 | 3;
  withAccent?: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  level = 2,
  withAccent = true 
}) => {
  // Define styles based on header level
  const getFontSize = () => {
    switch (level) {
      case 1: return '24px';
      case 2: return '20px';
      case 3: return '16px';
      default: return '20px';
    }
  };

  const getFontWeight = () => {
    switch (level) {
      case 1: return '700';
      case 2: return '600';
      case 3: return '500';
      default: return '600';
    }
  };

  const getMarginBottom = () => {
    switch (level) {
      case 1: return '20px';
      case 2: return '16px';
      case 3: return '12px';
      default: return '16px';
    }
  };
  
  return (
    <div className={`pdf-section-header level-${level}`} style={{
      position: 'relative',
      fontSize: getFontSize(),
      fontWeight: getFontWeight(),
      color: '#333',
      marginBottom: getMarginBottom(),
      paddingBottom: '5px',
      borderBottom: level === 1 ? '1px solid #eaeaea' : 'none',
      pageBreakAfter: 'avoid',
      pageBreakInside: 'avoid'
    }}>
      {withAccent && level !== 3 && (
        <div style={{
          position: 'absolute',
          bottom: level === 1 ? '0' : '-5px',
          left: '0',
          width: level === 1 ? '60px' : '40px',
          height: '3px',
          backgroundColor: '#1E88E5',
          borderRadius: '1.5px'
        }} />
      )}
      {title}
    </div>
  );
};

export default SectionHeader;
