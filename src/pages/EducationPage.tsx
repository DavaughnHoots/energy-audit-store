import React, { useState } from 'react';
import { Search, BookOpen, Video, PieChart, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ResourceType = 'article' | 'video' | 'infographic';
type ResourceTopic = 'home-appliances' | 'insulation' | 'renewable-energy' | 'energy-management';

interface EducationalResource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  topic: ResourceTopic;
  readTime?: string;
  thumbnail: string;
  url: string;
  datePublished: string;
}

const EducationPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all');
  const [selectedTopic, setSelectedTopic] = useState<ResourceTopic | 'all'>('all');

  // This would typically come from an API
  const resources: EducationalResource[] = [
    {
      id: '1',
      title: 'Understanding Home Energy Efficiency',
      description: 'A comprehensive guide to making your home more energy efficient.',
      type: 'article',
      topic: 'home-appliances',
      readTime: '5 min read',
      thumbnail: '/api/placeholder/400/250',
      url: '/education/understanding-home-energy-efficiency',
      datePublished: '2024-01-15'
    },
    // Additional resources would be loaded from backend
  ];

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'article':
        return <BookOpen className="h-5 w-5 text-blue-500" />;
      case 'video':
        return <Video className="h-5 w-5 text-red-500" />;
      case 'infographic':
        return <PieChart className="h-5 w-5 text-green-500" />;
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    const matchesTopic = selectedTopic === 'all' || resource.topic === selectedTopic;
    return matchesSearch && matchesType && matchesTopic;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Educational Resources</h1>
          <p className="mt-4 text-lg text-gray-600">
            Learn about energy efficiency and discover ways to reduce your energy consumption
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
                placeholder="Search resources..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Type Filter */}
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ResourceType | 'all')}
            >
              <option value="all">All Types</option>
              <option value="article">Articles</option>
              <option value="video">Videos</option>
              <option value="infographic">Infographics</option>
            </select>

            {/* Topic Filter */}
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value as ResourceTopic | 'all')}
            >
              <option value="all">All Topics</option>
              <option value="home-appliances">Home Appliances</option>
              <option value="insulation">Insulation</option>
              <option value="renewable-energy">Renewable Energy</option>
              <option value="energy-management">Energy Management</option>
            </select>
          </div>
        </div>

        {/* Resources Grid */}
        {filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                <img
                  src={resource.thumbnail}
                  alt={resource.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getResourceIcon(resource.type)}
                    <Badge variant="outline" className="text-xs">
                      {resource.topic.replace('-', ' ').toUpperCase()}
                    </Badge>
                    {resource.readTime && (
                      <span className="text-xs text-gray-500">{resource.readTime}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {resource.description}
                  </p>
                  <a
                    href={resource.url}
                    className="text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    Learn More →
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              No resources found matching your search criteria. Try adjusting your filters.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default EducationPage;