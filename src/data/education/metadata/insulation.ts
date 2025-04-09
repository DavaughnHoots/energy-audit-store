// src/data/education/metadata/insulation.ts
import { EducationalResource } from '@/types/education';

export const insulation: EducationalResource[] = [
  {
    id: '1',
    title: 'Home Insulation Basics',
    description: 'Learn the fundamentals of home insulation to keep your home comfortable year-round while reducing energy costs.',
    type: 'article',
    topic: 'insulation',
    level: 'beginner',
    readTime: '10 min read',
    thumbnail: 'https://placehold.co/400x250?text=Insulation+Basics',
    url: '/education/resources/home-insulation-basics',
    datePublished: '2024-01-15',
    featured: true,
    collectionIds: ['home-improvement', 'energy-saving'],
    tags: ['insulation', 'basics', 'r-value', 'energy-efficiency'],
    popularity: 1250,
    rating: {
      average: 4.7,
      count: 175
    },
    contentFile: 'insulation/home-insulation-basics',
    progress: undefined,
    is_bookmarked: false
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
    url: '/education/resources/advanced-insulation',
    datePublished: '2024-02-10',
    featured: true,
    collectionIds: ['home-improvement'],
    tags: ['insulation', 'advanced', 'renovation', 'energy-saving'],
    popularity: 985,
    rating: {
      average: 4.8,
      count: 92
    },
    contentFile: 'insulation/advanced-techniques',
    progress: undefined,
    is_bookmarked: false
  },
  // Additional insulation resources would be added here
];

export default insulation;
