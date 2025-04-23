// src/components/education/pdf/ui/PDFFooter.tsx
import React from 'react';

interface PDFFooterProps {
  pageNumber?: number;
  totalPages?: number;
  showDisclaimer?: boolean;
}

const PDFFooter: React.FC<PDFFooterProps> = ({ 
  pageNumber, 
  totalPages,
  showDisclaimer = true
}) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="pdf-footer" style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '10px 20px',
      borderTop: '1px solid #eaeaea',
      marginTop: '20px',
      fontSize: '10px',
      color: '#666'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '5px'
      }}>
        <div>© {currentYear} Energy Audit. All rights reserved.</div>
        {(pageNumber !== undefined && totalPages !== undefined) && (
          <div>Page {pageNumber} of {totalPages}</div>
        )}
      </div>
      
      {showDisclaimer && (
        <div style={{ fontSize: '8px', color: '#999' }}>
          This document is for informational purposes only. The information provided is not intended 
          as professional advice. Always consult with a qualified professional before making any 
          energy-related decisions or improvements to your home.
        </div>
      )}
      
      <div style={{ 
        textAlign: 'center', 
        marginTop: '5px',
        fontSize: '9px'
      }}>
        www.energyaudit.example.com
      </div>
    </div>
  );
};

export default PDFFooter;
