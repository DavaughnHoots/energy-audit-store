import React, { useState, useEffect } from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HVACData {
  heating: {
    type: 'furnace' | 'boiler' | 'heat-pump' | 'electric-baseboard' | 'other';
    fuelType: 'natural-gas' | 'oil' | 'electric' | 'propane' | 'other';
    age: number;
    lastService: string;
    efficiency?: string;
    issues: string[];
  };
  cooling: {
    type: 'central' | 'window-unit' | 'portable' | 'none';
    age: number;
    lastService?: string;
    seerRating?: string;
    issues: string[];
  };
  ventilation: {
    hasErv: boolean;
    hasProgrammableThermostat: boolean;
    hasSmartThermostat: boolean;
    hasZoning: boolean;
    filterChangeFrequency: 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'unknown';
  };
  maintenance: {
    regularService: boolean;
    serviceProvider?: string;
    lastInspection?: string;
    plannedUpgrades: boolean;
  };
}

interface Props {
  onSave: (data: HVACData) => Promise<void>;
  initialData?: HVACData;
}

const HEATING_TYPES = [
  { value: 'furnace', label: 'Forced Air Furnace' },
  { value: 'boiler', label: 'Boiler' },
  { value: 'heat-pump', label: 'Heat Pump' },
  { value: 'electric-baseboard', label: 'Electric Baseboard' },
  { value: 'other', label: 'Other' }
];

const FUEL_TYPES = [
  { value: 'natural-gas', label: 'Natural Gas' },
  { value: 'oil', label: 'Oil' },
  { value: 'electric', label: 'Electric' },
  { value: 'propane', label: 'Propane' },
  { value: 'other', label: 'Other' }
];

const COOLING_TYPES = [
  { value: 'central', label: 'Central Air' },
  { value: 'window-unit', label: 'Window Units' },
  { value: 'portable', label: 'Portable Units' },
  { value: 'none', label: 'None' }
];

const FILTER_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Every 3 Months' },
  { value: 'biannual', label: 'Every 6 Months' },
  { value: 'annual', label: 'Yearly' },
  { value: 'unknown', label: 'Unknown' }
];

const COMMON_ISSUES = [
  'Uneven heating/cooling',
  'Strange noises',
  'Higher than normal bills',
  'Poor air quality',
  'Frequent cycling',
  'Inconsistent temperatures'
];

const HVACSection: React.FC<Props> = ({ onSave, initialData }) => {
  const [formData, setFormData] = useState<HVACData>(() => initialData || {
    heating: {
      type: 'furnace',
      fuelType: 'natural-gas',
      age: 0,
      lastService: '',
      issues: []
    },
    cooling: {
      type: 'central',
      age: 0,
      issues: []
    },
    ventilation: {
      hasErv: false,
      hasProgrammableThermostat: false,
      hasSmartThermostat: false,
      hasZoning: false,
      filterChangeFrequency: 'unknown'
    },
    maintenance: {
      regularService: false,
      plannedUpgrades: false
    }
  });

  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('hvacSettings');
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
      } catch (err) {
        console.error('Error parsing saved HVAC settings:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (isDirty) {
      localStorage.setItem('hvacSettings', JSON.stringify(formData));
    }
  }, [formData, isDirty]);

  const handleInputChange = (
    section: keyof HVACData,
    field: string,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setIsDirty(true);
    setError('');
  };

  const validateForm = (): boolean => {
    if (formData.heating.age < 0 || formData.cooling.age < 0) {
      setError('System age cannot be negative');
      return false;
    }

    if (formData.heating.type === 'heat-pump' && !formData.heating.efficiency) {
      setError('Please provide efficiency rating for heat pump');
      return false;
    }

    if (formData.cooling.type === 'central' && !formData.cooling.seerRating) {
      setError('Please provide SEER rating for central AC');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      setIsDirty(false);
      localStorage.removeItem('hvacSettings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save HVAC settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">HVAC Systems</h2>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="text-gray-500 hover:text-gray-700"
        >
          <HelpCircle className="h-6 w-6" />
        </button>
      </div>

      {showHelp && (
        <Alert>
          <AlertDescription>
            Please provide details about your heating, cooling, and ventilation systems.
            This information helps us calculate potential energy savings and recommend
            appropriate upgrades.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Heating System */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Heating System</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">System Type</label>
              <select
                value={formData.heating.type}
                onChange={(e) => handleInputChange('heating', 'type', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
              >
                {HEATING_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fuel Type</label>
              <select
                value={formData.heating.fuelType}
                onChange={(e) => handleInputChange('heating', 'fuelType', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
              >
                {FUEL_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">System Age (years)</label>
              <input
                type="number"
                min="0"
                value={formData.heating.age}
                onChange={(e) => handleInputChange('heating', 'age', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Last Service Date</label>
              <input
                type="date"
                value={formData.heating.lastService}
                onChange={(e) => handleInputChange('heating', 'lastService', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
              />
            </div>

            {formData.heating.type === 'heat-pump' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Efficiency Rating (HSPF)</label>
                <input
                  type="text"
                  value={formData.heating.efficiency || ''}
                  onChange={(e) => handleInputChange('heating', 'efficiency', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
                  placeholder="e.g., 9.0"
                />
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Common Issues</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {COMMON_ISSUES.map(issue => (
                <div key={issue} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.heating.issues.includes(issue)}
                    onChange={(e) => {
                      const issues = e.target.checked
                        ? [...formData.heating.issues, issue]
                        : formData.heating.issues.filter(i => i !== issue);
                      handleInputChange('heating', 'issues', issues);
                    }}
                    className="h-4 w-4 text-green-600 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">{issue}</label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cooling System */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cooling System</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">System Type</label>
              <select
                value={formData.cooling.type}
                onChange={(e) => handleInputChange('cooling', 'type', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
              >
                {COOLING_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">System Age (years)</label>
              <input
                type="number"
                min="0"
                value={formData.cooling.age}
                onChange={(e) => handleInputChange('cooling', 'age', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
              />
            </div>

            {formData.cooling.type === 'central' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">SEER Rating</label>
                <input
                  type="text"
                  value={formData.cooling.seerRating || ''}
                  onChange={(e) => handleInputChange('cooling', 'seerRating', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
                  placeholder="e.g., 14.0"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Last Service Date</label>
              <input
                type="date"
                value={formData.cooling.lastService || ''}
                onChange={(e) => handleInputChange('cooling', 'lastService', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Common Issues</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {COMMON_ISSUES.map(issue => (
                <div key={issue} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.cooling.issues.includes(issue)}
                    onChange={(e) => {
                      const issues = e.target.checked
                        ? [...formData.cooling.issues, issue]
                        : formData.cooling.issues.filter(i => i !== issue);
                      handleInputChange('cooling', 'issues', issues);
                    }}
                    className="h-4 w-4 text-green-600 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">{issue}</label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ventilation and Controls */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ventilation and Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Filter Change Frequency</label>
              <select
                value={formData.ventilation.filterChangeFrequency}
                onChange={(e) => handleInputChange('ventilation', 'filterChangeFrequency', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
              >
                {FILTER_FREQUENCIES.map(freq => (
                  <option key={freq.value} value={freq.value}>{freq.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.ventilation.hasErv}
                  onChange={(e) => handleInputChange('ventilation', 'hasErv', e.target.checked)}
                  className="h-4 w-4 text-green-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Has Energy Recovery Ventilator (ERV)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.ventilation.hasProgrammableThermostat}
                  onChange={(e) => handleInputChange('ventilation', 'hasProgrammableThermostat', e.target.checked)}
                  className="h-4 w-4 text-green-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Has Programmable Thermostat
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.ventilation.hasSmartThermostat}
                  onChange={(e) => handleInputChange('ventilation', 'hasSmartThermostat', e.target.checked)}
                  className="h-4 w-4 text-green-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Has Smart/WiFi Thermostat
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.ventilation.hasZoning}
                  onChange={(e) => handleInputChange('ventilation', 'hasZoning', e.target.checked)}
                  className="h-4 w-4 text-green-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Has Zone Control System
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.maintenance.regularService}
                onChange={(e) => handleInputChange('maintenance', 'regularService', e.target.checked)}
                className="h-4 w-4 text-green-600 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Regular Professional Maintenance
              </label>
            </div>

            {formData.maintenance.regularService && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Service Provider</label>
                <input
                  type="text"
                  value={formData.maintenance.serviceProvider || ''}
                  onChange={(e) => handleInputChange('maintenance', 'serviceProvider', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
                  placeholder="Company name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Last Professional Inspection</label>
              <input
                type="date"
                value={formData.maintenance.lastInspection || ''}
                onChange={(e) => handleInputChange('maintenance', 'lastInspection', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.maintenance.plannedUpgrades}
                onChange={(e) => handleInputChange('maintenance', 'plannedUpgrades', e.target.checked)}
                className="h-4 w-4 text-green-600 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Planning System Upgrades
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              if (isDirty) {
                if (window.confirm('Discard unsaved changes?')) {
                  setFormData(initialData || {
                    heating: {
                      type: 'furnace',
                      fuelType: 'natural-gas',
                      age: 0,
                      lastService: '',
                      issues: []
                    },
                    cooling: {
                      type: 'central',
                      age: 0,
                      issues: []
                    },
                    ventilation: {
                      hasErv: false,
                      hasProgrammableThermostat: false,
                      hasSmartThermostat: false,
                      hasZoning: false,
                      filterChangeFrequency: 'unknown'
                    },
                    maintenance: {
                      regularService: false,
                      plannedUpgrades: false
                    }
                  });
                  setIsDirty(false);
                }
              }
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HVACSection;