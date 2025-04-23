import { useCallback, useEffect, useState } from 'react';
import { PDFGenerationOptions, PDFTemplateType } from '@/types/pdf';
import { htmlToPDF, getTemplateTypeForResource } from '@/components/education/pdf/utils/PDFUtils';
import EducationalTemplate from '@/components/education/pdf/templates/EducationalTemplate';
import ChecklistTemplate from '@/components/education/pdf/templates/ChecklistTemplate';
import React from 'react';
import ReactDOM from 'react-dom';

/**
 * Educational PDF metadata interface
 */
export interface EducationalPdf {
  id: string;
  title: string;
  description: string;
  filename: string;
  path: string;
  relatedComponent?: string;
  relatedPage?: string;
}

/**
 * Educational PDF catalog interface
 */
export interface PdfCatalog {
  version: string;
  lastUpdated: string;
  categories: {
    [category: string]: EducationalPdf[];
  };
}

/**
 * Dynamic PDF Generator Service
 */
class EducationalPdfGenerator {
  /**
   * Generate a PDF from a resource
   */
  public async generatePDF(
    resourceId: string,
    templateType?: PDFTemplateType,
    options?: PDFGenerationOptions
  ): Promise<void> {
    try {
      // Fetch the resource data
      const resource = await this.getResourceById(resourceId);
      if (!resource) {
        throw new Error(`Resource with ID ${resourceId} not found`);
      }

      // Determine the template type if not specified
      const resolvedTemplateType = templateType || getTemplateTypeForResource(resource);
      
      // Create a temporary container for rendering the component
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '210mm'; // A4 width
      document.body.appendChild(tempContainer);

      try {
        // Render the appropriate template based on type
        const template = this.renderTemplate(resource, resolvedTemplateType, options);
        ReactDOM.render(template, tempContainer);
        
        // Wait for images and other resources to load
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Generate the PDF
        const pdf = await htmlToPDF(tempContainer, {
          title: resource.title,
          ...options
        });
        
        // Save the PDF
        const filename = options?.filename || `${resource.title.toLowerCase().replace(/\s+/g, '-')}.pdf`;
        pdf.save(filename);
      } finally {
        // Clean up
        ReactDOM.unmountComponentAtNode(tempContainer);
        document.body.removeChild(tempContainer);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Render the appropriate template based on type
   */
  private renderTemplate(
    resource: any,
    templateType: PDFTemplateType,
    options?: PDFGenerationOptions
  ) {
    switch (templateType) {
      case 'educational':
        return React.createElement(EducationalTemplate, { resource, options });
      case 'checklist':
        return React.createElement(ChecklistTemplate, { resource, options });
      case 'calendar':
        // Calendar template is not implemented yet, fallback to educational
        return React.createElement(EducationalTemplate, { resource, options });
      default:
        return React.createElement(EducationalTemplate, { resource, options });
    }
  }

  /**
   * Helper to get resource by ID
   * Handles specific checklist resources and returns appropriate data
   */
  private async getResourceById(resourceId: string): Promise<any> {
    // Check for our specific checklist resources
    if (resourceId === 'spring-prep-checklist') {
      return {
        id: resourceId,
        title: 'Spring Prep Checklist',
        description: 'Essential tasks to prepare your home for efficient cooling in the spring and summer.',
        type: 'checklist',
        topic: 'seasonal-energy-tips',
        level: 'all',
        datePublished: new Date().toISOString().split('T')[0],
        featured: false,
        tags: ['spring', 'maintenance', 'energy-saving'],
        checklistItems: [
          { text: 'Schedule HVAC maintenance before the cooling season', note: 'Clean coils and check refrigerant levels' },
          { text: 'Clean refrigerator coils and check door seals', note: 'Helps appliance efficiency' },
          { text: 'Use natural ventilation instead of mechanical cooling', note: 'Open windows during cool evenings' },
          { text: 'Clean window screens to maximize airflow', note: 'Remove winter buildup' },
          { text: 'Reseal weatherstripping around doors and windows', note: 'Replace if cracked or worn' },
          { text: 'Set ceiling fans to counterclockwise rotation', note: 'Creates cooling downdraft' },
          { text: 'Plant shade trees on south/west-facing walls', note: 'Long-term energy savings' }
        ],
        sections: [
          {
            title: 'Spring HVAC Maintenance',
            items: [
              { text: 'Schedule HVAC maintenance before the cooling season', note: 'Clean coils and check refrigerant levels' },
              { text: 'Replace air filters', note: 'Should be done every 1-3 months' },
              { text: 'Clean vents and ductwork', note: 'Improves airflow and efficiency' }
            ]
          },
          {
            title: 'Windows and Ventilation',
            items: [
              { text: 'Clean window screens to maximize airflow', note: 'Remove winter buildup' },
              { text: 'Check window seals and caulking', note: 'Repair as needed' },
              { text: 'Set ceiling fans to counterclockwise rotation', note: 'Creates cooling downdraft' }
            ]
          },
          {
            title: 'Outside Preparations',
            items: [
              { text: 'Service lawn equipment', note: 'Prepare for regular use' },
              { text: 'Inspect roof and gutters', note: 'Remove debris from winter' },
              { text: 'Check outdoor AC unit', note: 'Clear area around unit (2ft minimum)' }
            ]
          }
        ]
      };
    } else if (resourceId === 'full-seasonal-checklist') {
      return {
        id: resourceId,
        title: 'Full Seasonal Checklist',
        description: 'Comprehensive year-round checklist for home energy maintenance.',
        type: 'checklist',
        topic: 'seasonal-energy-tips',
        level: 'all',
        datePublished: new Date().toISOString().split('T')[0],
        featured: false,
        tags: ['seasonal', 'maintenance', 'energy-saving', 'year-round'],
        sections: [
          {
            title: 'Spring (March-May)',
            items: [
              { text: 'Schedule HVAC maintenance for cooling system', note: 'March/April' },
              { text: 'Clean refrigerator coils', note: 'March/April' },
              { text: 'Clean window screens', note: 'May' },
              { text: 'Set ceiling fans to counterclockwise', note: 'May' },
              { text: 'Inspect roof for winter damage', note: 'April' }
            ]
          },
          {
            title: 'Summer (June-August)',
            items: [
              { text: 'Set thermostat to 78°F when home', note: 'June' },
              { text: 'Close blinds during hottest parts of day', note: 'All Summer' },
              { text: 'Check/replace AC filters monthly', note: 'Monthly' },
              { text: 'Run big appliances in evening', note: 'All Summer' },
              { text: 'Monitor AC performance', note: 'August' }
            ]
          },
          {
            title: 'Fall (September-November)',
            items: [
              { text: 'Schedule furnace maintenance', note: 'September/October' },
              { text: 'Seal air leaks in walls, doors, attics', note: 'October' },
              { text: 'Inspect attic insulation depth', note: 'October' },
              { text: 'Clean gutters', note: 'November' },
              { text: 'Reverse fans to clockwise rotation', note: 'November' }
            ]
          },
          {
            title: 'Winter (December-February)',
            items: [
              { text: 'Set thermostat to 68°F when home', note: 'All Winter' },
              { text: 'Open curtains on south-facing windows during day', note: 'Sunny Days' },
              { text: 'Close curtains at night', note: 'All Winter' },
              { text: 'Check furnace filter monthly', note: 'Monthly' },
              { text: 'Analyze energy bills', note: 'January' }
            ]
          }
        ]
      };
    }
    
    // For other resources, return a generic mock resource
    // In a real application, this would fetch from an API
    return {
      id: resourceId,
      title: 'Advanced Insulation Techniques',
      description: 'Learn about advanced insulation techniques to improve your home energy efficiency.',
      type: 'article',
      topic: 'insulation',
      level: 'advanced',
      readTime: '15 min',
      thumbnail: '/assets/images/insulation.jpg',
      url: '/education/advanced-insulation-techniques',
      datePublished: '2025-01-15',
      featured: true,
      collectionIds: ['energy-efficiency'],
      tags: ['insulation', 'winter', 'energy-saving'],
      popularity: 835,
      rating: {
        average: 4.7,
        count: 128
      }
    };
  }
}

// Export instance for service-based usage
export const educationalPdfService = new EducationalPdfGenerator();

/**
 * Hook to fetch and use educational PDFs
 */
export const useEducationalPdfs = () => {
  const [catalog, setCatalog] = useState<PdfCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch the PDF catalog
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const response = await fetch('/assets/pdfs/education/index.json');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF catalog: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setCatalog(data);
      } catch (err) {
        console.error('Error fetching PDF catalog:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  /**
   * Get all PDFs from a specific category
   */
  const getPdfsByCategory = useCallback((category: string): EducationalPdf[] => {
    if (!catalog || !catalog.categories || !catalog.categories[category]) {
      return [];
    }
    return catalog.categories[category];
  }, [catalog]);

  /**
   * Find a specific PDF by ID
   */
  const getPdfById = useCallback((id: string): EducationalPdf | undefined => {
    if (!catalog || !catalog.categories) return undefined;
    
    for (const category in catalog.categories) {
      if (catalog.categories[category]) {
        const found = catalog.categories[category].find(pdf => pdf.id === id);
        if (found) return found;
      }
    }
    
    return undefined;
  }, [catalog]);

  /**
   * Get PDFs related to a specific component
   */
  const getPdfsByComponent = useCallback((componentName: string): EducationalPdf[] => {
    if (!catalog || !catalog.categories) return [];
    
    const result: EducationalPdf[] = [];
    for (const category in catalog.categories) {
      if (catalog.categories[category]) {
        catalog.categories[category]
          .filter(pdf => pdf.relatedComponent === componentName)
          .forEach(pdf => result.push(pdf));
      }
    }
    
    return result;
  }, [catalog]);

  /**
   * Get PDFs related to a specific page
   */
  const getPdfsByPage = useCallback((pageName: string): EducationalPdf[] => {
    if (!catalog || !catalog.categories) return [];
    
    const result: EducationalPdf[] = [];
    for (const category in catalog.categories) {
      if (catalog.categories[category]) {
        catalog.categories[category]
          .filter(pdf => pdf.relatedPage === pageName)
          .forEach(pdf => result.push(pdf));
      }
    }
    
    return result;
  }, [catalog]);

  /**
   * Open a PDF in a new tab
   */
  const openPdf = useCallback((pdfId: string) => {
    const pdf = getPdfById(pdfId);
    if (pdf) {
      window.open(pdf.path, '_blank');
    } else {
      console.error(`PDF with ID ${pdfId} not found`);
    }
  }, [getPdfById]);

  return {
    catalog,
    loading,
    error,
    getPdfsByCategory,
    getPdfById,
    getPdfsByComponent,
    getPdfsByPage,
    openPdf
  };
};

/**
 * Generate a download URL for a PDF
 */
export const getPdfDownloadUrl = (pdfPath: string): string => {
  // Use the absolute URL to ensure the PDF is correctly referenced
  // regardless of the current route
  const baseUrl = window.location.origin;
  return `${baseUrl}${pdfPath}`;
};
