// src/components/audit/EnergyAuditForm.tsx

import React, { useState } from 'react';
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

// Form section configuration
const FORM_SECTIONS = {
  BASIC_INFO: {
    id: 'basicInfo',
    title: 'Basic Information',
    icon: <Home className="h-6 w-6 text-green-600" />
  },
  HOME_DETAILS: {
    id: 'homeDetails',
    title: 'Home Details',
    icon: <Home className="h-6 w-6 text-green-600" />
  },
  CURRENT_CONDITIONS: {
    id: 'currentConditions',
    title: 'Current Conditions',
    icon: <Thermometer className="h-6 w-6 text-green-600" />
  },
  HVAC: {
    id: 'hvac',
    title: 'HVAC Systems',
    icon: <Thermometer className="h-6 w-6 text-green-600" />
  }
};

const EnergyAuditForm = () => {
  const [currentSection, setCurrentSection] = useState(FORM_SECTIONS.BASIC_INFO.id);
  const [formData, setFormData] = useState({
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
      temperatureConsistency: '',
      windowCount: '',
      comfortIssues: []
    },
    hvac: {
      heatingType: '',
      coolingType: '',
      systemAge: '',
      lastService: ''
    }
  });

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleMultiSelect = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].includes(value)
          ? prev[section][field].filter(item => item !== value)
          : [...prev[section][field], value]
      }
    }));
  };

  const renderProgressBar = () => {
    const sections = Object.values(FORM_SECTIONS);
    const currentIndex = sections.findIndex(section => section.id === currentSection);
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
          <label className="text-sm font-medium text-gray-700">Full Name *</label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded-md"
            value={formData.basicInfo.fullName}
            onChange={(e) => handleInputChange('basicInfo', 'fullName', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Email *</label>
          <input
            type="email"
            required
            className="w-full p-2 border rounded-md"
            value={formData.basicInfo.email}
            onChange={(e) => handleInputChange('basicInfo', 'email', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            className="w-full p-2 border rounded-md"
            value={formData.basicInfo.phone}
            onChange={(e) => handleInputChange('basicInfo', 'phone', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Address *</label>
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
          <label className="text-sm font-medium text-gray-700">Year Built *</label>
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
          <label className="text-sm font-medium text-gray-700">Home Type *</label>
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
            <option value="mobile">Mobile home</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Square Footage *</label>
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
          <label className="text-sm font-medium text-gray-700">Number of Floors *</label>
          <input
            type="number"
            required
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
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Temperature Consistency</label>
          <select
            className="w-full p-2 border rounded-md"
            value={formData.currentConditions.temperatureConsistency}
            onChange={(e) => handleInputChange('currentConditions', 'temperatureConsistency', e.target.value)}
          >
            <option value="">Select consistency level</option>
            <option value="very-consistent">Very consistent throughout home</option>
            <option value="some-variation">Some noticeable variations</option>
            <option value="large-variation">Large variations between areas</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Window Assessment</label>
          <select
            className="w-full p-2 border rounded-md"
            value={formData.currentConditions.windowCount}
            onChange={(e) => handleInputChange('currentConditions', 'windowCount', e.target.value)}
          >
            <option value="">Select window count</option>
            <option value="few">Few windows (less than 10)</option>
            <option value="average">Average number (10-20)</option>
            <option value="many">Many windows (more than 20)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderHVACSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">HVAC Systems</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Heating System Type</label>
          <select
            className="w-full p-2 border rounded-md"
            value={formData.hvac.heatingType}
            onChange={(e) => handleInputChange('hvac', 'heatingType', e.target.value)}
          >
            <option value="">Select heating type</option>
            <option value="furnace">Forced air (vents in floors/walls)</option>
            <option value="radiator">Radiators or baseboards</option>
            <option value="heat-pump">Heat pump</option>
            <option value="portable">Portable heaters</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Cooling System Type</label>
          <select
            className="w-full p-2 border rounded-md"
            value={formData.hvac.coolingType}
            onChange={(e) => handleInputChange('hvac', 'coolingType', e.target.value)}
          >
            <option value="">Select cooling type</option>
            <option value="central">Central air conditioning</option>
            <option value="window">Window units</option>
            <option value="portable">Portable units</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (currentSection) {
      case FORM_SECTIONS.BASIC_INFO.id:
        return renderBasicInfoSection();
      case FORM_SECTIONS.HOME_DETAILS.id:
        return renderHomeDetailsSection();
      case FORM_SECTIONS.CURRENT_CONDITIONS.id:
        return renderCurrentConditionsSection();
      case FORM_SECTIONS.HVAC.id:
        return renderHVACSection();
      default:
        return null;
    }
  };

  const sections = Object.values(FORM_SECTIONS);
  const currentIndex = sections.findIndex(section => section.id === currentSection);

  const handleNext = () => {
    if (currentIndex < sections.length - 1) {
      setCurrentSection(sections[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentSection(sections[currentIndex - 1].id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log('Form data:', formData);
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

      <div className="bg-white rounded-lg shadow-sm p-6">
        {renderCurrentSection()}

        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          {currentIndex === sections.length - 1 ? (
            <button
              type="submit"
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Submit
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
      </div>
    </form>
  );
};

export default EnergyAuditForm;