import React from 'react';

const CustomTooltip = ({ active, payload, label, coordinate }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const tooltipStyle = {
    position: 'absolute',
    left: coordinate ? coordinate.x + 20 : 0,
    top: coordinate ? coordinate.y - 50 : 0,
    zIndex: 9999,
    pointerEvents: 'none',
  };

  return (
    <div className="recharts-tooltip-wrapper" style={tooltipStyle}>
      <div className="custom-tooltip">
        <div className="tooltip-header">
          <h4 className="tooltip-title">{label}</h4>
        </div>
        <div className="tooltip-content">
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-item">
              <span className="tooltip-label">{entry.name}:</span>
              <span className="tooltip-value">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomTooltip;
