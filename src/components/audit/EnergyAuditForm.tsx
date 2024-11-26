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

// Form sections based on the Google Form structure
const FORM_SECTIONS = {
  BASIC_INFO: 'basicInfo',
  HOME_DETAILS: 'homeDetails',
  CURRENT_CONDITIONS: 'currentConditions',
  HEATING_COOLING: 'heatingCooling',
  ENERGY_CONSUMPTION: 'energyConsumption',
  LIGHTING: 'lighting',
  RENEWABLE_POTENTIAL: 'renewablePotential',
  FINANCIAL: 'financial'
};

const EnergyAuditForm = () => {
  const [currentSection, setCurrentSection] = useState(FORM_SECTIONS.BASIC_INFO);
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
    // Additional sections will be added as needed
  });

  const handleInputChange = (section: keyof typeof formData, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const renderProgressBar = () => {
    const sections = Object.values(FORM_SECTIONS);
    const currentIndex = sections.indexOf(currentSection);
    const progress = ((currentIndex + 1) / sections.length) * 100;

    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div
          className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
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
        {/* Additional fields */}
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
            className="w-full p-2 border rounded-md"
            value={formData.homeDetails.yearBuilt}
            onChange={(e) => handleInputChange('homeDetails', 'yearBuilt', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Home Size (sq ft) *</label>
          <input
            type="number"
            required
            className="w-full p-2 border rounded-md"
            value={formData.homeDetails.homeSize}
            onChange={(e) => handleInputChange('homeDetails', 'homeSize', e.target.value)}
          />
        </div>
        {/* Additional fields */}
      </div>
    </div>
  );

  const renderNavigation = () => {
    const sections = Object.values(FORM_SECTIONS);
    const currentIndex = sections.indexOf(currentSection);

    return (
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setCurrentSection(sections[currentIndex - 1]!)}
          disabled={currentIndex === 0}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </button>
        <button
          onClick={() => setCurrentSection(sections[currentIndex + 1]!)}
          disabled={currentIndex === sections.length - 1}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    );
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      case FORM_SECTIONS.BASIC_INFO:
        return renderBasicInfoSection();
      case FORM_SECTIONS.HOME_DETAILS:
        return renderHomeDetailsSection();
      // Additional section renders will be added
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">DIY Energy Audit</h2>
        <p className="mt-2 text-gray-600">
          Complete this form to receive personalized energy efficiency recommendations.
        </p>
      </div>

      {renderProgressBar()}

      <div className="bg-white rounded-lg shadow-sm p-6">
        {renderCurrentSection()}
        {renderNavigation()}
      </div>
    </div>
  );
};

export default EnergyAuditForm;