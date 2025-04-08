import React, { useState, useEffect } from 'react';

interface ReadingProgressBarProps {
  color?: string;
  height?: number;
}

const ReadingProgressBar: React.FC<ReadingProgressBarProps> = ({ 
  color = '#10b981', // Default to green-500
  height = 4
}) => {
  const [readingProgress, setReadingProgress] = useState(0);
  
  useEffect(() => {
    const updateReadingProgress = () => {
      const currentPosition = window.scrollY;
      const scrollHeight = document.body.scrollHeight - window.innerHeight;
      
      if (scrollHeight) {
        setReadingProgress((currentPosition / scrollHeight) * 100);
      }
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', updateReadingProgress);
    
    // Initialize progress
    updateReadingProgress();
    
    // Clean up
    return () => window.removeEventListener('scroll', updateReadingProgress);
  }, []);
  
  return (
    <div 
      className="fixed top-0 left-0 w-full z-50 shadow-sm" 
      style={{ height: `${height}px` }}
    >
      <div 
        className="h-full transition-all duration-100 ease-out"
        style={{ 
          width: `${readingProgress}%`,
          backgroundColor: color
        }}
      ></div>
    </div>
  );
};

export default ReadingProgressBar;