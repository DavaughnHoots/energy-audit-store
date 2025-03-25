// src/components/education/BookmarksView.tsx
import React, { useState, useEffect } from 'react';
import { EducationalResource } from '@/types/education';
import { educationService } from '@/services/educationService';
import ResourceCard from './ResourceCard';
import useAuth from '@/context/AuthContext';
import { Loader2, BookmarkX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookmarksViewProps {
  className?: string;
}

const BookmarksView: React.FC<BookmarksViewProps> = ({ className = '' }) => {
  const [bookmarks, setBookmarks] = useState<EducationalResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadBookmarks = async () => {
      try {
        setLoading(true);
        const bookmarkedResources = await educationService.getUserBookmarks();
        setBookmarks(bookmarkedResources);
        setError(null);
      } catch (err) {
        console.error('Error loading bookmarks:', err);
        setError('Failed to load your bookmarked resources. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, [isAuthenticated]);

  const handleBookmarkChange = async (resourceId: string, isBookmarked: boolean) => {
    // If the resource is being un-bookmarked, remove it from the list
    if (!isBookmarked) {
      setBookmarks(prev => prev.filter(resource => resource.id !== resourceId));
    }
  };

  // Not authenticated view
  if (!isAuthenticated) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 text-center ${className}`}>
        <BookmarkX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Sign in to see your bookmarks
        </h3>
        <p className="text-gray-600 mb-4">
          Bookmark educational resources to save them for later and track your progress.
        </p>
        <Button variant="default" className="mt-2">
          Sign In
        </Button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 flex justify-center items-center ${className}`}>
        <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 text-center ${className}`}>
        <BookmarkX className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Something went wrong
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Empty bookmarks
  if (bookmarks.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 text-center ${className}`}>
        <BookmarkX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No bookmarks yet
        </h3>
        <p className="text-gray-600 mb-4">
          Start bookmarking educational resources to save them for later.
        </p>
      </div>
    );
  }

  // Bookmarks list
  return (
    <div className={className}>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">My Bookmarks</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookmarks.map((resource) => (
          <ResourceCard 
            key={resource.id} 
            resource={resource} 
            // Pass a callback to handle bookmark removal
            onBookmarkChange={(isBookmarked) => handleBookmarkChange(resource.id, isBookmarked)}
          />
        ))}
      </div>
    </div>
  );
};

export default BookmarksView;
