import Branding from '../ui/Branding';
import Checklist from '../ui/Checklist';
import QRCode from '../ui/QRCode';
import Legal from '../ui/Legal';

const ChecklistTemplate = ({ data, season, title }) => {
  // Map seasons to their corresponding colors and icons
  const seasonStyles = {
    spring: {
      primaryColor: '#4CAF50', // Green
      accentColor: '#8BC34A',
      icon: '🌱'
    },
    summer: {
      primaryColor: '#2196F3', // Blue
      accentColor: '#03A9F4',
      icon: '☀️'
    },
    fall: {
      primaryColor: '#FF9800', // Orange
      accentColor: '#FFC107',
      icon: '🍂'
    },
    winter: {
      primaryColor: '#9C27B0', // Purple
      accentColor: '#673AB7',
      icon: '❄️'
    }
  };

  const currentStyle = seasonStyles[season] || seasonStyles.spring;

  return (
    <div className="checklist-template">
      {/* Header with branding */}
      <Branding 
        primaryColor={currentStyle.primaryColor} 
        accentColor={currentStyle.accentColor}
      />
      
      {/* Title section */}
      <div className="title-section" style={{ 
        color: currentStyle.primaryColor,
        borderBottom: `2px solid ${currentStyle.accentColor}`,
        padding: '1rem 0',
        marginBottom: '1.5rem'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '10px' }}>{currentStyle.icon}</span>
          {title}
        </h1>
        <p style={{ marginTop: '0.5rem', fontSize: '16px', color: '#555' }}>
          {data.description || `Essential energy-saving tips for ${season}.`}
        </p>
      </div>
      
      {/* Introduction */}
      <div className="introduction" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
          {data.introduction || `Use this checklist to prepare your home for ${season} and maximize energy efficiency. Complete these tasks to save energy and reduce your utility bills.`}
        </p>
      </div>
      
      {/* Checklist sections */}
      <div className="checklist-sections">
        {data.sections && data.sections.map((section, index) => (
          <div key={index} className="checklist-section" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: currentStyle.primaryColor,
              marginBottom: '0.75rem'
            }}>
              {section.title}
            </h2>
            
            <Checklist items={section.items} />
          </div>
        ))}
      </div>
      
      {/* Tips section */}
      {data.tips && (
        <div className="tips-section" style={{ 
          backgroundColor: `${currentStyle.accentColor}20`, 
          padding: '1rem', 
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: currentStyle.primaryColor,
            marginBottom: '0.75rem'
          }}>
            Pro Tips
          </h2>
          
          <ul style={{ paddingLeft: '1.5rem' }}>
            {data.tips.map((tip, index) => (
              <li key={index} style={{ marginBottom: '0.5rem', fontSize: '14px' }}>
                <span style={{ fontWeight: 'bold', color: currentStyle.primaryColor }}>{tip.title}: </span>
                {tip.description}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Footer with QR code and legal */}
      <div className="footer" style={{ 
        marginTop: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderTop: `1px solid ${currentStyle.accentColor}`,
        paddingTop: '1rem'
      }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            For more information:
          </p>
          <QRCode 
            url={data.url || `https://example.com/energy-tips/${season}`} 
            size={80}
          />
          <p style={{ fontSize: '12px', marginTop: '0.5rem' }}>
            Scan this QR code to visit our website
          </p>
        </div>
        
        <div style={{ maxWidth: '60%' }}>
          <p style={{ 
            fontSize: '12px', 
            marginBottom: '0.5rem',
            color: '#555'
          }}>
            Contact us: info@energyaudits.com | (555) 123-4567
          </p>
          
          <Legal />
        </div>
      </div>
    </div>
  );
};

export default ChecklistTemplate;