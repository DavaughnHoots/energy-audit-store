// src/components/education/pdf/ui/ChecklistItem.tsx
import React from 'react';

interface ChecklistItemProps {
  text: string;
  note?: string;
  checked?: boolean;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ 
  text, 
  note,
  checked = false
}) => {
  return (
    <div className="checklist-item" style={{
      display: 'flex',
      alignItems: 'flex-start',
      marginBottom: '12px',
      pageBreakInside: 'avoid'
    }}>
      <div className="checkbox" style={{
        width: '16px',
        height: '16px',
        border: '1px solid #999',
        borderRadius: '3px',
        marginRight: '10px',
        marginTop: '4px',
        backgroundColor: checked ? '#1E88E5' : 'white',
        position: 'relative'
      }}>
        {checked && (
          <div style={{
            position: 'absolute',
            top: '1px',
            left: '5px',
            width: '6px',
            height: '10px',
            borderRight: '2px solid white',
            borderBottom: '2px solid white',
            transform: 'rotate(45deg)'
          }} />
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div className="item-text" style={{
          fontSize: '14px',
          fontWeight: 'normal',
          color: '#333',
          lineHeight: '1.4'
        }}>
          {text}
        </div>
        {note && (
          <div className="item-note" style={{
            fontSize: '12px',
            color: '#666',
            fontStyle: 'italic',
            marginTop: '4px'
          }}>
            {note}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistItem;
