// src/data/education/metadata/insulation.ts
import { EducationalResource } from '@/types/education';

export const insulation: EducationalResource[] = [
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
