// src/components/education/ResourceDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/Dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EducationalResource, ResourceRatingInfo } from '@/types/education';
import { educationService } from '@/services/educationService';
import { Loader2, ExternalLink, Bookmark, BookmarkCheck } from 'lucide-react';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import ReviewsList from './ReviewsList';
import ProgressIndicator from './ProgressIndicator';
import BookmarkButton from './BookmarkButton';
import { cn } from '@/lib/utils';
import useAuth from '@/context/AuthContext';

interface ResourceDetailModalProps {
  resourceId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resourceId,
  isOpen,
  onClose,
}) => {
  const [resource, setResource] = useState<EducationalResource | null>(null);
  const [ratingInfo, setRatingInfo] = useState<ResourceRatingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchResourceDetails = async () => {
      if (!isOpen || !resourceId) return;

      try {
        setLoading(true);
        
        // Fetch resource and rating data in parallel
        const [resourceData, ratingData] = await Promise.all([
          educationService.getResourceById(resourceId),
          educationService.getResourceRatingInfo(resourceId)
        ]);
        
        if (!resourceData) {
          throw new Error('Resource not found');
        }
        
        setResource(resourceData);
        setRatingInfo(ratingData);
        setError(null);
      } catch (err) {
        console.error('Error fetching resource details:', err);
        setError('Failed to load resource details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResourceDetails();
  }, [resourceId, isOpen]);

  const handleReviewSubmit = () => {
    // Refresh rating data after submitting a review
    educationService.getResourceRatingInfo(resourceId)
      .then(data => {
        setRatingInfo(data);
        setShowReviewForm(false);
      })
      .catch(err => {
        console.error('Error updating ratings after review:', err);
      });
  };

  const handleBookmarkChange = (isBookmarked: boolean) => {
    if (!resource) return;
    
    // Update the resource's bookmark status
    setResource({
      ...resource,
      is_bookmarked: isBookmarked
    });
  };

  // Create rating distribution bars
  const renderRatingDistribution = () => {
    if (!ratingInfo?.distribution) return null;
    
    // Find the highest count for scaling
    const maxCount = Math.max(...Object.values(ratingInfo.distribution));
    
    return (
      <div className="mt-4 space-y-1">
        {[5, 4, 3, 2, 1].map(rating => {
          const count = ratingInfo.distribution?.[rating] || 0;
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
          
          return (
            <div key={rating} className="flex items-center gap-2">
              <div className="w-2 text-xs text-gray-600">{rating}</div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-yellow-400 h-full rounded-full" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-8 text-xs text-right text-gray-600">{count}</div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!isOpen) return null;
  
  // Use createPortal to ensure the modal is rendered at the root level of the DOM
  return createPortal(
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-green-500 animate-spin mb-4" />
            <p className="text-gray-600">Loading resource details...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p>{error}</p>
            <Button variant="outline" onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        ) : resource ? (
          <>
            <DialogHeader>
              <div className="flex justify-between items-start">
                <DialogTitle className="text-xl text-gray-900">{resource.title}</DialogTitle>
                <BookmarkButton 
                  resourceId={resource.id}
                  isBookmarked={resource.is_bookmarked}
                  onBookmarkChange={handleBookmarkChange}
                />
              </div>
              <DialogDescription>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                  <div>
                    {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                  </div>
                  <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                  <div>
                    {resource.level.charAt(0).toUpperCase() + resource.level.slice(1)}
                  </div>
                  <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                  <div>
                    {resource.topic.replace(/-/g, ' ').toUpperCase()}
                  </div>
                  {resource.readTime && (
                    <>
                      <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                      <div>{resource.readTime}</div>
                    </>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            
            <div className="relative">
              <img 
                src={resource.thumbnail} 
                alt={resource.title}
                className="w-full h-64 object-cover rounded-md"
              />
              
              {/* Rating overlay on the image */}
              {ratingInfo && (
                <div className="absolute bottom-3 right-3 bg-black/60 text-white px-3 py-1.5 rounded-full flex items-center">
                  <StarRating 
                    initialRating={ratingInfo.average} 
                    readOnly 
                    size="sm"
                  />
                  <span className="ml-2 text-sm font-medium">
                    {ratingInfo.average.toFixed(1)} ({ratingInfo.count})
                  </span>
                </div>
              )}
              
              {/* Progress indicator if user has started */}
              {resource.progress && (
                <div className="absolute bottom-3 left-3 bg-white/90 rounded-md p-2">
                  <ProgressIndicator 
                    progress={resource.progress}
                    showPercentage={true}
                    size="sm"
                  />
                </div>
              )}
            </div>
            
            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="reviews">
                  Reviews {ratingInfo && `(${ratingInfo.count})`}
                </TabsTrigger>
                <TabsTrigger value="related">Related</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="pt-4">
                <div className="space-y-4">
                  <p className="text-gray-700">{resource.description}</p>
                  
                  {/* Tags */}
                  {resource.tags && resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {resource.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Rating summary */}
                  {ratingInfo && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Rating Summary</h3>
                      <div className="flex items-start gap-6">
                        <div className="flex flex-col items-center">
                          <div className="text-3xl font-bold text-gray-900">
                            {ratingInfo.average.toFixed(1)}
                          </div>
                          <StarRating 
                            initialRating={ratingInfo.average} 
                            readOnly 
                            size="sm"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {ratingInfo.count} {ratingInfo.count === 1 ? 'review' : 'reviews'}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          {renderRatingDistribution()}
                        </div>
                      </div>
                      
                      {isAuthenticated && (
                        <div className="mt-4">
                          {showReviewForm ? (
                            <ReviewForm 
                              resourceId={resource.id}
                              initialRating={ratingInfo.userRating}
                              onSubmitSuccess={handleReviewSubmit}
                              onCancel={() => setShowReviewForm(false)}
                            />
                          ) : (
                            <Button 
                              variant="outline" 
                              onClick={() => setShowReviewForm(true)}
                              className="text-green-600 border-green-300 hover:border-green-500"
                            >
                              {ratingInfo.userRating ? 'Edit Your Review' : 'Write a Review'}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="pt-4">
                {isAuthenticated && !showReviewForm && (
                  <div className="mb-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowReviewForm(true)}
                      className="mb-4 text-green-600 border-green-300 hover:border-green-500"
                    >
                      {ratingInfo?.userRating ? 'Edit Your Review' : 'Write a Review'}
                    </Button>
                    
                    {showReviewForm && (
                      <ReviewForm 
                        resourceId={resource.id}
                        initialRating={ratingInfo?.userRating}
                        onSubmitSuccess={handleReviewSubmit}
                        onCancel={() => setShowReviewForm(false)}
                      />
                    )}
                  </div>
                )}
                
                <ReviewsList 
                  resourceId={resource.id}
                  maxDisplayed={5}
                />
              </TabsContent>
              
              <TabsContent value="related" className="pt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* This would show related resources */}
                  <p className="col-span-2 text-gray-600 text-center py-8">
                    Related resources will be displayed here.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 flex justify-between">
              <Button 
                variant="ghost" 
                onClick={onClose}
              >
                Close
              </Button>
              
              <Button 
                variant="default" 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => window.open(resource.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Resource
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>,
    document.body // Render directly to the body element
  );
};

export default ResourceDetailModal;
