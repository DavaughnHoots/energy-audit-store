import { IHeaderFormatter } from '../types/index.js';
import { appLogger } from '../../../utils/logger.js';

export class HeaderFormatter implements IHeaderFormatter {
  /**
   * Adds a section header to the PDF document
   * @param doc PDFKit document
   * @param title Section title
   * @param align Optional alignment (default: left)
   * @param startNewPage Whether to start a new page before adding the header
   * @param indent Indentation level for the header
   */
  addSectionHeader(
    doc: PDFKit.PDFDocument,
    title: string,
    align: 'left' | 'center' | 'right' = 'left',
    startNewPage: boolean = false,
    indent: number = 0
  ): void {
    try {
      if (startNewPage) {
        doc.addPage();
      }
      
      doc
        .fontSize(16)
        .fillColor('#000000')
        .text(title, { 
          align, 
          underline: false,
          indent: indent  // Apply indentation
        })
        .moveDown(0.5);
    } catch (error) {
      appLogger.error('Error adding section header', { 
        error: error instanceof Error ? error.message : String(error),
        title
      });
      // Continue without the header
      doc.moveDown();
    }
  }
}

export const headerFormatter = new HeaderFormatter();
