// src/components/education/pdf/PDFDownloadButton.tsx
import React, { useState } from 'react';
import { PDFDownloadButtonProps } from '@/types/pdf';
import { educationalPdfService } from '@/services/educationalPdfService';

const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  resourceId,
  title = 'Document',
  templateType,
  buttonText,
  className = '',
  options
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);
      await educationalPdfService.generatePDF(resourceId, templateType, options);
    } catch (error) {
      console.error('PDF generation failed:', error);
      // In a production app, we'd show a toast notification here
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <button
      className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded flex items-center transition-colors ${className} ${isGenerating ? 'opacity-75 cursor-not-allowed' : ''}`}
      onClick={handleGeneratePDF}
      disabled={isGenerating}
      type="button"
    >
      {isGenerating ? (
        <>
          <span className="mr-2">
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
          Generating...
        </>
      ) : (
        <>
          <span className="mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          {buttonText || `Download ${title} PDF`}
        </>
      )}
    </button>
  );
};

export default PDFDownloadButton;
