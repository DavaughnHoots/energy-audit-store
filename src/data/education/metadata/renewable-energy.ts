// src/data/education/metadata/renewable-energy.ts
import { EducationalResource } from '@/types/education';

// Resource metadata for renewable energy content
export const renewableEnergy: EducationalResource[] = [
  {
    id: 'residential-solar',
    title: 'Residential Solar Energy Systems',
    description: 'Discover how residential solar energy solutions can reduce your energy bills, increase your home value, and help you achieve energy independence.',
    type: 'article',
    topic: 'renewable-energy',
    level: 'beginner',
    readTime: '12 min',
    thumbnail: '/images/education/solar-panels-home.jpg',
    url: '/education/residential-solar',
    datePublished: '2025-04-08',
    featured: true,
    collectionIds: ['renewable-energy-basics'],
    tags: ['solar', 'renewable energy', 'residential', 'energy independence', 'roi'],
    popularity: 0,
    rating: {
      average: 4.8,
      count: 1
    },
    authorId: 'energy-team',
    contentFile: 'renewable-energy/residential-solar'
  }
];

export default renewableEnergy;
