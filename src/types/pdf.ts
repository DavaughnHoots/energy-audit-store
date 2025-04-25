// src/types/pdf.ts
import { EducationalResource } from './education';

/**
 * PDF template types
 */
export type PDFTemplateType = 
  | 'educational' // Technical guides
  | 'checklist'   // Seasonal checklists
  | 'calendar';   // Energy calendars

/**
 * PDF generation options
 */
export interface PDFGenerationOptions {
  title: string;
  filename?: string;
  showLogo?: boolean;
  scale?: number;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

/**
 * PDF generator service interface
 */
export interface PDFGeneratorService {
  generatePDF: (
    resourceId: string,
    templateType?: PDFTemplateType,
    options?: PDFGenerationOptions
  ) => Promise<void>;
}

/**
 * PDF template props interface
 */
export interface PDFTemplateProps {
  resource: EducationalResource;
  options?: PDFGenerationOptions;
}

/**
 * PDF download button props
 */
export interface PDFDownloadButtonProps {
  resourceId: string;
  title?: string;
  templateType?: PDFTemplateType;
  buttonText?: string;
  className?: string;
  options?: PDFGenerationOptions;
}
