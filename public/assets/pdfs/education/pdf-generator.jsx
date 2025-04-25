import { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ChecklistTemplate from './templates/ChecklistTemplate';
import CalendarTemplate from './templates/CalendarTemplate';
import EducationalTemplate from './templates/EducationalTemplate';

const PDFGenerator = ({ templateType, data, title }) => {
  const pdfRef = useRef(null);

  // Function to determine which template component to render
  const renderTemplate = () => {
    switch (templateType) {
      case 'spring':
      case 'summer':
      case 'fall':
      case 'winter':
        return <ChecklistTemplate data={data} season={templateType} title={title} />;
      case 'calendar':
        return <CalendarTemplate data={data} title={title} />;
      case 'insulation':
      case 'solar':
        return <EducationalTemplate data={data} title={title} />;
      default:
        return <div>Select a template</div>;
    }
  };

  // Function to generate PDF from rendered component
  const generatePDF = async () => {
    if (!pdfRef.current) return;
    
    try {
      // Show loading indication
      document.body.style.cursor = 'wait';
      
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true, // Enable cross-origin images
        logging: false,
        letterRendering: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF with appropriate dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      // Reset cursor
      document.body.style.cursor = 'default';
    }
  };

  return (
    <>
      <button
        onClick={generatePDF}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Generate PDF
      </button>
      
      {/* Hidden div containing the content to be converted to PDF */}
      <div className="hidden">
        <div ref={pdfRef} className="pdf-content" style={{ width: '210mm', minHeight: '297mm', padding: '10mm' }}>
          {renderTemplate()}
        </div>
      </div>
    </>
  );
};

export default PDFGenerator;