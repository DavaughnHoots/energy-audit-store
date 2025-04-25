// src/components/education/pdf/templates/EducationalTemplate.tsx
import React from 'react';
import { EducationalResource } from '@/types/education';
import { PDFTemplateProps } from '@/types/pdf';
import PDFHeader from '../ui/PDFHeader';
import PDFFooter from '../ui/PDFFooter';
import SectionHeader from '../ui/SectionHeader';
import { formatDateForPDF } from '../utils/PDFUtils';

const EducationalTemplate: React.FC<PDFTemplateProps> = ({ 
  resource,
  options 
}) => {
  // Parse content - assumes content is in markdown-like format with headers
  // This is a simplified version that would need to be enhanced
  // based on your actual content structure
  const renderContent = () => {
    if (!resource.contentFile && !resource.description) {
      return (
        <div className="placeholder-content" style={{ color: '#666', fontStyle: 'italic' }}>
          No content available for this resource.
        </div>
      );
    }

    // If we're using the description only, render that
    if (!resource.contentFile) {
      return (
        <div className="content-description" style={{ marginBottom: '20px' }}>
          <p>{resource.description}</p>
        </div>
      );
    }

    // In a real implementation, fetch and render the content from contentFile
    // For now, we'll render a placeholder structure
    return (
      <div className="content-sections">
        <div style={{ marginBottom: '30px' }}>
          <SectionHeader title="Introduction" level={2} />
          <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
            {resource.description}
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <SectionHeader title="Key Concepts" level={2} />
          <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
            This section would typically explain the key concepts related to {resource.title}.
            The content would be loaded dynamically from the content file referenced in the resource data.
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <SectionHeader title="Benefits" level={2} />
          <ul style={{ 
            fontSize: '14px', 
            lineHeight: '1.6', 
            marginBottom: '20px',
            paddingLeft: '20px'
          }}>
            <li style={{ marginBottom: '10px' }}>Increased energy efficiency</li>
            <li style={{ marginBottom: '10px' }}>Lower utility bills</li>
            <li style={{ marginBottom: '10px' }}>Improved comfort</li>
            <li style={{ marginBottom: '10px' }}>Reduced environmental impact</li>
          </ul>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <SectionHeader title="Implementation" level={2} />
          <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
            Detailed implementation guidelines would be provided here, along with best practices
            and considerations for different scenarios.
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <SectionHeader title="Resources" level={2} />
          <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '10px' }}>
            Additional resources to learn more about {resource.title}:
          </p>
          <ul style={{ 
            fontSize: '14px', 
            lineHeight: '1.6', 
            marginBottom: '20px',
            paddingLeft: '20px'
          }}>
            <li style={{ marginBottom: '5px' }}>
              <a href="#" style={{ color: '#1E88E5', textDecoration: 'none' }}>
                Resource 1
              </a>
            </li>
            <li style={{ marginBottom: '5px' }}>
              <a href="#" style={{ color: '#1E88E5', textDecoration: 'none' }}>
                Resource 2
              </a>
            </li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="educational-template" style={{
      fontFamily: 'Arial, sans-serif',
      color: '#333',
      backgroundColor: '#fff',
      maxWidth: '210mm', // A4 width
      margin: '0 auto',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <PDFHeader 
        title={resource.title}
        showLogo={options?.showLogo !== false}
      />
      
      <div className="resource-meta" style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#666',
        marginBottom: '30px'
      }}>
        <div>
          <span style={{ 
            display: 'inline-block', 
            backgroundColor: '#f0f0f0', 
            padding: '3px 8px',
            borderRadius: '4px',
            marginRight: '10px',
            textTransform: 'uppercase',
            fontSize: '10px'
          }}>
            {resource.topic.replace(/-/g, ' ')}
          </span>
          <span style={{ 
            display: 'inline-block', 
            backgroundColor: '#f0f0f0', 
            padding: '3px 8px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            fontSize: '10px'
          }}>
            {resource.level}
          </span>
        </div>
        <div>
          Published: {formatDateForPDF(resource.datePublished)}
        </div>
      </div>
      
      <SectionHeader 
        title="Overview" 
        level={1}
      />
      
      <div className="main-content">
        {renderContent()}
      </div>
      
      <PDFFooter 
        pageNumber={1} 
        totalPages={1}
        showDisclaimer={true}
      />
    </div>
  );
};

export default EducationalTemplate;
