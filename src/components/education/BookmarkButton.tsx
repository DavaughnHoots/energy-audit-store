// src/components/education/BookmarkButton.tsx
import React, { useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import useAuth from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// Temporary mock functions for bookmark functionality
// Will be replaced with actual API calls later
const mockBookmarkService = {
  addBookmark: async (id: string) => {
    console.log(`Adding bookmark for resource ${id}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  },
  removeBookmark: async (id: string) => {
    console.log(`Removing bookmark for resource ${id}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }
};

interface BookmarkButtonProps {
  resourceId: string;
  isBookmarked?: boolean;
  onBookmarkChange?: (isBookmarked: boolean) => void;
  variant?: 'icon-only' | 'with-text';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  resourceId,
  isBookmarked = false,
  onBookmarkChange,
  variant = 'icon-only',
  size = 'md',
  className = '',
}) => {
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [isUpdating, setIsUpdating] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Size mappings
  const sizeMap = {
    sm: { icon: 'h-4 w-4', button: 'h-7 w-7 p-1' },
    md: { icon: 'h-5 w-5', button: 'h-9 w-9 p-1.5' },
    lg: { icon: 'h-6 w-6', button: 'h-10 w-10 p-2' }
  };

  const handleToggleBookmark = async () => {
    if (!isAuthenticated) {
      // Redirect to login page
      navigate('/sign-in', { 
        state: { 
          from: window.location.pathname, 
          message: 'Please log in to bookmark resources'  
        } 
      });
      return;
    }

    setIsUpdating(true);
    
    try {
      if (bookmarked) {
        await mockBookmarkService.removeBookmark(resourceId);
      } else {
        await mockBookmarkService.addBookmark(resourceId);
      }
      
      const newBookmarkState = !bookmarked;
      setBookmarked(newBookmarkState);
      
      if (onBookmarkChange) {
        onBookmarkChange(newBookmarkState);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Could add toast notification here
    } finally {
      setIsUpdating(false);
    }
  };

  // Icon component based on state
  const BookmarkIcon = bookmarked ? BookmarkCheck : Bookmark;
  const iconClassName = bookmarked ? 'text-green-600 fill-green-600' : 'text-gray-500';
  const buttonLabel = bookmarked ? 'Bookmarked' : 'Bookmark';
  
  if (variant === 'icon-only') {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={`rounded-full ${sizeMap[size].button} ${className}`}
        onClick={handleToggleBookmark}
        disabled={isUpdating}
        aria-label={buttonLabel}
        title={buttonLabel}
      >
        <BookmarkIcon className={`${sizeMap[size].icon} ${iconClassName}`} />
      </Button>
    );
  }

  return (
    <Button
      variant={bookmarked ? "secondary" : "outline"}
      size="sm"
      className={`flex items-center gap-1.5 ${className}`}
      onClick={handleToggleBookmark}
      disabled={isUpdating}
    >
      <BookmarkIcon className={`${sizeMap.sm.icon} ${iconClassName}`} />
      <span>{buttonLabel}</span>
    </Button>
  );
};

export default BookmarkButton;
