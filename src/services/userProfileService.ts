import { API_ENDPOINTS } from '@/config/api';
import { EnergyAuditData } from '@/types/energyAudit';

export interface UserProfileData {
  // User settings
  fullName: string;
  email: string;
  phone: string;
  address: string;
  
  // Property settings
  windowMaintenance: {
    windowCount: number;
    lastReplacementDate: string | null;
  };
  weatherization: {
    draftLocations: {
      locations: string[];
      severity: string;
    };
    condensationIssues: {
      locations: string[];
      severity: string;
    };
  };
}

export async function fetchUserProfileData(): Promise<UserProfileData | null> {
  try {
    // Get accessToken from cookies
    const accessToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1];
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add Authorization header if we have an access token in cookies
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`${API_ENDPOINTS.USER_PROFILE}/profile`, {
      method: 'GET',
      credentials: 'include',
      headers
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile data:', error);
    return null;
  }
}

export async function updateUserProfileFromAudit(
  auditData: EnergyAuditData, 
  fieldsToUpdate: string[]
): Promise<boolean> {
  try {
    // Get accessToken from cookies
    const accessToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1];
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add Authorization header if we have an access token in cookies
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
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
