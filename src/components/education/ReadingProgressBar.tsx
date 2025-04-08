import React, { useState, useEffect } from 'react';

const ReadingProgressBar: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  const calculateScrollProgress = () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight - windowHeight;
    const scrollTop = window.scrollY;
    const progress = (scrollTop / documentHeight) * 100;
    setScrollProgress(progress > 100 ? 100 : progress < 0 ? 0 : progress);
  };

  useEffect(() => {
    // Initial calculation
    calculateScrollProgress();

    // Add scroll event listener
    window.addEventListener('scroll', calculateScrollProgress);

    // Clean up
    return () => {
      window.removeEventListener('scroll', calculateScrollProgress);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 z-50 w-full h-1 bg-gray-200">
      <div 
        className="h-full bg-green-600 transition-all duration-100"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={scrollProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
};

export default ReadingProgressBar;