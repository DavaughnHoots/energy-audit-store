const Branding = ({ primaryColor, accentColor }) => {
    return (
      <div className="branding" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div className="branding-logo" style={{
          display: 'flex',
          alignItems: 'center'
        }}>
          {/* Logo placeholder - in production, replace with actual logo image */}
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: primaryColor,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px'
          }}>
            <div style={{
              fontSize: '20px',
              color: 'white',
              fontWeight: 'bold'
            }}>
              EA
            </div>
          </div>
          
          <div>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: primaryColor,
              lineHeight: '1.2'
            }}>
              Energy Audit
            </div>
            <div style={{
              fontSize: '12px',
              color: accentColor
            }}>
              Smart Energy Solutions
            </div>
          </div>
        </div>
        
        <div className="branding-tagline" style={{
          fontStyle: 'italic',
          fontSize: '12px',
          color: '#666',
          maxWidth: '200px',
          textAlign: 'right'
        }}>
          Helping homeowners save energy and reduce utility costs since 2010
        </div>
      </div>
    );
  };
  
  export default Branding;