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

export async function fetchUserProfileData(): Promise<UserProfileData | null> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(`${API_ENDPOINTS.USER_PROFILE}/profile`, {
      method: 'GET',
      credentials: 'include',
      headers
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.warn('Authentication required to fetch user profile');
        return null;
      }
      throw new Error(`Failed to fetch user profile data: ${response.status}`);
    }
    
    return await response.json();
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
