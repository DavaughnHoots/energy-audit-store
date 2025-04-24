import React from 'react';
import RoadmapFeature from './RoadmapFeature';

/**
 * RoadmapSection - A wrapper component that directly imports RoadmapFeature
 * This avoids the dynamic import which was causing Material UI errors
 */
const RoadmapSection: React.FC = () => {
  return (
    <div className="border-t pt-6">
      <h2 className="text-xl font-bold mb-4">Website Roadmap Builder</h2>
      <p className="text-gray-600 mb-4">
        Create a website roadmap based on the most used features and most visited pages data.
      </p>
      
      {/* Direct import of RoadmapFeature */}
      <RoadmapFeature />
    </div>
  );
};

export default RoadmapSection;
