// src/pages/education-resources/ResourceContentPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { educationService } from '@/services/educationService';
import { resourceContents } from '@/data/educational-content';
import { EducationalResource } from '@/types/education';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bookmark, BookmarkCheck } from 'lucide-react';
import ProgressIndicator from '@/components/education/ProgressIndicator';
import StarRating from '@/components/education/StarRating';
import BookmarkButton from '@/components/education/BookmarkButton';
import { usePageTracking } from '@/hooks/analytics/usePageTracking';
import { useComponentTracking } from '@/hooks/analytics/useComponentTracking';

const ResourceContentPage: React.FC = () => {
  const { resourceId } = useParams<{ resourceId: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<EducationalResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // For analytics
  usePageTracking('education');
  const trackComponentEvent = useComponentTracking('education', 'ResourceContentPage');
  
  useEffect(() => {
    const loadResource = async () => {
      if (!resourceId) return;
      
      try {
        setLoading(true);
        const resourceData = await educationService.getResourceById(resourceId);
        
        if (!resourceData) {
          throw new Error('Resource not found');
        }
        
        setResource(resourceData);
        
        // Track progress if not already completed
        if (!resourceData.progress || resourceData.progress.status !== 'completed') {
          educationService.updateProgress(resourceId, {
            status: 'in_progress',
            percentComplete: 10
          });
        }
        
        trackComponentEvent('view_resource', { resourceId, resourceType: resourceData.type });
      } catch (err) {
        console.error('Error loading resource:', err);
        setError('Failed to load resource. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadResource();
  }, [resourceId]);
  
  const handleBookmarkChange = (isBookmarked: boolean) => {
    if (!resource) return;
    
    // Update the resource's bookmark status
    setResource({
      ...resource,
      is_bookmarked: isBookmarked
    });
  };
  
  const handleMarkComplete = async () => {
    if (!resourceId || !resource) return;
    
    try {
      await educationService.updateProgress(resourceId, {
        status: 'completed',
        percentComplete: 100
      });
      
      setResource({
        ...resource,
        progress: {
          ...resource.progress,
          status: 'completed',
          percentComplete: 100,
          lastAccessed: new Date().toISOString()
        }
      });
      
      trackComponentEvent('complete_resource', { resourceId });
    } catch (err) {
      console.error('Error marking resource as complete:', err);
    }
  };
  
  const contentData = resourceId ? resourceContents[resourceId] : null;
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  if (error || !resource || !contentData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            {error || "Resource not found"}
          </h2>
          <p className="text-red-600 mb-4">The requested educational resource could not be found.</p>
          <Button
            onClick={() => navigate('/education')}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Return to Education Page
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Navigation and actions */}
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          className="flex items-center text-gray-600 hover:text-gray-900"
          onClick={() => navigate('/education')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Resources
        </Button>
        
        <div className="flex items-center gap-3">
          {resource.progress && (
            <div className="flex items-center bg-white rounded-md border px-3 py-1.5">
              <ProgressIndicator
                progress={resource.progress}
                showPercentage={true}
                size="sm"
              />
            </div>
          )}
          
          <BookmarkButton
            resourceId={resource.id}
            isBookmarked={resource.is_bookmarked}
            onBookmarkChange={handleBookmarkChange}
          />
        </div>
      </div>
      
      {/* Resource header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{resource.title}</h1>
        
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
          <div className="capitalize px-2 py-1 bg-gray-100 rounded-full">
            {resource.type}
          </div>
          <div className="capitalize px-2 py-1 bg-gray-100 rounded-full">
            {resource.level}
          </div>
          <div className="capitalize px-2 py-1 bg-gray-100 rounded-full">
            {resource.topic.replace(/-/g, ' ')}
          </div>
          {resource.readTime && (
            <div className="px-2 py-1 bg-gray-100 rounded-full">
              {resource.readTime}
            </div>
          )}
        </div>
        
        {resource.rating && (
          <div className="flex items-center mb-4">
            <StarRating initialRating={resource.rating.average} readOnly />
            <span className="ml-2 text-sm text-gray-600">
              ({resource.rating.count} {resource.rating.count === 1 ? 'rating' : 'ratings'})
            </span>
          </div>
        )}
      </div>
      
      {/* Resource content */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden mb-8">
        {contentData.videoUrl && (
          <div className="w-full aspect-video bg-black mb-6">
            <iframe
              src={contentData.videoUrl}
              className="w-full h-full"
              title={resource.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}
        
        {contentData.infographicUrl && (
          <div className="mb-6">
            <img
              src={contentData.infographicUrl}
              alt={resource.title}
              className="w-full rounded-lg"
            />
          </div>
        )}
        
        <div className="px-6 py-8">
          <div 
            className="prose prose-green max-w-none"
            dangerouslySetInnerHTML={{ __html: contentData.content as string }}
          />
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-10">
        <div>
          <h3 className="text-base font-medium text-gray-900">
            {resource.progress?.status === 'completed' ? 'Completed' : 'Finish this resource?'}
          </h3>
          <p className="text-sm text-gray-600">
            {resource.progress?.status === 'completed' 
              ? 'You\'ve marked this resource as complete.' 
              : 'Mark this resource as complete to track your progress.'}
          </p>
        </div>
        
        <Button
          onClick={handleMarkComplete}
          disabled={resource.progress?.status === 'completed'}
          className={`${
            resource.progress?.status === 'completed' 
              ? 'bg-green-100 text-green-800 cursor-default' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {resource.progress?.status === 'completed' ? 'Completed' : 'Mark as Complete'}
        </Button>
      </div>
      
      {/* Related resources */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Continue your learning journey</h2>
        <p className="text-gray-600 mb-6">
          Explore more resources on {resource.topic.replace(/-/g, ' ')} to deepen your knowledge.
        </p>
        
        <Button
          onClick={() => navigate('/education')}
          variant="outline"
          className="border-green-200 text-green-700 hover:bg-green-50"
        >
          Browse More Resources
        </Button>
      </div>
    </div>
  );
};

export default ResourceContentPage;
