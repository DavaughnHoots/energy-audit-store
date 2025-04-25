import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate a PDF from an HTML element
 * @param {HTMLElement} element - The HTML element to convert to PDF
 * @param {string} filename - The name of the PDF file to save
 * @param {Object} options - Additional options for PDF generation
 * @returns {Promise<Blob>} - A promise that resolves with the PDF blob
 */
export const generatePDFFromElement = async (element, filename, options = {}) => {
  if (!element) {
    throw new Error('Element is required');
  }
  
  const defaultOptions = {
    scale: 2, // Higher scale for better quality
    useCORS: true, // Enable cross-origin images
    logging: false,
    letterRendering: true,
    allowTaint: true
  };
  
  const pdfOptions = {
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    ...options.pdfOptions
  };
  
  try {
    // Render the HTML to canvas
    const canvas = await html2canvas(element, {
      ...defaultOptions,
      ...options.canvasOptions
    });
    
    // Create PDF document
    const pdf = new jsPDF(pdfOptions);
    
    // Calculate dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Calculate scaling ratio to fit within PDF
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    // Calculate centered position
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;
    
    // Add canvas image to PDF
    pdf.addImage(
      canvas.toDataURL('image/png'), 
      'PNG', 
      imgX, 
      imgY, 
      imgWidth * ratio, 
      imgHeight * ratio
    );
    
    // Save PDF with filename
    if (options.save !== false) {
      pdf.save(filename);
    }
    
    // Return PDF as blob for further processing if needed
    return pdf.output('blob');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Generate a multi-page PDF from multiple HTML elements
 * @param {Array<HTMLElement>} elements - Array of HTML elements to convert to PDF pages
 * @param {string} filename - The name of the PDF file to save
 * @param {Object} options - Additional options for PDF generation
 * @returns {Promise<Blob>} - A promise that resolves with the PDF blob
 */
export const generateMultiPagePDF = async (elements, filename, options = {}) => {
  if (!elements || !elements.length) {
    throw new Error('Elements array is required');
  }
  
  const defaultOptions = {
    scale: 2,
    useCORS: true,
    logging: false,
    letterRendering: true,
    allowTaint: true
  };
  
  const pdfOptions = {
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    ...options.pdfOptions
  };
  
  try {
    // Create PDF document
    const pdf = new jsPDF(pdfOptions);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Process each element as a page
    for (let i = 0; i < elements.length; i++) {
      // Render element to canvas
      const canvas = await html2canvas(elements[i], {
        ...defaultOptions,
        ...options.canvasOptions
      });
      
      // Calculate dimensions
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate scaling ratio to fit within PDF
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      // Calculate centered position
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      // Add page for all but the first element
      if (i > 0) {
        pdf.addPage();
      }
      
      // Add canvas image to PDF
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );
    }
    
    // Save PDF with filename
    if (options.save !== false) {
      pdf.save(filename);
    }
    
    // Return PDF as blob for further processing if needed
    return pdf.output('blob');
    
  } catch (error) {
    console.error('Error generating multi-page PDF:', error);
    throw error;
  }
};

/**
 * Format PDF filename to be safe for saving
 * @param {string} title - The title to use for the filename
 * @returns {string} - A safe filename
 */
export const formatPDFFilename = (title) => {
  if (!title) return 'document.pdf';
  
  // Convert to lowercase, replace spaces with hyphens
  const formatted = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    // Remove any characters that aren't safe for filenames
    .replace(/[^a-z0-9-_]/g, '')
    // Truncate to reasonable length
    .slice(0, 50);
  
  return `${formatted}.pdf`;
};

export default {
  generatePDFFromElement,
  generateMultiPagePDF,
  formatPDFFilename
};