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
    const response = await fetch(`${API_ENDPOINTS.USER_PROFILE}/profile`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
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
    const payload = {
      auditData,
      fieldsToUpdate
    };
    
    const response = await fetch(`${API_ENDPOINTS.USER_PROFILE}/update-from-audit`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
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
