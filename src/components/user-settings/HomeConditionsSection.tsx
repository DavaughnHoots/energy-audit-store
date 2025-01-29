import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';

interface HomeConditionsData {
  insulation: {
    attic: 'poor' | 'average' | 'good' | 'excellent' | 'not-sure';
    walls: 'poor' | 'average' | 'good' | 'excellent' | 'not-sure';
    basement: 'poor' | 'average' | 'good' | 'excellent' | 'not-sure';
    floor: 'poor' | 'average' | 'good' | 'excellent' | 'not-sure';
  };
  windows: {
    type: 'single' | 'double' | 'triple' | 'not-sure';
    count: number;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    lastReplaced?: string;
  };
  weatherization: {
    weatherStripping: 'door-sweep' | 'foam' | 'metal' | 'none' | 'not-sure';
    drafts: boolean;
    visibleGaps: boolean;
    condensation: boolean;
  };
}

interface Props {
  onSave: (data: HomeConditionsData) => Promise<void>;
  initialData?: HomeConditionsData;
}

const INSULATION_RATINGS = ['excellent', 'good', 'average', 'poor', 'not-sure'];
const WINDOW_TYPES = ['single', 'double', 'triple', 'not-sure'];
const WINDOW_CONDITIONS = ['excellent', 'good', 'fair', 'poor'];
const WEATHERSTRIPPING_TYPES = ['door-sweep', 'foam', 'metal', 'none', 'not-sure'];

const HomeConditionsSection: React.FC<Props> = ({ onSave, initialData }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState<HomeConditionsData>(() => initialData || {
    insulation: {
      attic: 'not-sure',
      walls: 'not-sure',
      basement: 'not-sure',
      floor: 'not-sure'
    },
    windows: {
      type: 'not-sure',
      count: 0,
      condition: 'good'
    },
    weatherization: {
      weatherStripping: 'not-sure',
      drafts: false,
      visibleGaps: false,
      condensation: false
    }
  });

  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('homeConditions');
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
      } catch (err) {
        console.error('Error parsing saved home conditions:', err);
      }
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    if (isDirty) {
      localStorage.setItem('homeConditions', JSON.stringify(formData));
    }
  }, [formData, isDirty]);

  const handleInputChange = (
    section: keyof HomeConditionsData,
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
    // Validate windows count
    if (formData.windows.count < 0) {
      setError('Number of windows cannot be negative');
      return false;
    }

    // Validate at least one insulation rating
    const hasInsulationRating = Object.values(formData.insulation).some(
      value => value !== 'not-sure'
    );
    if (!hasInsulationRating) {
      setError('Please provide at least one insulation rating');
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
      localStorage.removeItem('homeConditions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save home conditions');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Current Home Conditions</h2>
        {isDirty && (
          <span className="text-sm text-gray-500">
            Unsaved changes
          </span>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Insulation Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Insulation Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(formData.insulation).map(([area, rating]) => (
              <div key={area}>
                <label className="block text-sm font-medium text-gray-700 capitalize mb-2">
                  {area} Insulation
                </label>
                <select
                  value={rating}
                  onChange={(e) => handleInputChange('insulation', area, e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                >
                  {INSULATION_RATINGS.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Windows Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Windows Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Window Type
              </label>
              <select
                value={formData.windows.type}
                onChange={(e) => handleInputChange('windows', 'type', e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              >
                {WINDOW_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')} Pane
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Windows
              </label>
              <input
                type="number"
                min="0"
                value={formData.windows.count}
                onChange={(e) => handleInputChange('windows', 'count', parseInt(e.target.value))}
                className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Window Condition
              </label>
              <select
                value={formData.windows.condition}
                onChange={(e) => handleInputChange('windows', 'condition', e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              >
                {WINDOW_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Replaced (if known)
              </label>
              <input
                type="date"
                value={formData.windows.lastReplaced || ''}
                onChange={(e) => handleInputChange('windows', 'lastReplaced', e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Weatherization Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Weatherization Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weather Stripping Type
              </label>
              <select
                value={formData.weatherization.weatherStripping}
                onChange={(e) => handleInputChange('weatherization', 'weatherStripping', e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              >
                {WEATHERSTRIPPING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Observed Issues
              </label>
              <div className="space-y-2">
                {[
                  { key: 'drafts', label: 'Noticeable drafts around windows or doors' },
                  { key: 'visibleGaps', label: 'Visible gaps in weather stripping or seals' },
                  { key: 'condensation', label: 'Frequent condensation on windows' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={key}
                      checked={formData.weatherization[key as keyof typeof formData.weatherization]}
                      onChange={(e) => handleInputChange('weatherization', key, e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor={key} className="ml-2 text-sm text-gray-700">
                      {label}
                    </label>
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
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            onClick={() => {
              if (isDirty) {
                if (window.confirm('You have unsaved changes. Are you sure you want to reset the form?')) {
                  setFormData(initialData || {
                    insulation: {
                      attic: 'not-sure',
                      walls: 'not-sure',
                      basement: 'not-sure',
                      floor: 'not-sure'
                    },
                    windows: {
                      type: 'not-sure',
                      count: 0,
                      condition: 'good'
                    },
                    weatherization: {
                      weatherStripping: 'not-sure',
                      drafts: false,
                      visibleGaps: false,
                      condensation: false
                    }
                  });
                  setIsDirty(false);
                }
              }
            }}
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HomeConditionsSection;