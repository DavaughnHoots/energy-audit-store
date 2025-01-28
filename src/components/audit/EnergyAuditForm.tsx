// src/components/audit/EnergyAuditForm.tsx

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Thermometer,
  Lightbulb,
  Sun,
  DollarSign,
  BadgeCheck
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Form section configuration
type FormSectionKey = 'basicInfo' | 'homeDetails' | 'currentConditions' | 'hvac' | 'energyUsage';

interface FormSection {
  title: string;
  icon: JSX.Element;
  required: string[];
}

const FORM_SECTIONS: Record<FormSectionKey, FormSection> = {
  basicInfo: {
    title: 'Basic Information',
    icon: <Home className="h-6 w-6 text-green-600" />,
    required: ['fullName', 'email', 'address']
  },
  homeDetails: {
    title: 'Home Details',
    icon: <Home className="h-6 w-6 text-green-600" />,
    required: ['yearBuilt', 'homeSize', 'homeType']
  },
  currentConditions: {
    title: 'Current Conditions',
    icon: <Thermometer className="h-6 w-6 text-green-600" />,
    required: ['insulation', 'windowType', 'windowCondition']
  },
  hvac: {
    title: 'HVAC Systems',
    icon: <Sun className="h-6 w-6 text-green-600" />,
    required: ['heatingType', 'coolingType']
  },
  energyUsage: {
    title: 'Energy Usage',
    icon: <DollarSign className="h-6 w-6 text-green-600" />,
    required: ['monthlyBill']
  }
};

interface FormData {
  basicInfo: {
    fullName: string;
    email: string;
    phone?: string;
    address: string;
    auditDate: string;
  };
  homeDetails: {
    yearBuilt: string;
    homeSize: string;
    numRooms: string;
    homeType: string;
    numFloors: string;
    basementType: string;
  };
  currentConditions: {
    insulation: {
      attic: string;
      walls: string;
      basement: string;
      floor: string;
    };
    windowType: string;
    numWindows: string;
    windowCondition: string;
    weatherStripping: string;
  };
  hvac: {
    heatingType: string;
    coolingType: string;
    systemAge: string;
    lastService: string;
  };
  energyUsage: {
    monthlyBill: string;
    peakUsageTimes: string[];
    seasonalVariation: string;
  };
}

const EnergyAuditForm: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<FormSectionKey>('basicInfo');
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(() => {
    // Try to load saved form data from localStorage
    const savedData = localStorage.getItem('energyAuditForm');
    return savedData ? JSON.parse(savedData) : {
      basicInfo: {
        fullName: '',
        email: '',
        phone: '',
        address: '',
        auditDate: new Date().toISOString().split('T')[0]
      },
      homeDetails: {
        yearBuilt: '',
        homeSize: '',
        numRooms: '',
        homeType: '',
        numFloors: '',
        basementType: ''
      },
      currentConditions: {
        insulation: {
          attic: '',
          walls: '',
          basement: '',
          floor: ''
        },
        windowType: '',
        numWindows: '',
        windowCondition: '',
        weatherStripping: ''
      },
      hvac: {
        heatingType: '',
        coolingType: '',
        systemAge: '',
        lastService: ''
      },
      energyUsage: {
        monthlyBill: '',
        peakUsageTimes: [],
        seasonalVariation: ''
      }
    };
  });

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('energyAuditForm', JSON.stringify(formData));
  }, [formData]);

  const validateSection = (sectionId: FormSectionKey): boolean => {
    const section = FORM_SECTIONS[sectionId];
    const sectionData = formData[sectionId];

    return section.required.every(field => {
      const fieldValue = sectionData[field as keyof typeof sectionData];

      if (fieldValue === undefined) {
        return false;
      }

      // Handle nested objects (like insulation)
      if (typeof fieldValue === 'object' && fieldValue !== null) {
        // For arrays, check if not empty
        if (Array.isArray(fieldValue)) {
          return (fieldValue as string[]).length > 0;
        }
        // For objects, check if all required values are filled
        if (field === 'insulation') {
          const insulationValues = fieldValue as Record<string, string>;
          return Object.values(insulationValues).some(value => value !== '');
        }
        return false;
      }

      // For simple fields, check if not empty
      return fieldValue !== '';
    });
  };

  const handleInputChange = (section: FormSectionKey, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setError(null);
  };

  const handleNext = () => {
    if (!validateSection(currentSection)) {
      setError('Please fill in all required fields before proceeding.');
      return;
    }

    const sections = Object.keys(FORM_SECTIONS) as FormSectionKey[];
    const currentIndex = sections.indexOf(currentSection);
    if (currentIndex >= 0 && currentIndex < sections.length - 1) {
      const nextSection = sections[currentIndex + 1];
      if (nextSection) {
        setCurrentSection(nextSection);
      }
    }
  };

  const handlePrevious = () => {
    const sections = Object.keys(FORM_SECTIONS) as FormSectionKey[];
    const currentIndex = sections.indexOf(currentSection);
    if (currentIndex > 0) {
      const prevSection = sections[currentIndex - 1];
      if (prevSection) {
        setCurrentSection(prevSection);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all sections
    const sections = Object.keys(FORM_SECTIONS) as FormSectionKey[];
    for (const sectionId of sections) {
      if (!validateSection(sectionId)) {
        setError(`Please complete all required fields in ${FORM_SECTIONS[sectionId].title}`);
        setCurrentSection(sectionId);
        return;
      }
    }

    try {
      const response = await fetch('/api/energy-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit audit');
      }

      // Clear form data from localStorage
      localStorage.removeItem('energyAuditForm');

      // Redirect to results page
      window.location.href = '/audit/results';
    } catch (error) {
      setError('Failed to submit audit. Please try again.');
    }
  };

  const renderProgressBar = () => {
    const sections = Object.keys(FORM_SECTIONS) as FormSectionKey[];
    const currentIndex = sections.indexOf(currentSection);
    const progress = ((currentIndex + 1) / sections.length) * 100;

    return (
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  };

  const renderBasicInfoSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Full Name *
          </label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded-md"
            value={formData.basicInfo.fullName}
            onChange={(e) => handleInputChange('basicInfo', 'fullName', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Email *
          </label>
          <input
            type="email"
            required
            className="w-full p-2 border rounded-md"
            value={formData.basicInfo.email}
            onChange={(e) => handleInputChange('basicInfo', 'email', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Phone (optional)
          </label>
          <input
            type="tel"
            className="w-full p-2 border rounded-md"
            value={formData.basicInfo.phone}
            onChange={(e) => handleInputChange('basicInfo', 'phone', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Address *
          </label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded-md"
            value={formData.basicInfo.address}
            onChange={(e) => handleInputChange('basicInfo', 'address', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderHomeDetailsSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Home Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Year Built *
          </label>
          <input
            type="number"
            required
            min="1800"
            max={new Date().getFullYear()}
            className="w-full p-2 border rounded-md"
            value={formData.homeDetails.yearBuilt}
            onChange={(e) => handleInputChange('homeDetails', 'yearBuilt', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Home Type *
          </label>
          <select
            required
            className="w-full p-2 border rounded-md"
            value={formData.homeDetails.homeType}
            onChange={(e) => handleInputChange('homeDetails', 'homeType', e.target.value)}
          >
            <option value="">Select home type</option>
            <option value="single-family">Single-family detached</option>
            <option value="townhouse">Townhouse/Rowhome</option>
            <option value="duplex">Duplex/Condo</option>
            <option value="apartment">Apartment</option>
            <option value="mobile">Mobile home</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Square Footage *
          </label>
          <input
            type="number"
            required
            min="100"
            className="w-full p-2 border rounded-md"
            value={formData.homeDetails.homeSize}
            onChange={(e) => handleInputChange('homeDetails', 'homeSize', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Number of Floors
          </label>
          <input
            type="number"
            min="1"
            className="w-full p-2 border rounded-md"
            value={formData.homeDetails.numFloors}
            onChange={(e) => handleInputChange('homeDetails', 'numFloors', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderCurrentConditionsSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Current Conditions</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Insulation Assessment *</h4>
            {['attic', 'walls', 'basement', 'floor'].map((area) => (
              <div key={area} className="space-y-2">
                <label className="text-sm text-gray-600 capitalize">
                  {area} Insulation
                </label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.currentConditions.insulation[area as keyof typeof formData.currentConditions.insulation]}
                  onChange={(e) => handleInputChange('currentConditions', 'insulation', {
                    ...formData.currentConditions.insulation,
                    [area]: e.target.value
                  })}
                >
                  <option value="">Select condition</option>
                  <option value="poor">Poor</option>
                  <option value="average">Average</option>
                  <option value="good">Good</option>
                  <option value="excellent">Excellent</option>
                  <option value="not-sure">Not Sure</option>
                </select>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Window Type *
              </label>
              <select
                required
                className="w-full p-2 border rounded-md"
                value={formData.currentConditions.windowType}
                onChange={(e) => handleInputChange('currentConditions', 'windowType', e.target.value)}
              >
                <option value="">Select window type</option>
                <option value="single">Single Pane</option>
                <option value="double">Double Pane</option>
                <option value="triple">Triple Pane</option>
                <option value="not-sure">Not Sure</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Window Condition *
              </label>
              <select
                required
                className="w-full p-2 border rounded-md"
                value={formData.currentConditions.windowCondition}
                onChange={(e) => handleInputChange('currentConditions', 'windowCondition', e.target.value)}
              >
                <option value="">Select condition</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Weather Stripping
              </label>
              <select
                className="w-full p-2 border rounded-md"
                value={formData.currentConditions.weatherStripping}
                onChange={(e) => handleInputChange('currentConditions', 'weatherStripping', e.target.value)}
              >
                <option value="">Select type</option>
                <option value="door-sweep">Door Sweep</option>
                <option value="foam">Foam</option>
                <option value="metal">Metal</option>
                <option value="none">None</option>
                <option value="not-sure">Not Sure</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHVACSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">HVAC Systems</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Heating System Type *
          </label>
          <select
            required
            className="w-full p-2 border rounded-md"
            value={formData.hvac.heatingType}
            onChange={(e) => handleInputChange('hvac', 'heatingType', e.target.value)}
          >
            <option value="">Select heating type</option>
            <option value="furnace">Forced Air Furnace</option>
            <option value="boiler">Boiler/Radiator</option>
            <option value="heat-pump">Heat Pump</option>
            <option value="electric">Electric Baseboard</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Cooling System Type *
          </label>
          <select
            required
            className="w-full p-2 border rounded-md"
            value={formData.hvac.coolingType}
            onChange={(e) => handleInputChange('hvac', 'coolingType', e.target.value)}
          >
            <option value="">Select cooling type</option>
            <option value="central">Central AC</option>
            <option value="heat-pump">Heat Pump</option>
            <option value="window">Window Units</option>
            <option value="none">None</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            System Age
          </label>
          <input
            type="number"
            min="0"
            max="100"
            className="w-full p-2 border rounded-md"
            value={formData.hvac.systemAge}
            onChange={(e) => handleInputChange('hvac', 'systemAge', e.target.value)}
            placeholder="Years"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Last Service Date
          </label>
          <input
            type="date"
            className="w-full p-2 border rounded-md"
            value={formData.hvac.lastService}
            onChange={(e) => handleInputChange('hvac', 'lastService', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderEnergyUsageSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Energy Usage</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Average Monthly Electric Bill *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2">$</span>
            <input
              type="number"
              required
              min="0"
              className="w-full pl-8 p-2 border rounded-md"
              value={formData.energyUsage.monthlyBill}
              onChange={(e) => handleInputChange('energyUsage', 'monthlyBill', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Seasonal Usage Pattern
          </label>
          <select
            className="w-full p-2 border rounded-md"
            value={formData.energyUsage.seasonalVariation}
            onChange={(e) => handleInputChange('energyUsage', 'seasonalVariation', e.target.value)}
          >
            <option value="">Select pattern</option>
            <option value="consistent">Consistent year-round</option>
            <option value="summer-peak">Highest in summer</option>
            <option value="winter-peak">Highest in winter</option>
            <option value="variable">Highly variable</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    const sectionRenderers: Record<FormSectionKey, () => JSX.Element> = {
      basicInfo: renderBasicInfoSection,
      homeDetails: renderHomeDetailsSection,
      currentConditions: renderCurrentConditionsSection,
      hvac: renderHVACSection,
      energyUsage: renderEnergyUsageSection
    };

    return sectionRenderers[currentSection]();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">DIY Energy Audit</h2>
        <p className="mt-2 text-gray-600">
          Complete this form to receive personalized energy efficiency recommendations.
        </p>
      </div>

      {renderProgressBar()}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {renderCurrentSection()}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentSection === 'basicInfo'}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </button>

        {currentSection === 'energyUsage' ? (
          <button
            type="submit"
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            Submit Audit
            <BadgeCheck className="w-4 h-4 ml-2" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
    </form>
  );
};

export default EnergyAuditForm;
