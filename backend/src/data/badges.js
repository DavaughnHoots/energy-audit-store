/**
 * Badge definitions and constants for the backend
 * This mirrors the frontend badge definitions in src/data/badges.ts
 */

// Badge category types
export const BADGE_CATEGORIES = [
  'savings',
  'audits',
  'improvements',
  'education',
  'special'
];

// Badge tier levels
export const BADGE_TIERS = [
  'bronze',
  'silver',
  'gold',
  'platinum',
  'special'
];

// Badge criteria types
export const BADGE_CRITERIA_TYPES = [
  'savingsAmount',
  'auditCount',
  'implementedCount',
  'custom'
];

// Badge reward types
export const BADGE_REWARD_TYPES = [
  'feature',
  'discount',
  'content',
  'recognition'
];

/**
 * Points awarded for different activities
 */
export const POINTS = {
  SAVINGS_DOLLAR: 0.1,        // 0.1 points per dollar saved
  AUDIT_COMPLETED: 10,        // 10 points per audit
  RECOMMENDATION_IMPLEMENTED: 15, // 15 points per implemented change
  BADGE_EARNED: 25            // 25 points per badge earned
};

/**
 * Level definitions with thresholds
 */
export const LEVELS = [
  { level: 1, threshold: 0, title: 'Energy Novice' },      // Everyone starts here
  { level: 2, threshold: 100, title: 'Energy Apprentice' },   // 100 points
  { level: 3, threshold: 250, title: 'Energy Enthusiast' },   // 250 points
  { level: 4, threshold: 500, title: 'Energy Expert' },   // 500 points
  { level: 5, threshold: 1000, title: 'Energy Master' }   // 1000 points
];

/**
 * Collection of all available badges in the system
 */
export const BADGES = [
  // ==== SAVINGS BADGES ====
  {
    id: 'savings-bronze',
    name: 'Energy Saver',
    description: 'Save $100 on energy costs through efficient practices and improvements.',
    icon: '🥉',
    category: 'savings',
    tier: 'bronze',
    criteria: {
      type: 'savingsAmount',
      threshold: 100
    },
    reward: {
      description: 'Access to basic savings calculation tools',
      type: 'feature',
      value: 'savings-calculator'
    },
    visibility: 'public'
  },
  {
    id: 'savings-silver',
    name: 'Energy Champion',
    description: 'Save $500 on energy costs through consistent efficiency improvements.',
    icon: '🥈',
    category: 'savings',
    tier: 'silver',
    criteria: {
      type: 'savingsAmount',
      threshold: 500
    },
    reward: {
      description: 'Unlock savings comparison charts',
      type: 'feature',
      value: 'comparison-charts'
    },
    visibility: 'public'
  },
  {
    id: 'savings-gold',
    name: 'Energy Master',
    description: 'Save $1,000 on energy costs through advanced efficiency strategies.',
    icon: '🥇',
    category: 'savings',
    tier: 'gold',
    criteria: {
      type: 'savingsAmount',
      threshold: 1000
    },
    reward: {
      description: 'Premium energy report template',
      type: 'content',
      value: 'premium-report'
    },
    visibility: 'public'
  },
  {
    id: 'savings-platinum',
    name: 'Energy Guru',
    description: 'Save $2,000+ on energy costs through comprehensive efficiency transformations.',
    icon: '💎',
    category: 'savings',
    tier: 'platinum',
    criteria: {
      type: 'savingsAmount',
      threshold: 2000
    },
    reward: {
      description: 'Personalized advisor consultation code',
      type: 'discount',
      value: 'ENERGYGURU'
    },
    visibility: 'public'
  },

  // ==== AUDIT BADGES ====
  {
    id: 'audits-bronze',
    name: 'Audit Novice',
    description: 'Complete your first energy audit.',
    icon: '🥉',
    category: 'audits',
    tier: 'bronze',
    criteria: {
      type: 'auditCount',
      threshold: 1
    },
    visibility: 'public'
  },
  {
    id: 'audits-silver',
    name: 'Audit Enthusiast',
    description: 'Complete 10 energy audits across your property.',
    icon: '🥈',
    category: 'audits',
    tier: 'silver',
    criteria: {
      type: 'auditCount',
      threshold: 10
    },
    visibility: 'public'
  },
  {
    id: 'audits-gold',
    name: 'Audit Expert',
    description: 'Complete 25 energy audits with comprehensive coverage.',
    icon: '🥇',
    category: 'audits',
    tier: 'gold',
    criteria: {
      type: 'auditCount',
      threshold: 25
    },
    visibility: 'public'
  },
  {
    id: 'audits-platinum',
    name: 'Audit Virtuoso',
    description: 'Complete 50 energy audits, mastering every aspect of energy assessment.',
    icon: '💎',
    category: 'audits',
    tier: 'platinum',
    criteria: {
      type: 'auditCount',
      threshold: 50
    },
    reward: {
      description: 'Exclusive detailed analysis features',
      type: 'feature',
      value: 'advanced-analytics'
    },
    visibility: 'public'
  },

  // ==== IMPROVEMENT BADGES ====
  {
    id: 'improvements-bronze',
    name: 'First Step',
    description: 'Implement your first energy-saving recommendation.',
    icon: '🥉',
    category: 'improvements',
    tier: 'bronze',
    criteria: {
      type: 'implementedCount',
      threshold: 1
    },
    visibility: 'public'
  },
  {
    id: 'improvements-silver',
    name: 'Getting Greener',
    description: 'Implement 5 energy-saving recommendations.',
    icon: '🥈',
    category: 'improvements',
    tier: 'silver',
    criteria: {
      type: 'implementedCount',
      threshold: 5
    },
    visibility: 'public'
  },
  {
    id: 'improvements-gold',
    name: 'Energy Transformer',
    description: 'Implement 10 energy-saving recommendations, transforming your energy profile.',
    icon: '🥇',
    category: 'improvements',
    tier: 'gold',
    criteria: {
      type: 'implementedCount',
      threshold: 10
    },
    visibility: 'public'
  },
  {
    id: 'improvements-platinum',
    name: 'Home Efficiency Master',
    description: 'Implement 25 energy-saving recommendations, achieving comprehensive efficiency.',
    icon: '💎',
    category: 'improvements',
    tier: 'platinum',
    criteria: {
      type: 'implementedCount',
      threshold: 25
    },
    reward: {
      description: 'Discount code for sustainability store',
      type: 'discount',
      value: 'EFFICIENCY25'
    },
    visibility: 'public'
  },

  // ==== SPECIAL ACHIEVEMENT BADGES ====
  {
    id: 'special-full-house',
    name: 'Full House',
    description: 'Complete energy audits for every room in your home.',
    icon: '🏆',
    category: 'special',
    tier: 'special',
    criteria: {
      type: 'custom',
      threshold: 1
    },
    visibility: 'public'
  },
  {
    id: 'special-seasonal',
    name: 'Seasonal Optimizer',
    description: 'Complete energy audits across all seasons for year-round efficiency.',
    icon: '🌡️',
    category: 'special',
    tier: 'special',
    criteria: {
      type: 'custom',
      threshold: 1
    },
    visibility: 'public'
  },
  {
    id: 'special-scholar',
    name: 'Energy Scholar',
    description: 'Complete all educational modules in our energy efficiency curriculum.',
    icon: '📚',
    category: 'special',
    tier: 'special',
    criteria: {
      type: 'custom',
      threshold: 1
    },
    reward: {
      description: 'Unlock advanced educational content',
      type: 'content',
      value: 'advanced-education'
    },
    visibility: 'public'
  },
  {
    id: 'special-community',
    name: 'Community Guide',
    description: 'Help others on their efficiency journey with valuable insights.',
    icon: '🌟',
    category: 'special',
    tier: 'special',
    criteria: {
      type: 'custom',
      threshold: 1
    },
    reward: {
      description: 'Special profile badge visible to others',
      type: 'recognition',
      value: 'featured-profile'
    },
    visibility: 'public'
  }
];

/**
 * Get a badge by ID
 */
export const getBadgeById = (id) => {
  return BADGES.find(badge => badge.id === id);
};

/**
 * Get all badges in a specific category
 */
export const getBadgesByCategory = (category) => {
  return BADGES.filter(badge => badge.category === category);
};

/**
 * Get badges for a specific tier
 */
export const getBadgesByTier = (tier) => {
  return BADGES.filter(badge => badge.tier === tier);
};
