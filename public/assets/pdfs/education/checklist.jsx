const Checklist = ({ items }) => {
    if (!items || items.length === 0) {
      return <p>No checklist items available.</p>;
    }
  
    return (
      <div className="checklist">
        <ul style={{ 
          listStyleType: 'none', 
          padding: 0,
          margin: 0
        }}>
          {items.map((item, index) => (
            <li key={index} style={{ 
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'flex-start'
            }}>
              <div style={{ 
                width: '16px',
                height: '16px',
                border: '1px solid #666',
                borderRadius: '3px',
                marginRight: '8px',
                marginTop: '2px',
                flexShrink: 0
              }} />
              
              <div>
                <div style={{ fontSize: '14px' }}>
                  {item.text}
                </div>
                
                {item.note && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666',
                    marginTop: '0.25rem'
                  }}>
                    Note: {item.note}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  export default Checklist;