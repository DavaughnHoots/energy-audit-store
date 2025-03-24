// src/data/educational-resources.ts
import { 
  EducationalResource, 
  ResourceCollection, 
  ResourceType, 
  ResourceTopic, 
  ResourceLevel 
} from '../types/education';

export const mockResources: EducationalResource[] = [
  // Featured Articles
  {
    id: '1',
    title: 'Understanding Home Energy Efficiency',
    description: 'A comprehensive guide to making your home more energy efficient and reducing your carbon footprint.',
    type: 'article',
    topic: 'home-appliances',
    level: 'beginner',
    readTime: '5 min read',
    thumbnail: 'https://placehold.co/400x250?text=Energy+Efficiency',
    url: '/education/understanding-home-energy-efficiency',
    datePublished: '2024-01-15',
    featured: true,
    collectionIds: ['getting-started', 'seasonal-tips'],
    tags: ['efficiency', 'basics', 'home', 'energy-saving'],
    popularity: 1250,
    rating: {
      average: 4.7,
      count: 128
    }
  },
  {
    id: '2',
    title: 'Advanced Insulation Techniques',
    description: 'Learn about cutting-edge insulation methods that can dramatically reduce your heating and cooling costs.',
    type: 'article',
    topic: 'insulation',
    level: 'advanced',
    readTime: '8 min read',
    thumbnail: 'https://placehold.co/400x250?text=Insulation+Techniques',
    url: '/education/advanced-insulation-techniques',
    datePublished: '2024-02-10',
    featured: true,
    collectionIds: ['home-improvement'],
    tags: ['insulation', 'advanced', 'renovation', 'energy-saving'],
    popularity: 985,
    rating: {
      average: 4.8,
      count: 92
    }
  },
  {
    id: '3',
    title: 'Smart Home Energy Management',
    description: 'Discover how smart home technology can help you monitor and reduce your energy consumption.',
    type: 'article',
    topic: 'energy-management',
    level: 'intermediate',
    readTime: '6 min read',
    thumbnail: 'https://placehold.co/400x250?text=Smart+Home',
    url: '/education/smart-home-energy-management',
    datePublished: '2024-02-28',
    featured: true,
    collectionIds: ['smart-living', 'tech-solutions'],
    tags: ['smart-home', 'technology', 'automation', 'monitoring'],
    popularity: 1420,
    rating: {
      average: 4.6,
      count: 156
    }
  },

  // Featured Videos
  {
    id: '4',
    title: 'Solar Panel Installation Guide',
    description: 'Step-by-step video guide to understanding solar panel installation for your home.',
    type: 'video',
    topic: 'renewable-energy',
    level: 'intermediate',
    readTime: '12 min watch',
    thumbnail: 'https://placehold.co/400x250?text=Solar+Installation',
    url: '/education/solar-panel-installation',
    datePublished: '2024-01-22',
    featured: true,
    collectionIds: ['renewable-energy', 'home-improvement'],
    tags: ['solar', 'renewable', 'installation', 'DIY'],
    popularity: 2150,
    rating: {
      average: 4.9,
      count: 203
    }
  },
  {
    id: '5',
    title: 'Seasonal Energy Saving Tips',
    description: 'Video presentation of effective energy-saving strategies for each season of the year.',
    type: 'video',
    topic: 'energy-saving',
    level: 'beginner',
    readTime: '8 min watch',
    thumbnail: 'https://placehold.co/400x250?text=Seasonal+Tips',
    url: '/education/seasonal-energy-saving',
    datePublished: '2024-03-05',
    featured: true,
    collectionIds: ['getting-started', 'seasonal-tips'],
    tags: ['seasonal', 'tips', 'saving', 'quick-wins'],
    popularity: 1845,
    rating: {
      average: 4.5,
      count: 167
    }
  },

  // Featured Infographics
  {
    id: '6',
    title: 'Home Energy Loss Points',
    description: 'Visual guide to common areas where homes lose energy and how to address them.',
    type: 'infographic',
    topic: 'energy-management',
    level: 'beginner',
    thumbnail: 'https://placehold.co/400x250?text=Energy+Loss+Points',
    url: '/education/home-energy-loss-points',
    datePublished: '2024-02-18',
    featured: true,
    collectionIds: ['getting-started', 'visual-guides'],
    tags: ['energy-loss', 'insulation', 'visual', 'home'],
    popularity: 1640,
    rating: {
      average: 4.7,
      count: 145
    }
  },

  // Featured Interactive Content
  {
    id: '7',
    title: 'Home Energy Efficiency Quiz',
    description: 'Test your knowledge about home energy efficiency and learn new facts.',
    type: 'quiz',
    topic: 'home-appliances',
    level: 'beginner',
    thumbnail: 'https://placehold.co/400x250?text=Energy+Quiz',
    url: '/education/energy-efficiency-quiz',
    datePublished: '2024-03-10',
    featured: true,
    collectionIds: ['interactive-learning'],
    tags: ['quiz', 'interactive', 'learn', 'test-knowledge'],
    popularity: 1350,
    rating: {
      average: 4.6,
      count: 112
    }
  },
  {
    id: '8',
    title: 'Energy Savings Calculator',
    description: 'Interactive tool to calculate potential energy savings from various home improvements.',
    type: 'calculator',
    topic: 'energy-saving',
    level: 'intermediate',
    thumbnail: 'https://placehold.co/400x250?text=Savings+Calculator',
    url: '/education/energy-savings-calculator',
    datePublished: '2024-02-25',
    featured: true,
    collectionIds: ['interactive-learning', 'tech-solutions'],
    tags: ['calculator', 'savings', 'ROI', 'planning'],
    popularity: 1920,
    rating: {
      average: 4.8,
      count: 178
    }
  },

  // Regular Articles
  {
    id: '9',
    title: 'Choosing Energy Efficient Appliances',
    description: 'Guide to selecting the most energy-efficient appliances for your home needs.',
    type: 'article',
    topic: 'home-appliances',
    level: 'beginner',
    readTime: '6 min read',
    thumbnail: 'https://placehold.co/400x250?text=Efficient+Appliances',
    url: '/education/choosing-energy-efficient-appliances',
    datePublished: '2024-01-28',
    featured: false,
    collectionIds: ['getting-started', 'smart-living'],
    tags: ['appliances', 'shopping', 'efficiency-ratings'],
    popularity: 980,
    rating: {
      average: 4.5,
      count: 86
    }
  },
  {
    id: '10',
    title: 'Understanding Energy Star Ratings',
    description: 'Detailed explanation of Energy Star ratings and how to use them for purchasing decisions.',
    type: 'article',
    topic: 'home-appliances',
    level: 'beginner',
    readTime: '4 min read',
    thumbnail: 'https://placehold.co/400x250?text=Energy+Star',
    url: '/education/understanding-energy-star',
    datePublished: '2024-02-03',
    featured: false,
    collectionIds: ['getting-started'],
    tags: ['energy-star', 'ratings', 'certification', 'shopping'],
    popularity: 850,
    rating: {
      average: 4.4,
      count: 72
    }
  },
  {
    id: '11',
    title: 'Heat Pump Technology Explained',
    description: 'Deep dive into how heat pumps work and why they are an energy-efficient heating and cooling solution.',
    type: 'article',
    topic: 'home-appliances',
    level: 'intermediate',
    readTime: '7 min read',
    thumbnail: 'https://placehold.co/400x250?text=Heat+Pumps',
    url: '/education/heat-pump-technology',
    datePublished: '2024-02-15',
    featured: false,
    collectionIds: ['home-improvement', 'tech-solutions'],
    tags: ['heat-pumps', 'HVAC', 'technology', 'efficiency'],
    popularity: 760,
    rating: {
      average: 4.7,
      count: 65
    }
  },
  {
    id: '12',
    title: 'DIY Home Energy Audit',
    description: 'Learn how to conduct a basic energy audit of your home to identify improvement opportunities.',
    type: 'article',
    topic: 'energy-management',
    level: 'intermediate',
    readTime: '9 min read',
    thumbnail: 'https://placehold.co/400x250?text=DIY+Audit',
    url: '/education/diy-home-energy-audit',
    datePublished: '2024-03-01',
    featured: false,
    collectionIds: ['home-improvement', 'seasonal-tips'],
    tags: ['audit', 'DIY', 'assessment', 'efficiency'],
    popularity: 1120,
    rating: {
      average: 4.8,
      count: 95
    }
  },

  // Regular Videos
  {
    id: '13',
    title: 'Window Insulation Techniques',
    description: 'Video demonstration of various methods to improve window insulation and reduce drafts.',
    type: 'video',
    topic: 'insulation',
    level: 'beginner',
    readTime: '10 min watch',
    thumbnail: 'https://placehold.co/400x250?text=Window+Insulation',
    url: '/education/window-insulation-techniques',
    datePublished: '2024-01-18',
    featured: false,
    collectionIds: ['home-improvement', 'seasonal-tips'],
    tags: ['windows', 'insulation', 'drafts', 'DIY'],
    popularity: 890,
    rating: {
      average: 4.6,
      count: 82
    }
  },
  {
    id: '14',
    title: 'Smart Thermostat Installation',
    description: 'Step-by-step video guide to installing and configuring a smart thermostat for optimal energy savings.',
    type: 'video',
    topic: 'smart-home',
    level: 'intermediate',
    readTime: '15 min watch',
    thumbnail: 'https://placehold.co/400x250?text=Smart+Thermostat',
    url: '/education/smart-thermostat-installation',
    datePublished: '2024-02-20',
    featured: false,
    collectionIds: ['smart-living', 'tech-solutions'],
    tags: ['thermostat', 'smart-home', 'installation', 'HVAC'],
    popularity: 1350,
    rating: {
      average: 4.9,
      count: 110
    }
  },

  // Regular Infographics
  {
    id: '15',
    title: 'Energy Usage by Appliance',
    description: 'Visual breakdown of typical energy consumption by different household appliances.',
    type: 'infographic',
    topic: 'home-appliances',
    level: 'beginner',
    thumbnail: 'https://placehold.co/400x250?text=Appliance+Energy+Usage',
    url: '/education/energy-usage-by-appliance',
    datePublished: '2024-02-05',
    featured: false,
    collectionIds: ['visual-guides', 'getting-started'],
    tags: ['appliances', 'consumption', 'comparison', 'visual'],
    popularity: 780,
    rating: {
      average: 4.5,
      count: 68
    }
  }
];

export const mockCollections: ResourceCollection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with Energy Efficiency',
    description: 'Essential resources for beginners looking to understand energy efficiency concepts.',
    thumbnail: 'https://placehold.co/800x400?text=Getting+Started',
    resourceIds: ['1', '5', '6', '9', '10']
  },
  {
    id: 'home-improvement',
    title: 'Home Improvement Projects',
    description: 'Practical guides for energy-efficient home improvement and renovation projects.',
    thumbnail: 'https://placehold.co/800x400?text=Home+Improvement',
    resourceIds: ['2', '4', '11', '12', '13']
  },
  {
    id: 'smart-living',
    title: 'Smart Home & Energy Management',
    description: 'Resources for using smart technology to manage and reduce energy consumption.',
    thumbnail: 'https://placehold.co/800x400?text=Smart+Living',
    resourceIds: ['3', '9', '14']
  },
  {
    id: 'seasonal-tips',
    title: 'Seasonal Energy Saving Tips',
    description: 'Advice for optimizing your home energy efficiency during different seasons.',
    thumbnail: 'https://placehold.co/800x400?text=Seasonal+Tips',
    resourceIds: ['1', '5', '12', '13']
  },
  {
    id: 'interactive-learning',
    title: 'Interactive Tools & Calculators',
    description: 'Interactive resources to test your knowledge and plan your energy efficiency journey.',
    thumbnail: 'https://placehold.co/800x400?text=Interactive+Learning',
    resourceIds: ['7', '8']
  },
  {
    id: 'tech-solutions',
    title: 'Technology & Innovation',
    description: 'Cutting-edge technological solutions for energy efficiency challenges.',
    thumbnail: 'https://placehold.co/800x400?text=Tech+Solutions',
    resourceIds: ['3', '8', '11', '14']
  },
  {
    id: 'visual-guides',
    title: 'Visual Learning Resources',
    description: 'Infographics and visual guides to help understand energy efficiency concepts.',
    thumbnail: 'https://placehold.co/800x400?text=Visual+Guides',
    resourceIds: ['6', '15']
  }
];

export const getResourcesByCollectionId = (collectionId: string): EducationalResource[] => {
  const collection = mockCollections.find(c => c.id === collectionId);
  if (!collection) return [];
  return mockResources.filter(resource => collection.resourceIds.includes(resource.id));
};

export const getFeaturedResources = (): EducationalResource[] => {
  return mockResources.filter(resource => resource.featured);
};

export const getResourcesByType = (type: ResourceType): EducationalResource[] => {
  return mockResources.filter(resource => resource.type === type);
};

export const getResourcesByTopic = (topic: ResourceTopic): EducationalResource[] => {
  return mockResources.filter(resource => resource.topic === topic);
};

export const getResourcesByLevel = (level: ResourceLevel): EducationalResource[] => {
  return mockResources.filter(resource => resource.level === level);
};
