import { API_ENDPOINTS } from '@/config/api';
import { EnergyAuditData } from '@/types/energyAudit';

export interface UserProfileData {
  // User settings
  fullName: string;
  email: string;
  phone: string;
  address: string;
  emailNotifications?: boolean;
  theme?: string;

  // Property settings
  windowMaintenance?: {
    windowCount: number;
    lastReplacementDate: string | null;
    windowType?: string;
    condition?: string;
  };
  weatherization?: {
    draftLocations?: {
      locations: string[];
      severity: string;
    };
    condensationIssues?: {
      locations: string[];
      severity: string;
    };
    weatherStripping?: string;
  };
  propertyDetails?: {
    propertyType: string;
    yearBuilt: number;
    squareFootage: number;
    stories: number;
    ownershipStatus?: string;
    insulation?: {
      attic: string;
      walls: string;
      basement: string;
      floor: string;
    };
  };
  energySystems?: {
    heatingSystem?: {
      type: string;
      age: number;
      fuel: string;
    };
    coolingSystem?: {
      type: string;
      age: number;
    };
    waterHeater?: {
      type: string;
      age: number;
      fuel: string;
    };
  };
}

interface UserSettingsUpdateData {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  emailNotifications?: boolean;
  theme?: string;
}

// Helper function to get auth headers
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  // Get accessToken from cookies
  const accessToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('accessToken='))
    ?.split('=')[1];
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return headers;
}

// Helper function to generate a UUID for request correlation
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to hash a string for anonymization
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 8);
}

// Extract default property settings from audit data
export async function extractPropertySettingsFromAudit(
  auditData: EnergyAuditData,
  requestId: string = generateUUID(),
  userId: string = 'anonymous-user'
): Promise<Partial<UserProfileData>> {
  const startTime = performance.now();
  
  if (!auditData) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "warn",
      component: "userProfileService",
      operation: "extractPropertySettings",
      correlation: { 
        request_id: requestId,
        user_id: userId
      },
      details: {
        error: "No audit data provided",
        success: false
      },
      performance: {
        duration_ms: Math.round(performance.now() - startTime)
      }
    }));
    return {};
  }

  // Log the start of extraction with the basic audit data
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "info",
    component: "userProfileService",
    operation: "extractPropertySettings.start",
    correlation: {
      request_id: requestId,
      user_id: userId,
      audit_id: (auditData as any).id || 'unknown'
    },
    details: {
      audit_data_available: {
        property_type: !!auditData.basicInfo?.propertyType,
        year_built: !!auditData.basicInfo?.yearBuilt,
        square_footage: !!auditData.homeDetails?.squareFootage
      }
    }
  }));

  // Extract property details from audit data
  const propertyDetails: Partial<UserProfileData['propertyDetails']> = {};

  // Basic property information
  if (auditData.basicInfo?.propertyType) {
    propertyDetails.propertyType = auditData.basicInfo.propertyType;
  }

  if (auditData.basicInfo?.yearBuilt) {
    propertyDetails.yearBuilt = Number(auditData.basicInfo.yearBuilt);
  }

  if (auditData.homeDetails?.squareFootage) {
    propertyDetails.squareFootage = Number(auditData.homeDetails.squareFootage);
  }

  if (auditData.homeDetails?.stories) {
    propertyDetails.stories = Number(auditData.homeDetails.stories);
  }

  if (auditData.basicInfo?.ownershipStatus) {
    propertyDetails.ownershipStatus = auditData.basicInfo.ownershipStatus;
  }
  
  // Extract insulation information
  if (auditData.currentConditions?.insulation) {
    propertyDetails.insulation = {
      attic: auditData.currentConditions.insulation.attic || 'not-sure',
      walls: auditData.currentConditions.insulation.walls || 'not-sure',
      basement: auditData.currentConditions.insulation.basement || 'not-sure',
      floor: auditData.currentConditions.insulation.floor || 'not-sure'
    };
  }
  
  // Extract window data
  const windowMaintenance: Partial<UserProfileData['windowMaintenance']> = {};

  if (auditData.currentConditions?.numWindows) {
    windowMaintenance.windowCount = Number(auditData.currentConditions.numWindows);
  }

  if (auditData.currentConditions?.windowCondition) {
    windowMaintenance.condition = auditData.currentConditions.windowCondition;
  }

  if (auditData.currentConditions?.windowType) {
    windowMaintenance.windowType = auditData.currentConditions.windowType;
  }
  
  // Extract energy systems data
  const energySystems: Partial<UserProfileData['energySystems']> = {};

  if (auditData.heatingCooling?.heatingSystem) {
    energySystems.heatingSystem = {
      type: auditData.heatingCooling.heatingSystem.type || 'unknown',
      age: Number(auditData.heatingCooling.heatingSystem.age || 0),
      fuel: auditData.heatingCooling.heatingSystem.fuel || 'unknown'
    };
  }

  if (auditData.heatingCooling?.coolingSystem) {
    energySystems.coolingSystem = {
      type: auditData.heatingCooling.coolingSystem.type || 'unknown',
      age: Number(auditData.heatingCooling.coolingSystem.age || 0)
    };
  }
  
  // Water heater data might not be directly available in the expected format
  // Skip this for now as it's not critical for property settings

  // Compile the results
  const result: Partial<UserProfileData> = {};

  if (Object.keys(propertyDetails).length > 0) {
    result.propertyDetails = propertyDetails as UserProfileData['propertyDetails'];
  }

  if (Object.keys(windowMaintenance).length > 0) {
    result.windowMaintenance = windowMaintenance as UserProfileData['windowMaintenance'];
  }

  if (Object.keys(energySystems).length > 0) {
    result.energySystems = energySystems as UserProfileData['energySystems'];
  }

  console.log('Extracted property settings:', result);
  return result;
}

  // Auto-populate empty property settings with defaults from audit data
export async function populateDefaultPropertySettings(
  profileData: UserProfileData | null,
  requestId: string = generateUUID()
): Promise<UserProfileData | null> {
  const startTime = performance.now();
  
  if (!profileData) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      component: "userProfileService",
      operation: "populatePropertySettings",
      correlation: { request_id: requestId },
      details: {
        error: "No profile data provided",
        success: false
      },
      performance: {
        duration_ms: Math.round(performance.now() - startTime)
      }
    }));
    return null;
  }
  
  // Get anonymized user ID if available
  const userId = profileData?.email ? 
    `usr-${hashString(profileData.email)}` : 
    'anonymous-user';
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "info",
    component: "userProfileService",
    operation: "populatePropertySettings.start",
    correlation: {
      request_id: requestId,
      user_id: userId
    },
    details: {
      has_existing_property_details: !!(profileData.propertyDetails && 
                           Object.keys(profileData.propertyDetails).length > 0),
      has_partial_settings: !!(profileData.propertyDetails || 
                             profileData.windowMaintenance || 
                             profileData.energySystems),
      attempting_auto_population: true
    }
  }));

  // Check if property settings are empty or incomplete
  const hasPropertyDetails = profileData.propertyDetails &&
                           Object.keys(profileData.propertyDetails).length > 0;

  // Don't auto-populate if we already have property details
  if (hasPropertyDetails) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      component: "userProfileService",
      operation: "populatePropertySettings.complete",
      correlation: {
        request_id: requestId,
        user_id: userId
      },
      details: {
        success: true,
        auto_populated: false,
        reason: "existing_settings_present",
        existing_property_type: profileData.propertyDetails?.propertyType
      },
      performance: {
        duration_ms: Math.round(performance.now() - startTime)
      }
    }));
    return profileData;
  }

  // Fetch latest audit data for defaults
  const fetchStartTime = performance.now();
  let auditData: EnergyAuditData | null = null;
  
  try {
    auditData = await fetchLatestAuditData();
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      component: "userProfileService",
      operation: "fetchLatestAuditData",
      correlation: {
        request_id: requestId,
        user_id: userId,
        audit_id: (auditData as any)?.id || 'not-found'
      },
      details: {
        success: !!auditData,
        audit_found: !!auditData,
        audit_date: auditData?.basicInfo?.auditDate
      },
      performance: {
        duration_ms: Math.round(performance.now() - fetchStartTime)
      }
    }));
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      component: "userProfileService",
      operation: "fetchLatestAuditData",
      correlation: {
        request_id: requestId,
        user_id: userId
      },
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
        stack_trace: error instanceof Error ? error.stack : undefined,
        success: false
      },
      performance: {
        duration_ms: Math.round(performance.now() - fetchStartTime)
      }
    }));
  }
  
  if (!auditData) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      component: "userProfileService",
      operation: "populatePropertySettings.complete",
      correlation: {
        request_id: requestId,
        user_id: userId
      },
      details: {
        success: false,
        reason: "no_audit_data_available",
        auto_populated: false
      },
      performance: {
        duration_ms: Math.round(performance.now() - startTime)
      }
    }));
    return profileData;
  }
  
  // Extract property settings from audit data
  const extractStartTime = performance.now();
  const defaultSettings = await extractPropertySettingsFromAudit(auditData, requestId, userId);
  
  // Merge defaults with existing profile data (without overwriting)
  const before = { ...profileData };
  const updatedProfile = {
    ...profileData,
    ...defaultSettings
  };
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "info",
    component: "userProfileService",
    operation: "populatePropertySettings.complete",
    correlation: {
      request_id: requestId,
      user_id: userId,
      audit_id: (auditData as any).id || 'unknown'
    },
    details: {
      success: true,
      auto_populated: true,
      source: "latest_audit",
      audit_date: auditData.basicInfo?.auditDate,
      populated_fields: Object.keys(defaultSettings),
      property_type: defaultSettings.propertyDetails?.propertyType,
      before: {
        had_property_details: !!before.propertyDetails,
        had_window_maintenance: !!before.windowMaintenance,
        had_energy_systems: !!before.energySystems
      },
      after: {
        has_property_details: !!updatedProfile.propertyDetails,
        has_window_maintenance: !!updatedProfile.windowMaintenance,
        has_energy_systems: !!updatedProfile.energySystems,
        property_type: updatedProfile.propertyDetails?.propertyType,
        year_built: updatedProfile.propertyDetails?.yearBuilt,
        square_footage: updatedProfile.propertyDetails?.squareFootage
      }
    },
    performance: {
      total_duration_ms: Math.round(performance.now() - startTime),
      fetch_audit_ms: Math.round(fetchStartTime - startTime),
      extract_settings_ms: Math.round(performance.now() - extractStartTime)
    }
  }));
  
  return updatedProfile;
}

export async function fetchUserProfileData(): Promise<UserProfileData | null> {
  const requestId = generateUUID();
  const startTime = performance.now();
  
  try {
    const headers = getAuthHeaders();
    
    // Get accessToken from cookies to generate user ID
    const accessToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1];
    
    const userId = accessToken ? 
      `usr-${hashString(accessToken)}` : 
      'anonymous-user';
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      component: "userProfileService",
      operation: "fetchUserProfileData.start",
      correlation: {
        request_id: requestId,
        user_id: userId
      },
      details: {
        authenticated: !!accessToken
      }
    }));
    
    const response = await fetch(`${API_ENDPOINTS.USER_PROFILE}/profile`, {
      method: 'GET',
      credentials: 'include',
      headers
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "warn",
          component: "userProfileService",
          operation: "fetchUserProfileData",
          correlation: {
            request_id: requestId,
            user_id: userId
          },
          details: {
            error: "Authentication required to fetch user profile",
            status: 401,
            success: false
          },
          performance: {
            duration_ms: Math.round(performance.now() - startTime)
          }
        }));
        return null;
      }
      
      throw new Error(`Failed to fetch user profile data: ${response.status}`);
    }
    
    // Get the base profile data
    const profileData = await response.json();
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      component: "userProfileService",
      operation: "fetchUserProfileData.retrieved",
      correlation: {
        request_id: requestId,
        user_id: userId
      },
      details: {
        success: true,
        profile_exists: !!profileData,
        has_property_details: !!(profileData?.propertyDetails && 
                             Object.keys(profileData?.propertyDetails || {}).length > 0)
      },
      performance: {
        api_call_ms: Math.round(performance.now() - startTime)
      }
    }));
    
    // Auto-populate property settings with defaults if needed
    const populateStartTime = performance.now();
    const populatedProfile = await populateDefaultPropertySettings(profileData, requestId);
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      component: "userProfileService",
      operation: "fetchUserProfileData.complete",
      correlation: {
        request_id: requestId,
        user_id: userId
      },
      details: {
        success: true,
        property_settings_auto_populated: populatedProfile !== profileData,
        property_type: populatedProfile?.propertyDetails?.propertyType
      },
      performance: {
        total_duration_ms: Math.round(performance.now() - startTime),
        auto_populate_ms: Math.round(performance.now() - populateStartTime)
      }
    }));
    
    return populatedProfile;
  } catch (error) {
    console.error('Error fetching user profile data:', error);
    return null;
  }
}

export async function updateUserProfileSettings(
  settings: UserSettingsUpdateData
): Promise<{success: boolean; error?: string}> {
  try {
    const headers = getAuthHeaders();

    // Add detailed logging for debugging
    console.log('Updating user settings with:', settings);

    const response = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
      method: 'PUT',
      credentials: 'include',
      headers,
      body: JSON.stringify(settings)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to update settings. Status:', response.status, 'Response:', data);
      return {
        success: false,
        error: data.message || `Server error: ${response.status}`
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

export async function updateUserProfileFromAudit(
  auditData: EnergyAuditData, 
  fieldsToUpdate: string[]
): Promise<boolean> {
  try {
    const headers = getAuthHeaders();
    
    const payload = {
      auditData,
      fieldsToUpdate
    };
    
    const response = await fetch(`${API_ENDPOINTS.USER_PROFILE}/update-from-audit`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user profile');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}

interface AuditSummary {
  id: string;
  date: string;
  propertyType: string;
}

export async function fetchPreviousAudits(): Promise<AuditSummary[]> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(`${API_ENDPOINTS.ENERGY_AUDIT}/user`, {
      method: 'GET',
      credentials: 'include',
      headers
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch previous audits');
    }
    
    const audits = await response.json();
    if (!Array.isArray(audits)) {
      console.error('Expected array of audits but got:', typeof audits);
      return [];
    }
    
    return audits
      .filter((audit: any) => audit && typeof audit === 'object' && audit.id)
      .map((audit: any): AuditSummary => ({
        id: String(audit.id),
        date: audit.createdAt || new Date().toISOString(),
        propertyType: audit.data?.basicInfo?.propertyType || 'Unknown'
      }));
  } catch (error) {
    console.error('Error fetching previous audits:', error);
    return [];
  }
}

export async function fetchAuditDataById(auditId: string): Promise<EnergyAuditData | null> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(`${API_ENDPOINTS.ENERGY_AUDIT}/${auditId}`, {
      method: 'GET',
      credentials: 'include',
      headers
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch audit data');
    }
    
    const audit = await response.json();
    return audit?.data || null;
  } catch (error) {
    console.error('Error fetching audit data:', error);
    return null;
  }
}

export async function fetchLatestAuditData(): Promise<EnergyAuditData | null> {
  try {
    const audits = await fetchPreviousAudits();
    
    if (!audits || audits.length === 0) {
      return null;
    }
    
    // Create a safe copy of the array with definite values
    const safeAudits = audits.filter(
      (audit): audit is AuditSummary => 
        Boolean(audit) && 
        typeof audit === 'object' && 
        typeof audit.id === 'string' && 
        audit.id.length > 0
    );
    
    if (safeAudits.length === 0) {
      return null;
    }
    
    // Sort by date descending and get the most recent
    safeAudits.sort((a, b) => {
      let dateA = 0;
      let dateB = 0;
      
      try {
        if (a.date) dateA = new Date(a.date).getTime();
        if (b.date) dateB = new Date(b.date).getTime();
      } catch (e) {
        console.warn('Error parsing dates during audit sort:', e);
      }
      
      return dateB - dateA;
    });
    
    // Get the latest audit data (with extra safety check)
    const latestAudit = safeAudits[0];
    if (latestAudit && latestAudit.id) {
      return await fetchAuditDataById(latestAudit.id);
    }
    return null;
  } catch (error) {
    console.error('Error fetching latest audit data:', error);
    return null;
  }
}

export async function updatePropertyDetails(
  propertyData: Partial<UserProfileData['propertyDetails']>
): Promise<{success: boolean; error?: string}> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(API_ENDPOINTS.SETTINGS.PROPERTY, {
      method: 'PUT',
      credentials: 'include',
      headers,
      body: JSON.stringify(propertyData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { 
        success: false, 
        error: data.message || `Server error: ${response.status}` 
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating property details:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
