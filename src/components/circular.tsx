import React from 'react';

export function CircularProgress({ 
  percentage = 30, 
  size = 120, 
  strokeWidth = 8, 
  color = "#6366f1", // Blue/purple accent color
  trackColor = "#262b36" // Dark background ring color
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate how much stroke to hide based on percentage
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div 
      style={{ 
        position: 'relative', 
        width: size, 
        height: size, 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Active Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        />
      </svg>
      {/* Centered Percentage Text */}
      <span 
        style={{ 
          position: 'absolute', 
          color: '#ffffff', 
          fontSize: `${size * 0.22}px`, 
          fontWeight: '600' 
        }}
      >
        {percentage}%
      </span>
    </div>
  );
}