import Branding from '../ui/Branding';
import QRCode from '../ui/QRCode';
import Legal from '../ui/Legal';

const CalendarTemplate = ({ data, title }) => {
  // Months configuration
  const months = [
    'January', 'February', 'March', 'April', 
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];

  // Seasons mapping
  const seasons = {
    winter: ['December', 'January', 'February'],
    spring: ['March', 'April', 'May'],
    summer: ['June', 'July', 'August'],
    fall: ['September', 'October', 'November']
  };

  // Get season for a given month
  const getSeasonForMonth = (month) => {
    return Object.keys(seasons).find(season => 
      seasons[season].includes(month)
    );
  };

  // Colors mapping for seasons
  const seasonColors = {
    spring: {
      primaryColor: '#4CAF50', // Green
      accentColor: '#8BC34A',
      bgColor: '#E8F5E9'
    },
    summer: {
      primaryColor: '#2196F3', // Blue
      accentColor: '#03A9F4',
      bgColor: '#E3F2FD'
    },
    fall: {
      primaryColor: '#FF9800', // Orange
      accentColor: '#FFC107',
      bgColor: '#FFF3E0'
    },
    winter: {
      primaryColor: '#9C27B0', // Purple
      accentColor: '#673AB7',
      bgColor: '#F3E5F5'
    }
  };

  return (
    <div className="calendar-template">
      {/* Header with branding */}
      <Branding 
        primaryColor="#1976D2" 
        accentColor="#42A5F5"
      />
      
      {/* Title section */}
      <div className="title-section" style={{ 
        color: '#1976D2',
        borderBottom: '2px solid #42A5F5',
        padding: '1rem 0',
        marginBottom: '1.5rem'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '10px' }}>📅</span>
          {title}
        </h1>
        <p style={{ marginTop: '0.5rem', fontSize: '16px', color: '#555' }}>
          {data.description || 'Month-by-month guide to energy efficiency tasks for your home.'}
        </p>
      </div>
      
      {/* Introduction */}
      <div className="introduction" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
          {data.introduction || 'Use this calendar as your year-round guide to maintaining an energy-efficient home. Each month features targeted tasks to optimize your energy usage based on seasonal needs.'}
        </p>
      </div>
      
      {/* Monthly Calendar */}
      <div className="months-grid" style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {months.map((month, index) => {
          const season = getSeasonForMonth(month);
          const colors = seasonColors[season];
          
          // Get tasks for this month
          const monthData = data.months && data.months.find(m => 
            m.name.toLowerCase() === month.toLowerCase()
          );
          
          return (
            <div key={index} style={{ 
              backgroundColor: colors.bgColor,
              borderRadius: '8px',
              padding: '1rem',
              border: `1px solid ${colors.accentColor}`
            }}>
              <h3 style={{ 
                color: colors.primaryColor,
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                {month}
                <span style={{ 
                  fontSize: '12px',
                  backgroundColor: colors.primaryColor,
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {season}
                </span>
              </h3>
              
              <ul style={{ 
                listStyleType: 'none',
                padding: '0',
                margin: '0',
                fontSize: '12px'
              }}>
                {monthData && monthData.tasks ? (
                  monthData.tasks.map((task, taskIndex) => (
                    <li key={taskIndex} style={{ 
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'flex-start' 
                    }}>
                      <span style={{ 
                        minWidth: '20px',
                        height: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.primaryColor,
                        color: 'white',
                        borderRadius: '50%',
                        fontSize: '10px',
                        marginRight: '6px',
                        marginTop: '2px'
                      }}>
                        {taskIndex + 1}
                      </span>
                      {task}
                    </li>
                  ))
                ) : (
                  <li>No specific tasks for this month.</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
      
      {/* Seasonal Transition Guides */}
      {data.transitions && (
        <div className="seasonal-transitions" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: '#1976D2',
            marginBottom: '1rem'
          }}>
            Seasonal Transition Guides
          </h2>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
          }}>
            {data.transitions.map((transition, index) => {
              const fromSeason = transition.from;
              const toSeason = transition.to;
              const fromColors = seasonColors[fromSeason];
              const toColors = seasonColors[toSeason];
              
              return (
                <div key={index} style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundImage: `linear-gradient(to right, ${fromColors.bgColor}, ${toColors.bgColor})`,
                  border: '1px solid #ddd'
                }}>
                  <h3 style={{ 
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: fromColors.primaryColor }}>{fromSeason}</span>
                    <span style={{ margin: '0 0.5rem' }}>→</span>
                    <span style={{ color: toColors.primaryColor }}>{toSeason}</span>
                  </h3>
                  
                  <ul style={{
                    fontSize: '12px',
                    paddingLeft: '1.5rem',
                    margin: '0'
                  }}>
                    {transition.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} style={{ marginBottom: '0.25rem' }}>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Footer with QR code and legal */}
      <div className="footer" style={{ 
        marginTop: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderTop: '1px solid #42A5F5',
        paddingTop: '1rem'
      }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            For more information:
          </p>
          <QRCode 
            url={data.url || 'https://example.com/energy-calendar'} 
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

export default CalendarTemplate;