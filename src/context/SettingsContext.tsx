// src/context/SettingsContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Settings {
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  emailNotifications: boolean;
  theme: 'light' | 'dark';
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    fullName: '',
    email: '',
    emailNotifications: true,
    theme: 'light'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch settings');
      
      const data = await response.json();
      setSettings(data);
      setError(null);

      // Apply theme
      document.documentElement.classList.toggle('dark', data.theme === 'dark');
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newSettings)
      });

      if (!response.ok) throw new Error('Failed to update settings');

      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      setError(null);

      // Apply theme if it was updated
      if (newSettings.theme) {
        document.documentElement.classList.toggle('dark', newSettings.theme === 'dark');
      }
    } catch (err) {
      setError('Failed to update settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading, error }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};