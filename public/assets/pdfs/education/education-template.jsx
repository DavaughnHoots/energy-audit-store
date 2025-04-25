import Branding from '../ui/Branding';
import QRCode from '../ui/QRCode';
import Legal from '../ui/Legal';

const EducationalTemplate = ({ data, title }) => {
  // Template configs
  const templateStyles = {
    insulation: {
      primaryColor: '#455A64', // Blue Grey
      accentColor: '#78909C',
      icon: '🏠'
    },
    solar: {
      primaryColor: '#FF5722', // Deep Orange
      accentColor: '#FF8A65',
      icon: '☀️'
    }
  };
  
  // Determine which template to use
  const templateType = title.toLowerCase().includes('insulation') ? 'insulation' : 'solar';
  const currentStyle = templateStyles[templateType];

  return (
    <div className="educational-template">
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
          {data.description || 'In-depth guide to improve your home energy efficiency.'}
        </p>
      </div>
      
      {/* Introduction */}
      <div className="introduction" style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
          {data.introduction || 'This educational guide provides detailed information to help you understand and implement advanced energy-saving techniques for your home.'}
        </p>
      </div>
      
      {/* Main content sections */}
      <div className="content-sections">
        {data.sections && data.sections.map((section, index) => (
          <div key={index} className="content-section" style={{ marginBottom: '2rem' }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: currentStyle.primaryColor,
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: `1px solid ${currentStyle.accentColor}30`
            }}>
              {section.title}
            </h2>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              {/* Section content */}
              <div style={{ flex: '1' }}>
                {Array.isArray(section.content) ? (
                  section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} style={{ 
                      fontSize: '14px', 
                      lineHeight: '1.6', 
                      marginBottom: '0.75rem' 
                    }}>
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    {section.content}
                  </p>
                )}
                
                {/* Bulleted list if present */}
                {section.bullets && (
                  <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem' }}>
                    {section.bullets.map((bullet, bIndex) => (
                      <li key={bIndex} style={{ 
                        fontSize: '14px', 
                        marginBottom: '0.5rem' 
                      }}>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {/* Section image if present */}
              {section.image && (
                <div style={{ 
                  width: '30%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <div style={{ 
                    width: '100%', 
                    height: '120px', 
                    backgroundColor: '#eee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}>
                    <span style={{ color: '#999' }}>
                      {section.image}
                    </span>
                  </div>
                  
                  {section.imageCaption && (
                    <p style={{ 
                      fontSize: '12px', 
                      textAlign: 'center',
                      marginTop: '0.5rem',
                      fontStyle: 'italic',
                      color: '#666'
                    }}>
                      {section.imageCaption}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Diagrams section for visual illustrations */}
      {data.diagrams && (
        <div className="diagrams-section" style={{ 
          marginBottom: '2rem', 
          padding: '1rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: currentStyle.primaryColor,
            marginBottom: '1rem'
          }}>
            Visual References
          </h2>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem'
          }}>
            {data.diagrams.map((diagram, index) => (
              <div key={index} style={{ 
                backgroundColor: 'white',
                padding: '1rem',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}>
                <div style={{ 
                  height: '120px',
                  border: '1px solid #eee',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{ color: '#999' }}>
                    {diagram.image || 'Diagram Placeholder'}
                  </span>
                </div>
                
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: currentStyle.primaryColor,
                  marginBottom: '0.5rem'
                }}>
                  {diagram.title}
                </h3>
                
                <p style={{ fontSize: '12px' }}>
                  {diagram.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Cost-benefit analysis section */}
      {data.costBenefit && (
        <div className="cost-benefit-section" style={{ 
          marginBottom: '2rem',
          border: `1px solid ${currentStyle.accentColor}`,
          borderRadius: '8px',
          padding: '1rem'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: currentStyle.primaryColor,
            marginBottom: '1rem'
          }}>
            Cost-Benefit Analysis
          </h2>
          
          <table style={{ 
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr>
                <th style={{ 
                  backgroundColor: currentStyle.primaryColor,
                  color: 'white',
                  padding: '0.5rem',
                  textAlign: 'left'
                }}>
                  Option
                </th>
                <th style={{ 
                  backgroundColor: currentStyle.primaryColor,
                  color: 'white',
                  padding: '0.5rem',
                  textAlign: 'center'
                }}>
                  Initial Cost
                </th>
                <th style={{ 
                  backgroundColor: currentStyle.primaryColor,
                  color: 'white',
                  padding: '0.5rem',
                  textAlign: 'center'
                }}>
                  Annual Savings
                </th>
                <th style={{ 
                  backgroundColor: currentStyle.primaryColor,
                  color: 'white',
                  padding: '0.5rem',
                  textAlign: 'center'
                }}>
                  Payback Period
                </th>
              </tr>
            </thead>
            <tbody>
              {data.costBenefit.map((item, index) => (
                <tr key={index} style={{ 
                  backgroundColor: index % 2 === 0 ? 'white' : '#f5f5f5'
                }}>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
                    <strong>{item.option}</strong>
                    {item.description && (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '0.25rem' }}>
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td style={{ 
                    padding: '0.5rem', 
                    textAlign: 'center',
                    borderBottom: '1px solid #ddd'
                  }}>
                    {item.initialCost}
                  </td>
                  <td style={{ 
                    padding: '0.5rem', 
                    textAlign: 'center',
                    borderBottom: '1px solid #ddd',
                    color: 'green'
                  }}>
                    {item.annualSavings}
                  </td>
                  <td style={{ 
                    padding: '0.5rem', 
                    textAlign: 'center',
                    borderBottom: '1px solid #ddd'
                  }}>
                    {item.paybackPeriod}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {data.costBenefitNotes && (
            <p style={{ 
              fontSize: '12px',
              fontStyle: 'italic',
              marginTop: '0.75rem'
            }}>
              Note: {data.costBenefitNotes}
            </p>
          )}
        </div>
      )}
      
      {/* Resources section */}
      {data.resources && (
        <div className="resources-section" style={{ marginBottom: '2rem' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: currentStyle.primaryColor,
            marginBottom: '0.75rem'
          }}>
            Additional Resources
          </h2>
          
          <ul style={{ 
            listStyleType: 'none',
            padding: '0',
            margin: '0'
          }}>
            {data.resources.map((resource, index) => (
              <li key={index} style={{ 
                marginBottom: '0.75rem',
                fontSize: '14px',
                display: 'flex'
              }}>
                <span style={{ 
                  color: currentStyle.primaryColor,
                  marginRight: '0.5rem'
                }}>
                  {resource.type === 'website' ? '🌐' : 
                   resource.type === 'video' ? '🎥' : 
                   resource.type === 'document' ? '📄' : '📚'}
                </span>
                <div>
                  <strong>{resource.title}</strong>
                  {resource.description && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '0.25rem' }}>
                      {resource.description}
                    </div>
                  )}
                </div>
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
            url={data.url || `https://example.com/guides/${templateType}`} 
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

export default EducationalTemplate;