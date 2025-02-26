import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '@/config/api';
import useAuth from '@/context/AuthContext';
import FormProgressIndicator from './FormProgressIndicator';
import FormErrorDisplay from './FormErrorDisplay';
import BasicInfoForm from './forms/BasicInfoForm';
import HomeDetailsForm from './forms/HomeDetailsForm';
import CurrentConditionsForm from './forms/CurrentConditionsForm';
import HVACForm from './forms/HVACForm';
import EnergyUseForm from './forms/EnergyUseForm';
import AuditSubmissionModal from './AuditSubmissionModal';
import Dialog from '@/components/ui/dialog';
import { getStoredAuditData, storeAuditData, clearStoredAuditData } from '@/utils/auditStorage';
import { fetchUserProfileData, updateUserProfileFromAudit } from '@/services/userProfileService';
import { 
  EnergyAuditData,
  BasicInfo,
  HomeDetails,
  CurrentConditions,
  HeatingCooling,
  EnergyConsumption
} from '@/types/energyAudit';
import {
  validateSection,
  getSectionKey,
  getSectionErrors
} from './formValidation';

interface EnergyAuditFormProps {
  onSubmit?: (data: EnergyAuditData) => void;
  initialData?: Partial<EnergyAuditData>;
}

interface AuditResponse {
  id: string;
  [key: string]: any;
}

const EnergyAuditForm: React.FC<EnergyAuditFormProps> = ({ onSubmit, initialData }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submittedAuditId, setSubmittedAuditId] = useState<string | null>(null);
  
  // Auto-fill related state
  const [userProfileData, setUserProfileData] = useState<any>(null);
  const [userModified, setUserModified] = useState<Record<string, boolean>>({});
  const [showUpdateProfileDialog, setShowUpdateProfileDialog] = useState(false);
  const [fieldsToUpdate, setFieldsToUpdate] = useState<string[]>([]);
  const [autofilledFields, setAutofilledFields] = useState<{
    basicInfo: string[];
    currentConditions: string[];
  }>({
    basicInfo: [],
    currentConditions: []
  });

  const [formData, setFormData] = useState<EnergyAuditData>({
    basicInfo: {
      fullName: '',
      email: '',
      phone: '',
      address: '',
      propertyType: '',
      yearBuilt: 0,
      occupants: 0,
      auditDate: new Date().toISOString().slice(0, 10)
    },
    homeDetails: {
      squareFootage: 0,
      stories: 0,
      bedrooms: 0,
      bathrooms: 0,
      homeType: '',
      homeSize: 0,
      constructionPeriod: 'after-2000',
      numRooms: 0,
      numFloors: 0,
      wallLength: 0,
      wallWidth: 0,
      ceilingHeight: 0,
      basementType: 'none',
      basementHeating: 'unheated'
    },
    currentConditions: {
      insulation: {
        attic: '',
        walls: '',
        basement: '',
        floor: ''
      },
      windowType: '',
      windowCondition: 'fair',
      numWindows: 0,
      windowCount: 'average',
      doorCount: 0,
      airLeaks: [],
      weatherStripping: 'none',
      temperatureConsistency: 'some-variations',
      comfortIssues: []
    },
    heatingCooling: {
      heatingSystem: {
        type: '',
        fuel: '',
        fuelType: '',
        age: 0,
        efficiency: 0,
        lastService: ''
      },
      coolingSystem: {
        type: '',
        age: 0,
        efficiency: 0
      },
      thermostatType: '',
      zoneCount: 1,
      systemPerformance: 'works-well'
    },
    energyConsumption: {
      electricBill: 0,
      gasBill: 0,
      seasonalVariation: '',
      powerConsumption: 0,
      occupancyPattern: '',
      occupancyHours: {
        weekday: '',
        weekend: ''
      },
      peakUsageTimes: [],
      monthlyBill: 0,
      season: ''
    }
  });

  // Load saved form data from localStorage on mount
  useEffect(() => {
    const storedData = getStoredAuditData();
    if (storedData) {
      setFormData(prevData => ({
        ...prevData,
        ...storedData.data
      }));
    } else if (initialData) {
      setFormData(prevData => ({
        ...prevData,
        ...initialData
      }));
    }
  }, [initialData]);
  
  // Fetch user profile data for auto-fill
  useEffect(() => {
    if (isAuthenticated) {
      const loadUserProfile = async () => {
        const profileData = await fetchUserProfileData();
        if (profileData) {
          setUserProfileData(profileData);
        }
      };
      
      loadUserProfile();
    }
  }, [isAuthenticated]);
  
  // Auto-fill form with profile data
  useEffect(() => {
    if (userProfileData && !getStoredAuditData() && !initialData) {
      // Only auto-fill if we don't have stored data or initial data
      const newFormData = { ...formData };
      const newAutofilledFields = { ...autofilledFields };
      
      // Auto-fill basic info
      if (!userModified['basicInfo.fullName'] && userProfileData.fullName) {
        newFormData.basicInfo.fullName = userProfileData.fullName;
        newAutofilledFields.basicInfo.push('fullName');
      }
      if (!userModified['basicInfo.email'] && userProfileData.email) {
        newFormData.basicInfo.email = userProfileData.email;
        newAutofilledFields.basicInfo.push('email');
      }
      if (!userModified['basicInfo.phone'] && userProfileData.phone) {
        newFormData.basicInfo.phone = userProfileData.phone;
        newAutofilledFields.basicInfo.push('phone');
      }
      if (!userModified['basicInfo.address'] && userProfileData.address) {
        newFormData.basicInfo.address = userProfileData.address;
        newAutofilledFields.basicInfo.push('address');
      }
      
      // Auto-fill current conditions
      if (!userModified['currentConditions.numWindows'] && userProfileData.windowMaintenance) {
        newFormData.currentConditions.numWindows = userProfileData.windowMaintenance.windowCount;
        newAutofilledFields.currentConditions.push('numWindows');
        
        // Set window count category based on number
        if (userProfileData.windowMaintenance.windowCount < 10) {
          newFormData.currentConditions.windowCount = 'few';
        } else if (userProfileData.windowMaintenance.windowCount > 15) {
          newFormData.currentConditions.windowCount = 'many';
        } else {
          newFormData.currentConditions.windowCount = 'average';
        }
        newAutofilledFields.currentConditions.push('windowCount');
      }
      
      // Auto-fill air leaks from draft locations
      if (!userModified['currentConditions.airLeaks'] && 
          userProfileData.weatherization?.draftLocations?.locations) {
        newFormData.currentConditions.airLeaks = 
          userProfileData.weatherization.draftLocations.locations;
        newAutofilledFields.currentConditions.push('airLeaks');
      }
      
      setFormData(newFormData);
      setAutofilledFields(newAutofilledFields);
    }
  }, [userProfileData, initialData, userModified]);

  // Save form data to localStorage when it changes
  useEffect(() => {
    if (currentStep > 1) {
      storeAuditData(formData);
    }
  }, [formData]);

  // Update insulation values when property type changes
  useEffect(() => {
    const propertyType = formData.basicInfo.propertyType;
    if (propertyType === 'apartment' || propertyType === 'condominium') {
      // Import here to avoid circular dependency
      import('./forms/conditionDefaults').then(({ propertyTypeInsulationDefaults }) => {
        const defaults = propertyTypeInsulationDefaults[propertyType as 'apartment' | 'condominium'];
        if (defaults) {
          setFormData(prevData => ({
            ...prevData,
            currentConditions: {
              ...prevData.currentConditions,
              insulation: defaults.insulation
            }
          }));
        }
      });
    }
  }, [formData.basicInfo.propertyType]);

  const handleInputChange = <T extends keyof EnergyAuditData>(
    section: T,
    field: keyof EnergyAuditData[T],
    value: any
  ) => {
    // Track user modifications
    setUserModified(prev => ({
      ...prev,
      [`${section}.${String(field)}`]: true
    }));
    
    setFormData(prevData => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [field]: value
      }
    }));
  };
  
  // Handle showing profile update dialog
  const handleShowUpdateProfileDialog = () => {
    // Determine which fields were modified and could be updated in profile
    const updatedFields = [];
    
    if (userModified['basicInfo.fullName'] || 
        userModified['basicInfo.phone'] || 
        userModified['basicInfo.address']) {
      updatedFields.push('basicInfo');
    }
    
    if (userModified['currentConditions.numWindows']) {
      updatedFields.push('windowMaintenance');
    }
    
    if (userModified['currentConditions.airLeaks']) {
      updatedFields.push('weatherization');
    }
    
    if (updatedFields.length > 0) {
      setFieldsToUpdate(updatedFields);
      setShowUpdateProfileDialog(true);
    } else {
      // No fields to update, just navigate
      clearStoredAuditData();
      navigate(`/dashboard?newAudit=${submittedAuditId}`);
    }
  };
  
  // Handle profile update confirmation
  const handleUpdateProfile = async () => {
    if (submittedAuditId) {
      await updateUserProfileFromAudit(formData, fieldsToUpdate);
    }
    setShowUpdateProfileDialog(false);
    clearStoredAuditData();
    navigate(`/dashboard?newAudit=${submittedAuditId}`);
  };

  const validateCurrentSection = (): boolean => {
    const currentSection = getSectionKey(currentStep);
    const errors = getSectionErrors(currentSection, formData);
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (validateCurrentSection()) {
      setCurrentStep(step => step + 1);
      setValidationErrors([]);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(step => step - 1);
    setValidationErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (onSubmit) {
      onSubmit(formData);
      return;
    }

    // Validate all sections
    console.log('Validating all sections...');
    const allSectionErrors = Object.keys(formData).flatMap(section =>
      validateSection(section as keyof EnergyAuditData, formData)
    );

    if (allSectionErrors.length > 0) {
      console.error('Validation errors:', allSectionErrors);
      setValidationErrors(allSectionErrors);
      return;
    }

    console.log('All sections validated successfully');
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      // Generate clientId for anonymous users
      const clientId = !isAuthenticated ? localStorage.getItem('clientId') || 
        `anonymous-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : null;

      if (clientId) {
        localStorage.setItem('clientId', clientId);
      }

      console.log('Preparing submission with auth status:', isAuthenticated);
      console.log('ClientId:', clientId);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (isAuthenticated) {
        // Get token from cookie using a more robust method
        const cookies = document.cookie.split('; ');
        const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
        const token = tokenCookie ? tokenCookie.split('=')[1] : null;

        console.log('Token found:', !!token);
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          console.warn('No auth token found in cookies');
        }
      }

      console.log('Submitting audit data to:', API_ENDPOINTS.ENERGY_AUDIT);
      const response = await fetch(API_ENDPOINTS.ENERGY_AUDIT, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          auditData: formData,
          ...(clientId && { clientId })
        })
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to submit audit');
      }

      const result = responseData as AuditResponse;
      setSubmittedAuditId(result.id);
      
      if (isAuthenticated) {
        // Show profile update dialog if user modified fields that could be updated in profile
        handleShowUpdateProfileDialog();
      } else {
        setShowSubmissionModal(true);
      }
    } catch (error) {
      console.error('Detailed submission error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setValidationErrors([error instanceof Error ? error.message : 'Failed to submit audit']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowSubmissionModal(false);
    clearStoredAuditData();
    navigate('/');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoForm
            data={formData.basicInfo}
            onInputChange={(field, value) => handleInputChange('basicInfo', field, value)}
            autofilledFields={autofilledFields.basicInfo}
          />
        );
      case 2:
        return (
          <HomeDetailsForm
            data={formData.homeDetails}
            onInputChange={(field, value) => handleInputChange('homeDetails', field, value)}
          />
        );
      case 3:
        return (
          <CurrentConditionsForm
            data={formData.currentConditions}
            onInputChange={(field, value) => handleInputChange('currentConditions', field, value)}
            autofilledFields={autofilledFields.currentConditions}
          />
        );
      case 4:
        return (
          <HVACForm
            data={formData.heatingCooling}
            onInputChange={(field, value) => handleInputChange('heatingCooling', field, value)}
          />
        );
      case 5:
        return (
          <EnergyUseForm
            data={formData.energyConsumption}
            onInputChange={(field, value) => handleInputChange('energyConsumption', field, value)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <FormProgressIndicator currentSection={currentStep} />
          
          <div className="bg-white shadow-sm rounded-lg">
            {renderStep()}
            <FormErrorDisplay errors={validationErrors} />
          </div>

          <div className="flex justify-between pt-6">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="w-5 h-5 mr-1 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
            )}
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Next
                <svg className="w-5 h-5 ml-1 -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex items-center px-6 py-3 text-base font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  isSubmitting 
                    ? 'bg-green-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Energy Audit
                    <svg className="w-5 h-5 ml-2 -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      <AuditSubmissionModal
        isOpen={showSubmissionModal}
        onClose={handleModalClose}
        auditId={submittedAuditId || ''}
        isAuthenticated={isAuthenticated}
      />
      
      {/* Profile update dialog */}
      <Dialog
        isOpen={showUpdateProfileDialog}
        onClose={() => {
          setShowUpdateProfileDialog(false);
          clearStoredAuditData();
          navigate(`/dashboard?newAudit=${submittedAuditId}`);
        }}
        title="Update Your Profile"
        description="Would you like to update your profile with the information from this energy audit?"
      >
        <div className="mt-4 space-y-2">
          {fieldsToUpdate.includes('basicInfo') && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="update-basic-info"
                checked={fieldsToUpdate.includes('basicInfo')}
                onChange={(e) => {
                  setFieldsToUpdate(prev => 
                    e.target.checked 
                      ? [...prev, 'basicInfo'] 
                      : prev.filter(f => f !== 'basicInfo')
                  );
                }}
                className="mr-2"
              />
              <label htmlFor="update-basic-info">
                Update contact information (name, phone, address)
              </label>
            </div>
          )}
          
          {fieldsToUpdate.includes('windowMaintenance') && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="update-windows"
                checked={fieldsToUpdate.includes('windowMaintenance')}
                onChange={(e) => {
                  setFieldsToUpdate(prev => 
                    e.target.checked 
                      ? [...prev, 'windowMaintenance'] 
                      : prev.filter(f => f !== 'windowMaintenance')
                  );
                }}
                className="mr-2"
              />
              <label htmlFor="update-windows">
                Update window information
              </label>
            </div>
          )}
          
          {fieldsToUpdate.includes('weatherization') && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="update-weatherization"
                checked={fieldsToUpdate.includes('weatherization')}
                onChange={(e) => {
                  setFieldsToUpdate(prev => 
                    e.target.checked 
                      ? [...prev, 'weatherization'] 
                      : prev.filter(f => f !== 'weatherization')
                  );
                }}
                className="mr-2"
              />
              <label htmlFor="update-weatherization">
                Update weatherization information
              </label>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setShowUpdateProfileDialog(false);
              clearStoredAuditData();
              navigate(`/dashboard?newAudit=${submittedAuditId}`);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleUpdateProfile}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
          >
            Update Profile
          </button>
        </div>
      </Dialog>
    </>
  );
};

export default EnergyAuditForm;
