// src/components/education/pdf/templates/ChecklistTemplate.tsx
import React from 'react';
import { EducationalResource } from '@/types/education';
import { PDFTemplateProps } from '@/types/pdf';
import PDFHeader from '../ui/PDFHeader';
import PDFFooter from '../ui/PDFFooter';
import SectionHeader from '../ui/SectionHeader';
import ChecklistItem from '../ui/ChecklistItem';
import { formatDateForPDF } from '../utils/PDFUtils';

interface ChecklistSection {
  title: string;
  items: Array<{ text: string; note?: string; checked?: boolean }>;
}

const ChecklistTemplate: React.FC<PDFTemplateProps> = ({
  resource,
  options
}) => {
  // This would typically come from the resource content
  // For demonstration, we're creating sample data
  const checklistSections: ChecklistSection[] = [
    {
      title: 'Energy Efficiency Checks',
      items: [
        { text: 'Inspect insulation in attic and walls', note: 'Look for gaps or settling' },
        { text: 'Check weather stripping around doors and windows', note: 'Replace if worn or missing' },
        { text: 'Clean or replace HVAC filters', note: 'Recommended every 1-3 months' },
        { text: 'Inspect ductwork for leaks', note: 'Seal with appropriate tape or mastic' }
      ]
    },
    {
      title: 'Maintenance Tasks',
      items: [
        { text: 'Schedule HVAC system tune-up', note: 'Recommended annually before peak season' },
        { text: 'Clean refrigerator coils', note: 'Improves efficiency and extends appliance life' },
        { text: 'Inspect and clean ceiling fans', note: 'Ensure proper rotation for the season' },
        { text: 'Check water heater temperature settings', note: 'Recommended: 120°F (49°C)' }
      ]
    },
    {
      title: 'Smart Home Optimization',
      items: [
        { text: 'Program thermostat for seasonal settings', note: 'Set appropriate day/night temperatures' },
        { text: 'Check smart lighting schedules', note: 'Adjust for seasonal daylight changes' },
        { text: 'Review energy usage patterns in home energy app', note: 'Identify areas for improvement' }
      ]
    }
  ];

  return (
    <div className="checklist-template" style={{
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
        marginBottom: '20px'
      }}>
        <div>
          <span style={{
            display: 'inline-block',
            backgroundColor: '#f0f0f0',
            padding: '3px 8px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            fontSize: '10px'
          }}>
            {resource.topic.replace(/-/g, ' ')}
          </span>
        </div>
        <div>
          Created: {formatDateForPDF(resource.datePublished)}
        </div>
      </div>

      <div className="checklist-introduction" style={{ marginBottom: '30px' }}>
        <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
          {resource.description || 
            `Use this checklist to ensure your home is energy efficient during ${resource.topic.includes('summer') ? 'summer' : 
              resource.topic.includes('winter') ? 'winter' : 
              resource.topic.includes('spring') ? 'spring' : 
              resource.topic.includes('fall') ? 'fall' : 'all seasons'}.`
          }
        </p>
      </div>

      {checklistSections.map((section, index) => (
        <div key={index} className="checklist-section" style={{ marginBottom: '30px' }}>
          <SectionHeader title={section.title} level={2} />
          <div className="checklist-items">
            {section.items.map((item, itemIndex) => (
              <ChecklistItem
                key={itemIndex}
                text={item.text}
                note={item.note}
                checked={item.checked || false}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="checklist-notes" style={{ 
        marginTop: '40px',
        padding: '15px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px',
        fontSize: '13px'
      }}>
        <SectionHeader title="Notes" level={3} withAccent={false} />
        <p style={{ fontSize: '13px', lineHeight: '1.5', fontStyle: 'italic' }}>
          Use this space to record observations, measurements, or follow-up actions needed.
        </p>
        <div style={{ 
          height: '100px',
          borderBottom: '1px dashed #ccc',
          marginBottom: '10px' 
        }}></div>
        <div style={{ 
          height: '100px',
          borderBottom: '1px dashed #ccc',
          marginBottom: '10px' 
        }}></div>
      </div>

      <PDFFooter
        pageNumber={1}
        totalPages={1}
        showDisclaimer={true}
      />
    </div>
  );
};

export default ChecklistTemplate;
