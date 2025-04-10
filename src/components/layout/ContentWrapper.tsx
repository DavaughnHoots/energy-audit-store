import React from 'react';
import { useLocation } from 'react-router-dom';
import PilotStudyBanner from '../PilotStudyBanner';

interface ContentWrapperProps {
  children: React.ReactNode;
}

const ContentWrapper: React.FC<ContentWrapperProps> = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;
  
  // Only show the banner on these specific paths
  const showBanner = ['/', '/products', '/energy-audit', '/community'].includes(path);
  
  return (
    <>
      {showBanner && <PilotStudyBanner />}
      {children}
    </>
  );
};

export default ContentWrapper;
