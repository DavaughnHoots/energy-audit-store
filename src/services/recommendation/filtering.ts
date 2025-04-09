import { AuditRecommendation } from '../../types/energyAudit';
import { mapRecommendationTypeToCategory } from './categoryMapping';
import { isPreferenceMatchingCategory } from './preferenceMatching';

/**
 * Filters recommendations by user's category preferences
 * @param recommendations The recommendations to filter
 * @param userCategoryPreferences User's preferred product categories
 * @returns Filtered recommendations
 */
export const filterRecommendationsByUserPreferences = (
  recommendations: AuditRecommendation[],
  userCategoryPreferences: string[] = []
): AuditRecommendation[] => {
  // If no preferences are provided, return all recommendations
  if (!userCategoryPreferences.length) {
    return recommendations;
  }
  
  console.log('========= RECOMMENDATION FILTERING PROCESS START ===========');
  console.log('Filtering recommendations with user preferences:', userCategoryPreferences);
  console.log('Total recommendations to filter:', recommendations.length);
  
  // Log the exact recommendation types to help debug the issue
  recommendations.forEach(rec => {
    console.log(`Recommendation ID: ${rec.id}, Title: ${rec.title}, Type: ${rec.type}`);
  });
  
  // IMPORTANT FIX: Check for direct type matches first based on the logs we've seen
  // This is a special case to handle the problematic categories
  const directTypeMatches = recommendations.filter(recommendation => {
    return userCategoryPreferences.some(pref => {
      // Check direct type match with exact types from logs
      // These are the specific problematic combinations
      if ((pref === 'renewable' && 
          (recommendation.type === 'renewable' || 
           recommendation.type === 'renewable_energy' || 
           recommendation.type === 'renewable-energy' || 
           recommendation.type === 'solar')) ||
          (pref === 'smart_home' && 
          (recommendation.type === 'smart_home' || 
           recommendation.type === 'smart-home' || 
           recommendation.type === 'smart_home_devices' || 
           recommendation.type === 'smart-home-devices')) ||
          (pref === 'water_heating' && 
          (recommendation.type === 'water_heating' || 
           recommendation.type === 'water-heating'))) {
        console.log(`DIRECT MATCH for ${recommendation.title} (${recommendation.type}) with preference ${pref}`);
        return true;
      }
      
      // Check for water heating with underscore/dash variations
      if ((pref === 'water_heating' || pref === 'water-heating') && 
          (recommendation.type === 'water_heating' || recommendation.type === 'water-heating')) {
        console.log(`WATER HEATING MATCH for ${recommendation.title} (${recommendation.type}) with preference ${pref}`);
        return true;
      }
      
      // Check for smart home with underscore/dash variations
      if ((pref.includes('smart_home') || pref.includes('smart-home')) && 
          (recommendation.type.includes('smart_home') || recommendation.type.includes('smart-home'))) {
        console.log(`SMART HOME MATCH for ${recommendation.title} (${recommendation.type}) with preference ${pref}`);
        return true;
      }
      
      // Check for renewable energy with underscore/dash variations
      if ((pref.includes('renewable') || pref === 'solar') && 
          (recommendation.type.includes('renewable') || recommendation.type === 'solar')) {
        console.log(`RENEWABLE MATCH for ${recommendation.title} (${recommendation.type}) with preference ${pref}`);
        return true;
      }
      
      // Check for humidity/dehumidification
      if ((pref === 'humidity' || pref === 'dehumidification') && 
          (recommendation.type.includes('humid') || recommendation.type.includes('humidity'))) {
        console.log(`HUMIDITY MATCH for ${recommendation.title} (${recommendation.type}) with preference ${pref}`);
        return true;
      }
      
      return false;
    });
  });
  
  // If we have direct matches, return them
  if (directTypeMatches.length > 0) {
    console.log(`Found ${directTypeMatches.length} direct type matches`);
    console.log(directTypeMatches.map(rec => rec.title));
    console.log('========= RECOMMENDATION FILTERING PROCESS END ===========');
    return directTypeMatches;
  }
  
  // First try to get exact matches using our improved category mapping
  const exactMatches = recommendations.filter(recommendation => {
    const categoryMapping = mapRecommendationTypeToCategory(recommendation.type, recommendation.title);
    console.log(`Checking recommendation ${recommendation.title} with categories:`, categoryMapping);
    
    // Check if any user preference matches either the main category or subcategory
    const match = userCategoryPreferences.some(pref => 
      isPreferenceMatchingCategory(pref, categoryMapping.mainCategory) || 
      isPreferenceMatchingCategory(pref, categoryMapping.subCategory) ||
      // Also check if preference matches the recommendation type directly
      isPreferenceMatchingCategory(pref, recommendation.type)
    );
    
    console.log(`Standard matching result for ${recommendation.title}: ${match ? 'MATCH' : 'NO MATCH'}`);
    return match;
  });
  
  // If we have exact matches, return them
  if (exactMatches.length > 0) {
    console.log(`Found ${exactMatches.length} exact preference matches`);
    console.log(exactMatches.map(rec => rec.title));
    console.log('========= RECOMMENDATION FILTERING PROCESS END ===========');
    return exactMatches;
  }
  
  // If no exact matches, try a more flexible matching (partial matches)
  console.log("No exact matches found, using flexible matching");
  const flexibleMatches = recommendations.filter(recommendation => {
    const categoryMapping = mapRecommendationTypeToCategory(recommendation.type, recommendation.title);
    
    // More flexible matching for category keywords
    return userCategoryPreferences.some(pref => {
      // Convert preference to keywords
      const keywords = pref.toLowerCase()
        .replace(/[_-]/g, ' ')
        .split(' ')
        .filter(k => k.length > 2); // Only use keywords with more than 2 chars
      
      console.log(`Checking flexible match for preference: ${pref}, keywords: ${keywords.join(', ')}`);
      
      // Check if any keyword matches in the recommendation title or type
      const titleMatch = keywords.some(keyword => 
        recommendation.title.toLowerCase().includes(keyword)
      );
      
      const typeMatch = keywords.some(keyword => 
        recommendation.type.toLowerCase().includes(keyword)
      );
      
      const categoryMatch = keywords.some(keyword => 
        categoryMapping.mainCategory.toLowerCase().includes(keyword) || 
        categoryMapping.subCategory.toLowerCase().includes(keyword)
      );
      
      // Log the match details
      if (titleMatch) console.log(`Title flexible match: ${recommendation.title} contains ${keywords.filter(k => recommendation.title.toLowerCase().includes(k)).join(', ')}`);
      if (typeMatch) console.log(`Type flexible match: ${recommendation.type} contains ${keywords.filter(k => recommendation.type.toLowerCase().includes(k)).join(', ')}`);
      if (categoryMatch) console.log(`Category flexible match: ${categoryMapping.mainCategory}/${categoryMapping.subCategory} contains ${keywords.filter(k => categoryMapping.mainCategory.toLowerCase().includes(k) || categoryMapping.subCategory.toLowerCase().includes(k)).join(', ')}`);
      
      return titleMatch || typeMatch || categoryMatch;
    });
  });
  
  // If we have flexible matches, return them
  if (flexibleMatches.length > 0) {
    console.log(`Found ${flexibleMatches.length} flexible matches`);
    console.log(flexibleMatches.map(rec => rec.title));
    console.log('========= RECOMMENDATION FILTERING PROCESS END ===========');
    return flexibleMatches;
  }
  
  // LAST RESORT: Hard-coded fallback for specific categories
  // This ensures that we always show recommendations for the specific categories in the browser logs
  console.log("Checking for fallback categories...");
  
  // If user has renewable preference and we have any recommendations with solar or renewable type
  if (userCategoryPreferences.some(pref => pref.includes('renewable') || pref === 'solar')) {
    const renewableRecs = recommendations.filter(rec => 
      rec.type.includes('solar') || 
      rec.type.includes('renewable')
    );
    if (renewableRecs.length > 0) {
      console.log("Found fallback renewable recommendations");
      console.log(renewableRecs.map(rec => rec.title));
      console.log('========= RECOMMENDATION FILTERING PROCESS END ===========');
      return renewableRecs;
    }
  }
  
  // If user has smart_home preference and we have any recommendations with smart in the title or type
  if (userCategoryPreferences.some(pref => pref.includes('smart'))) {
    const smartHomeRecs = recommendations.filter(rec => 
      rec.title.toLowerCase().includes('smart') || 
      rec.type.includes('smart')
    );
    if (smartHomeRecs.length > 0) {
      console.log("Found fallback smart home recommendations");
      console.log(smartHomeRecs.map(rec => rec.title));
      console.log('========= RECOMMENDATION FILTERING PROCESS END ===========');
      return smartHomeRecs;
    }
  }
  
  // If user has water_heating preference and we have any recommendations with water or heating in the title or type
  if (userCategoryPreferences.some(pref => pref.includes('water'))) {
    const waterHeatingRecs = recommendations.filter(rec => 
      rec.title.toLowerCase().includes('water') || 
      rec.type.includes('water')
    );
    if (waterHeatingRecs.length > 0) {
      console.log("Found fallback water heating recommendations");
      console.log(waterHeatingRecs.map(rec => rec.title));
      console.log('========= RECOMMENDATION FILTERING PROCESS END ===========');
      return waterHeatingRecs;
    }
  }

  // If user has insulation preference
  if (userCategoryPreferences.some(pref => pref.includes('insulation'))) {
    const insulationRecs = recommendations.filter(rec => 
      rec.title.toLowerCase().includes('insulat') || 
      rec.type.includes('insulation')
    );
    if (insulationRecs.length > 0) {
      console.log("Found fallback insulation recommendations");
      console.log(insulationRecs.map(rec => rec.title));
      console.log('========= RECOMMENDATION FILTERING PROCESS END ===========');
      return insulationRecs;
    }
  }

  // If user has windows preference
  if (userCategoryPreferences.some(pref => pref.includes('windows') || pref.includes('doors'))) {
    const windowsRecs = recommendations.filter(rec => 
      rec.title.toLowerCase().includes('window') || 
      rec.title.toLowerCase().includes('door') || 
      rec.type.includes('windows') ||
      rec.type.includes('doors')
    );
    if (windowsRecs.length > 0) {
      console.log("Found fallback windows & doors recommendations");
      console.log(windowsRecs.map(rec => rec.title));
      console.log('========= RECOMMENDATION FILTERING PROCESS END ===========');
      return windowsRecs;
    }
  }
  
  // As last fallback, just return all HVAC, lighting, insulation recommendations
  // as these are usually the most common and impactful
  const commonRecs = recommendations.filter(rec => 
    rec.type.includes('hvac') || 
    rec.type.includes('lighting') || 
    rec.type.includes('insulation')
  );
  
  if (commonRecs.length > 0) {
    console.log("No specific matches, returning common recommendation types");
    console.log(commonRecs.map(rec => rec.title));
    console.log('========= RECOMMENDATION FILTERING PROCESS END ===========');
    return commonRecs;
  }
  
  // If all else fails, return first 2 recommendations from the original list as final fallback
  if (recommendations.length > 0) {
    console.log("No matching recommendations found at all, returning first 2 recommendations as fallback");
    console.log(recommendations.slice(0, 2).map(rec => rec.title));
    console.log('========= RECOMMENDATION FILTERING PROCESS END ===========');
    return recommendations.slice(0, 2);
  }
  
  // If all else fails, return an empty array
  console.log("No recommendations found at all");
  console.log('========= RECOMMENDATION FILTERING PROCESS END ===========');
  return [];
};
