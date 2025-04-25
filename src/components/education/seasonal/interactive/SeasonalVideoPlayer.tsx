import React, { useState } from 'react';
// Mock implementation of useComponentTracking hook
const useComponentTracking = (section: string, component: string) => {
  return (event: string, data?: any) => {
    console.log(`Analytics: ${section}.${component} - ${event}`, data);
    // In a real implementation, this would send analytics data
  };
};
import { Play, X } from 'lucide-react';

interface SeasonalVideoPlayerProps {
  title: string;
  description?: string;
  videoId?: string; // YouTube video ID
  startTime?: number; // Start time in seconds
}

const SeasonalVideoPlayer: React.FC<SeasonalVideoPlayerProps> = ({
  title,
  description,
  videoId = '7xwVNg0cZAo', // Default to the Minnesota Department of Commerce video
  startTime = 101, // Default start time at 1:41
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const trackComponentEvent = useComponentTracking('education', 'SeasonalVideoPlayer');

  const handlePlayClick = () => {
    setModalOpen(true);
    trackComponentEvent('video_play', { title, videoId });
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    trackComponentEvent('video_close', { title, videoId });
  };

  return (
    <div className="my-6">
      {/* Video thumbnail with play button */}
      <div 
        className="relative rounded-lg overflow-hidden cursor-pointer bg-gray-200 shadow-md"
        onClick={handlePlayClick}
      >
        <div className="aspect-video flex items-center justify-center bg-gradient-to-r from-green-700 to-green-500 text-white">
          <div className="text-center p-6">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
                <Play className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            {description && <p className="text-sm text-green-100">{description}</p>}
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-green-600 bg-opacity-80 flex items-center justify-center shadow-lg hover:bg-opacity-100 transition-all duration-200 transform hover:scale-105">
            <Play className="h-8 w-8 text-white" fill="white" />
          </div>
        </div>
      </div>

      {/* Video modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full relative overflow-hidden">
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 z-10 p-1 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="aspect-video bg-black">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}${startTime ? `?start=${startTime}` : ''}`}
                title="Seasonal Energy Strategies Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="p-4 border-t">
              <h3 className="font-bold text-lg">{title}</h3>
              {description && <p className="text-sm text-gray-600">{description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonalVideoPlayer;