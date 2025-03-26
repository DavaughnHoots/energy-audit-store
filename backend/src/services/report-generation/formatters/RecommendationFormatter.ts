import PDFKit from 'pdfkit';
import { AuditRecommendation, ProductReference } from '../../../types/energyAudit.js';
import { appLogger } from '../../../utils/logger.js';

/**
 * Formatter for adding product recommendations to PDF reports
 */
export class RecommendationFormatter {
  /**
   * Add product recommendations to the report
   * @param doc PDFKit document
   * @param recommendation Audit recommendation
   */
  public addProductRecommendations(
    doc: PDFKit.PDFDocument,
    recommendation: AuditRecommendation
  ): void {
    try {
      // If no products, use default message
      if (!recommendation.products || recommendation.products.length === 0) {
        doc.fontSize(12)
          .text('Product Recommendations: No specific products found for this recommendation', {
            continued: false
          })
          .moveDown(0.5);
        return;
      }
      
      // Add section header
      doc.fontSize(12)
        .text('Recommended Products:', {
          continued: false,
          underline: true
        })
        .moveDown(0.3);
      
      // Add product cards
      for (const productRef of recommendation.products) {
        this.addProductCard(doc, productRef);
      }
      
      // Add note about product recommendations
      doc.fontSize(10)
        .fillColor('#666666')
        .font('Helvetica-Oblique') // Use oblique font for italics
        .text('* Products are recommended based on efficiency ratings and compatibility with your home')
        .font('Helvetica') // Reset font
        .fillColor('black')
        .moveDown(0.5);
    } catch (error) {
      appLogger.error('Error adding product recommendations', { error });
      // Add fallback message on error
      doc.fontSize(12)
        .text('Product recommendations temporarily unavailable', {
          continued: false
        })
        .moveDown(0.5);
    }
  }

  /**
   * Add single product card to the document
   * @param doc PDFKit document
   * @param product Product information
   */
  private addProductCard(doc: PDFKit.PDFDocument, product: ProductReference): void {
    // Start a box for the product card
    doc.rect(doc.x, doc.y, 500, 120)
      .fillAndStroke('#f5f5f5', '#cccccc')
      .moveDown(0);
    
    // Set the starting position inside the box
    const startX = doc.x + 10;
    const startY = doc.y;
    
    // Product name and manufacturer
    doc.fontSize(12)
      .fillColor('#333333')
      .text(`${product.name}`, {
        continued: false,
        indent: 10
      });
    
    doc.fontSize(10)
      .fillColor('#666666')
      .text(`by ${product.brand || 'Unknown manufacturer'}`, {
        indent: 10
      })
      .moveDown(0.2);
    
    // Two-column layout for details and features
    const colY = doc.y;
    
    // Left column - details
    doc.fontSize(10)
      .fillColor('#333333')
      .text('Details:', {
        continued: false,
        indent: 10,
        width: 240
      })
      .moveDown(0.1);
    
    // Price and efficiency info
    doc.fillColor('#666666');
    
    if (product.price) {
      doc.text(`Price: $${product.price.toLocaleString()}`, {
        indent: 15,
        width: 240
      });
    }
    
    if (product.efficiency) {
      // Efficiency is now a structured object
      const effText = typeof product.efficiency === 'string' 
        ? product.efficiency 
        : `${product.efficiency.rating || ''} ${product.efficiency.value}${product.efficiency.unit || ''}`.trim();
        
      doc.text(`Efficiency: ${effText}`, {
        indent: 15,
        width: 240
      });
    }
    
    // Model number if available
    if (product.model) {
      doc.text(`Model: ${product.model}`, {
        indent: 15,
        width: 240
      });
    }
    
    // Add rebate information if applicable
    if (product.rebateEligible && product.rebateAmount && product.rebateAmount > 0) {
      doc.fillColor('#008800')
        .text(`Rebate Available: $${product.rebateAmount.toLocaleString()}`, {
          indent: 15,
          width: 240
        });
    }
    
    // Reset position for right column
    doc.x = 260;
    doc.y = colY;
    
    // Right column - features
    doc.fillColor('#333333')
      .text('Key Features:', {
        continued: false,
        width: 240
      })
      .moveDown(0.1);
    
    // List key features
    doc.fillColor('#666666');
    
    if (product.features && Array.isArray(product.features) && product.features.length > 0) {
      product.features.slice(0, 3).forEach(feature => {
        doc.text(`• ${feature}`, {
          width: 240
        });
      });
    } else {
      doc.text('• No feature details available', {
        width: 240
      });
    }
    
    // Add purchase link
    if (product.productUrl) {
      doc.y = startY + 80;
      doc.x = 350;
      doc.fillColor('#0066cc')
        .text('View Details', {
          link: product.productUrl,
          underline: true
        });
    }
    
    // Reset to regular layout after product card
    doc.fillColor('black')
      .moveDown(1.5);
  }
}
