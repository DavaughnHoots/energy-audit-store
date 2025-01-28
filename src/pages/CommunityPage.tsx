// src/pages/CommunityPage.tsx

import React, { useState } from 'react';
import { MessageSquare, Users, Trophy, Search, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

type TopicType = 'discussion' | 'success-story' | 'tip';
type Category = 'energy-savings' | 'home-improvement' | 'product-reviews' | 'general';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: string;
  type: TopicType;
  category: Category;
  likes: number;
  comments: number;
  datePosted: string;
  avatar: string;
}

const CommunityPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TopicType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  // This would typically come from an API
  const posts: CommunityPost[] = [
    {
      id: '1',
      title: 'Reduced My Energy Bill by 40%',
      content: 'After implementing the recommendations from my energy audit...',
      author: 'Sarah Johnson',
      type: 'success-story',
      category: 'energy-savings',
      likes: 45,
      comments: 12,
      datePosted: '2024-01-20',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: '2',
      title: 'Best Smart Thermostats Discussion',
      content: 'Looking for recommendations on energy-efficient thermostats...',
      author: 'Mike Chen',
      type: 'discussion',
      category: 'product-reviews',
      likes: 32,
      comments: 28,
      datePosted: '2024-01-22',
      avatar: '/api/placeholder/40/40'
    },
    // Additional posts would be loaded from backend
  ];

  const getPostIcon = (type: TopicType) => {
    switch (type) {
      case 'discussion':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'success-story':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'tip':
        return <Users className="h-5 w-5 text-green-500" />;
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || post.type === selectedType;
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Community Hub</h1>
          <p className="mt-4 text-lg text-gray-600">
            Connect with fellow homeowners, share your energy-saving success stories, and learn from others' experiences
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search discussions..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Type Filter */}
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as TopicType | 'all')}
            >
              <option value="all">All Types</option>
              <option value="discussion">Discussions</option>
              <option value="success-story">Success Stories</option>
              <option value="tip">Tips & Advice</option>
            </select>

            {/* Category Filter */}
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as Category | 'all')}
            >
              <option value="all">All Categories</option>
              <option value="energy-savings">Energy Savings</option>
              <option value="home-improvement">Home Improvement</option>
              <option value="product-reviews">Product Reviews</option>
              <option value="general">General Discussion</option>
            </select>
          </div>
        </div>

        {/* Create Post Button */}
        <div className="mb-8">
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200">
            Start a Discussion
          </button>
        </div>

        {/* Posts Grid */}
        {filteredPosts.length > 0 ? (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
                <div className="flex items-start gap-4">
                  <img
                    src={post.avatar}
                    alt={post.author}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getPostIcon(post.type)}
                      <Badge variant="outline" className="text-xs">
                        {post.category.replace('-', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Posted by {post.author} on {new Date(post.datePosted).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <button className="flex items-center gap-1 hover:text-green-600">
                        <ThumbsUp className="h-4 w-4" />
                        {post.likes}
                      </button>
                      <button className="flex items-center gap-1 hover:text-green-600">
                        <MessageSquare className="h-4 w-4" />
                        {post.comments}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              No posts found matching your search criteria. Try adjusting your filters or start a new discussion.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
