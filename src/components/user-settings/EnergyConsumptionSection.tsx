import React, { useState, useEffect } from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface EnergyConsumptionData {
  powerConsumption: string;
  occupancyHours: {
    weekdays: '0-6' | '7-12' | '13-18' | '19-24';
    weekends: '0-6' | '7-12' | '13-18' | '19-24';
  };
  season: 'mild-winter' | 'moderate-winter' | 'mild-summer' | 'moderate-summer' | 'peak-summer' | 'spring-fall';
  occupancyPattern: string;
  monthlyBill: number;
  peakUsageTimes: string[];
}

interface Props {
  onSave: (data: EnergyConsumptionData) => Promise<void>;
  initialData?: EnergyConsumptionData;
}

const OCCUPANCY_RANGES = [
  { value: '0-6', label: '0-6 hours' },
  { value: '7-12', label: '7-12 hours' },
  { value: '13-18', label: '13-18 hours' },
  { value: '19-24', label: '19-24 hours' }
] as const;

const SEASONS = [
  { value: 'mild-winter', label: 'Mild Winter' },
  { value: 'moderate-winter', label: 'Moderate Winter' },
  { value: 'mild-summer', label: 'Mild Summer' },
  { value: 'moderate-summer', label: 'Moderate Summer' },
  { value: 'peak-summer', label: 'Peak Summer' },
  { value: 'spring-fall', label: 'Spring/Fall' }
] as const;

const PEAK_TIMES = [
  { value: 'morning', label: 'Morning (6am-10am)' },
  { value: 'midday', label: 'Midday (10am-2pm)' },
  { value: 'afternoon', label: 'Afternoon (2pm-6pm)' },
  { value: 'evening', label: 'Evening (6pm-10pm)' },
  { value: 'night', label: 'Night (10pm-6am)' }
] as const;

const DEFAULT_FORM_DATA: EnergyConsumptionData = {
  powerConsumption: '',
  occupancyHours: {
    weekdays: '7-12',
    weekends: '13-18'
  },
  season: 'moderate-summer',
  occupancyPattern: '',
  monthlyBill: 0,
  peakUsageTimes: []
};

const EnergyConsumptionSection: React.FC<Props> = ({ onSave, initialData }) => {
  const [formData, setFormData] = useState<EnergyConsumptionData>(() => initialData || DEFAULT_FORM_DATA);
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('energyConsumption');
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
      } catch (err) {
        console.error('Error parsing saved energy consumption data:', err);
      }
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    if (isDirty) {
      localStorage.setItem('energyConsumption', JSON.stringify(formData));
    }
  }, [formData, isDirty]);

  const handleInputChange = (
    field: keyof EnergyConsumptionData,
    value: EnergyConsumptionData[keyof EnergyConsumptionData],
    nestedField?: keyof EnergyConsumptionData['occupancyHours']
  ) => {
    setFormData(prev => {
      if (nestedField && field === 'occupancyHours') {
        return {
          ...prev,
          [field]: {
            ...prev[field],
            [nestedField]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
    setIsDirty(true);
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.monthlyBill || formData.monthlyBill <= 0) {
      setError('Please enter a valid monthly bill amount');
      return false;
    }

    if (formData.monthlyBill > 1000) {
      // High bill amount warning
      if (!window.confirm('Your monthly bill seems unusually high. Are you sure this is correct?')) {
        return false;
      }
    }

    if (!formData.occupancyPattern.trim()) {
      setError('Please describe your typical occupancy pattern');
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
      localStorage.removeItem('energyConsumption');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save energy consumption data');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Energy Consumption</h2>
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
            Please provide information about your typical energy usage patterns and costs.
            This helps us calculate potential savings and identify peak consumption periods.
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
        {/* Monthly Bill */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Energy Costs</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Average Monthly Electric Bill *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.monthlyBill}
                  onChange={(e) => handleInputChange('monthlyBill', parseFloat(e.target.value))}
                  className="pl-7 block w-full rounded-md border border-gray-300 py-2 px-3"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Occupancy Patterns */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Occupancy Patterns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Weekday Home Hours
              </label>
              <select
                value={formData.occupancyHours.weekdays}
                onChange={(e) => handleInputChange('occupancyHours', e.target.value, 'weekdays')}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
              >
                {OCCUPANCY_RANGES.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Weekend Home Hours
              </label>
              <select
                value={formData.occupancyHours.weekends}
                onChange={(e) => handleInputChange('occupancyHours', e.target.value, 'weekends')}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
              >
                {OCCUPANCY_RANGES.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Typical Occupancy Pattern *
              </label>
              <textarea
                value={formData.occupancyPattern}
                onChange={(e) => handleInputChange('occupancyPattern', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
                rows={3}
                placeholder="Describe when people are typically home and active (e.g., 'Family of 4, home evenings and weekends, work from home 2 days/week')"
              />
            </div>
          </div>
        </div>

        {/* Usage Patterns */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Patterns</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Power Consumption Pattern
              </label>
              <input
                type="text"
                value={formData.powerConsumption}
                onChange={(e) => handleInputChange('powerConsumption', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
                placeholder="e.g., 2-4kW"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Seasonal Usage Pattern
              </label>
              <select
                value={formData.season}
                onChange={(e) => handleInputChange('season', e.target.value as EnergyConsumptionData['season'])}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3"
              >
                {SEASONS.map(season => (
                  <option key={season.value} value={season.value}>{season.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Peak Usage Times
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {PEAK_TIMES.map(time => (
                  <div key={time.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.peakUsageTimes.includes(time.value)}
                      onChange={(e) => {
                        const times = e.target.checked
                          ? [...formData.peakUsageTimes, time.value]
                          : formData.peakUsageTimes.filter(t => t !== time.value);
                        handleInputChange('peakUsageTimes', times);
                      }}
                      className="h-4 w-4 text-green-600 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">{time.label}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              if (isDirty && window.confirm('Discard unsaved changes?')) {
                setFormData(initialData || DEFAULT_FORM_DATA);
                setIsDirty(false);
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

export default EnergyConsumptionSection;
