export type Severity = 'none' | 'mild' | 'moderate' | 'severe';

export interface LocationIssue {
  locations: string[];
  severity: Severity;
}

export interface WindowMaintenance {
  id: string;
  userId: string;
  windowCount: number;
  windowType?: string;  // Type of windows (single, double, triple pane)
  lastReplacementDate: string | null;  // ISO date string
  nextMaintenanceDate: string | null;  // ISO date string
  maintenanceNotes: string | null;
  createdAt: string;  // ISO datetime string
  updatedAt: string;  // ISO datetime string
}

export interface WeatherizationMonitoring {
  id: string;
  userId: string;
  inspectionDate: string;  // ISO date string
  condensationIssues: LocationIssue;
  draftLocations: LocationIssue;
  notes: string | null;
  createdAt: string;  // ISO datetime string
  updatedAt: string;  // ISO datetime string
}

export interface UpdateWindowMaintenanceDto {
  windowCount?: number;
  windowType?: string;
  lastReplacementDate?: string | null;
  nextMaintenanceDate?: string | null;
  maintenanceNotes?: string | null;
}

export interface UpdateWeatherizationDto {
  inspectionDate?: string;
  condensationIssues?: LocationIssue;
  draftLocations?: LocationIssue;
  notes?: string | null;
}
