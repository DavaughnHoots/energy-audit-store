import { ITableFormatter } from '../types/index.js';
import { appLogger } from '../../../utils/logger.js';
import { valueFormatter } from './ValueFormatter.js';

export class TableFormatter implements ITableFormatter {
  /**
   * Generates a table in the PDF document
   * @param doc PDFKit document
   * @param headers Array of header strings (optional)
   * @param rows Array of row data arrays
   */
  generateTable(
    doc: PDFKit.PDFDocument,
    headers: string[],
    rows: any[][]
  ): void {
    appLogger.debug('Generating table', { 
      headerCount: headers.length,
      rowCount: rows.length
    });

    try {
      const tableTop = doc.y;
      const tableLeft = 50;
      const cellPadding = 5;
      const columnWidth = (doc.page.width - 100) / (headers.length || 2);
      
      // Draw headers if provided
      if (headers.length > 0) {
        doc.fillColor('#6b7280').rect(tableLeft, tableTop, doc.page.width - 100, 20).fill();
        doc.fillColor('white');
        
        headers.forEach((header, i) => {
          doc.text(
            header,
            tableLeft + (i * columnWidth) + cellPadding,
            tableTop + cellPadding,
            { width: columnWidth - (cellPadding * 2) }
          );
        });
        
        doc.fillColor('black');
      }
      
      // Draw rows
      let rowTop = headers.length > 0 ? tableTop + 20 : tableTop;
      
      rows.forEach((row, rowIndex) => {
        // Alternate row background
        if (rowIndex % 2 === 0) {
          doc.fillColor('#f3f4f6').rect(tableLeft, rowTop, doc.page.width - 100, 20).fill();
        }
        
        doc.fillColor('black');
        
        row.forEach((cell, i) => {
          doc.text(
            valueFormatter.formatValue(cell, i === 1 ? 'auto' : 'text'),
            tableLeft + (i * columnWidth) + cellPadding,
            rowTop + cellPadding,
            { width: columnWidth - (cellPadding * 2) }
          );
        });
        
        rowTop += 20;
      });
      
      // Update document position
      doc.y = rowTop + 10;
    } catch (error) {
      appLogger.error('Error generating table', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      // Continue without the table
      doc.moveDown();
    }
  }
}

export const tableFormatter = new TableFormatter();
