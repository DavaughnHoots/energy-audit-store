// src/components/education/pdf/ui/PDFHeader.tsx
import React from 'react';
import websiteLogo from '@/assets/website logo.png';

interface PDFHeaderProps {
  title: string;
  showLogo?: boolean;
}

const PDFHeader: React.FC<PDFHeaderProps> = ({ title, showLogo = true }) => {
  return (
    <div className="pdf-header" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px',
      borderBottom: '1px solid #eaeaea',
      marginBottom: '20px'
    }}>
      {showLogo && (
        <div className="pdf-logo" style={{ maxWidth: '150px' }}>
          <img 
            src={websiteLogo} 
            alt="Energy Audit Logo"
            style={{ height: '40px' }}
          />
        </div>
      )}
      <div className="pdf-title" style={{
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: showLogo ? 'center' : 'left'
      }}>
        {title}
      </div>
      <div className="pdf-date" style={{
        fontSize: '12px',
        color: '#666'
      }}>
        {new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>
    </div>
  );
};

export default PDFHeader;
