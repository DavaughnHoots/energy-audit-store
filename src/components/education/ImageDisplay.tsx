import React from 'react';

interface ImageDisplayProps {
  src: string;
  alt: string;
  caption?: string;
  width?: string;
  height?: string;
}

/**
 * ImageDisplay component for showing images with optional captions in educational content
 * Used by the ContentRenderer to display images within educational resources
 */
const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
  src, 
  alt, 
  caption, 
  width = "100%",
  height = "auto" 
}) => {
  // Extract filename from path for use in tracking/analytics
  const filename = src.split('/').pop() || 'image';
  
  return (
    <figure className="my-6 mx-auto">
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-auto object-cover" 
          style={{ maxWidth: width, height }}
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="text-sm text-gray-600 text-center mt-2 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

export default ImageDisplay;
