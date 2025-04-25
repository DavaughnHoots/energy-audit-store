import ChecklistTemplate from './templates/ChecklistTemplate';
import CalendarTemplate from './templates/CalendarTemplate';
import EducationalTemplate from './templates/EducationalTemplate';

const PDFPreview = ({ templateType, data, title }) => {
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

  return (
    <div className="pdf-preview">
      <div className="bg-white border shadow-lg mx-auto" style={{ 
        width: '210mm', 
        minHeight: '297mm', 
        padding: '10mm',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        {renderTemplate()}
      </div>
    </div>
  );
};

export default PDFPreview;