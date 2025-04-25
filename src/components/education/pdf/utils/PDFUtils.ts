// src/components/education/pdf/utils/PDFUtils.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { EducationalResource } from '@/types/education';
import { PDFGenerationOptions, PDFTemplateType } from '@/types/pdf';

/**
 * Convert an HTML element to a PDF document
 */
export const htmlToPDF = async (
  element: HTMLElement,
  options: PDFGenerationOptions = { title: 'Document' }
): Promise<jsPDF> => {
  // Set default options
  const {
    filename = options.title?.replace(/\s+/g, '-').toLowerCase() || 'document',
    scale = 2,
    format = 'a4',
    orientation = 'portrait'
  } = options;

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true, // Enable cross-origin images
      logging: false
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: format
    });

    // Add the canvas as an image to the PDF
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    return pdf;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${(error as Error).message}`);
  }
};

/**
 * Get template type based on resource properties
 */
export const getTemplateTypeForResource = (resource: EducationalResource): PDFTemplateType => {
  // Determine which template to use based on resource type and topic
  if (resource.topic === 'insulation' || resource.topic === 'renewable-energy') {
    return 'educational';
  }

  // If it's a seasonal checklist
  if (resource.tags.some(tag => ['summer', 'winter', 'spring', 'fall', 'seasonal'].includes(tag))) {
    return 'checklist';
  }

  // Default to educational template
  return 'educational';
};

/**
 * Format date for PDF display
 */
export const formatDateForPDF = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Create a filename for the PDF
 */
export const createPDFFilename = (resource: EducationalResource): string => {
  return `${resource.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
};

/**
 * Determine if a resource is compatible with PDF generation
 */
export const isPDFCompatible = (resource: EducationalResource): boolean => {
  // Resources that make sense to download as PDFs
  return (
    resource.topic === 'insulation' ||
    resource.topic === 'renewable-energy' ||
    resource.type === 'article' ||
    resource.tags.some(tag => ['checklist', 'guide', 'tutorial'].includes(tag))
  );
};
