import { EnergyAuditData } from '@/types/energyAudit';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'energy_audit_data';
const AUDIT_ID_KEY = 'energy_audit_id';

export interface StoredAuditData {
  id: string;
  data: Partial<EnergyAuditData>;
  lastUpdated: string;
}

export const getStoredAuditData = (): StoredAuditData | null => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (!storedData) return null;
  
  try {
    return JSON.parse(storedData);
  } catch (error) {
    console.error('Error parsing stored audit data:', error);
    return null;
  }
};

export const storeAuditData = (data: Partial<EnergyAuditData>): string => {
  const storedData = getStoredAuditData();
  const auditId = storedData?.id || uuidv4();
  
  const auditData: StoredAuditData = {
    id: auditId,
    data,
    lastUpdated: new Date().toISOString()
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auditData));
  return auditId;
};

export const clearStoredAuditData = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getAuditId = (): string => {
  let auditId = localStorage.getItem(AUDIT_ID_KEY);
  if (!auditId) {
    auditId = uuidv4();
    localStorage.setItem(AUDIT_ID_KEY, auditId);
  }
  return auditId;
};
