import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '@/config/api';
import useAuth from '@/context/AuthContext';
import { useComponentTracking } from '../../hooks/analytics/useComponentTracking';
import { useFormTracking } from '../../hooks/analytics/useFormTracking';
import { AnalyticsArea } from '../../context/AnalyticsContext';
import FormProgressIndicator from './FormProgressIndicator';
import FormErrorDisplay from './FormErrorDisplay';
import BasicInfoForm from './forms/BasicInfoForm';
import HomeDetailsForm from './forms/HomeDetailsForm';
import CurrentConditionsForm from './forms/CurrentConditionsForm';
import HVACForm from './forms/HVACForm';
import EnergyUseForm from './forms/EnergyUseForm';
import LightingForm from './forms/LightingForm';
import ProductPreferencesForm from './forms/ProductPreferencesForm';
import AuditSubmissionModal from './AuditSubmissionModal';
import { Dialog } from '@/components/ui/Dialog';
import { getStoredAuditData, storeAuditData, clearStoredAuditData } from '@/utils/auditStorage';
import { 
  fetchUserProfileData, 
  updateUserProfileFromAudit,
  fetchLatestAuditData
} from '@/services/userProfileService.enhanced';
import { getMobileHomeDefaults } from './forms/MobileHomeDefaults';
import { 
  EnergyAuditData,
  BasicInfo,
  HomeDetails,
  CurrentConditions,
  HeatingCooling,
  EnergyConsumption,
  ProductPreferences
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
  
  // Add granular analytics tracking with feature-specific names
  const trackNavigation = useComponentTracking('energy_audit' as AnalyticsArea, 'EnergyAuditForm_Navigation');
  const trackAdvancedOptions = useComponentTracking('energy_audit' as AnalyticsArea, 'EnergyAuditForm_AdvancedOptions');
  const trackSubmission = useComponentTracking('energy_audit' as AnalyticsArea, 'EnergyAuditForm_Submission');
  const trackValidation = useComponentTracking('energy_audit' as AnalyticsArea, 'EnergyAuditForm_Validation');
  const { trackFormStart, trackFormStep, trackFormComplete } = useFormTracking('energy_audit' as AnalyticsArea);
  
  // Track form start on initial render
  useEffect(() => {
    trackFormStart('energy_audit_form_start', { 
      isAuthenticated: !!isAuthenticated,
      initialStep: currentStep 
    });
  }, [trackFormStart, isAuthenticated, currentStep]);
  
  // Auto-fill related state
  const [userProfileData, setUserProfileData] = useState<any>(null);
  const [previousAuditData, setPreviousAuditData] = useState<EnergyAuditData | null>(null);
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
      squareFootage: 1500, // Default to medium size instead of 0
      stories: 1, // Default to 1 story
      bedrooms: 0,
      bathrooms: 0,
      homeType: '',
      homeSize: 1500, // Default to medium size
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
        lastService: '',
        outputCapacity: 0,
        inputPower: 0,
        targetEfficiency: 0
      },
      coolingSystem: {
        type: '',
        age: 0,
        efficiency: 0,
        outputCapacity: 0,
        inputPower: 0,
        targetEfficiency: 0
      },
      thermostatType: '',
      zoneCount: 1,
      systemPerformance: 'works-well',
      temperatureDifferenceCategory: 'moderate',
      temperatureDifference: 15
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
      season: '',
      durationHours: 0,
      powerFactor: 0.9, // Default power factor value
      seasonalFactor: 1.0, // Default seasonal factor value
      occupancyFactor: 0.8  // Default occupancy factor value
    },
    productPreferences: {
      categories: [],
      features: [],
      budgetConstraint: 5000 // Default budget
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
  
  // Fetch user profile data and latest audit data for auto-fill
  useEffect(() => {
    if (isAuthenticated) {
      // Fetch user profile
      const loadUserProfile = async () => {
        const profileData = await fetchUserProfileData();
        if (profileData) {
          setUserProfileData(profileData);
        }
      };
      
      // Fetch latest audit data
      const loadLatestAudit = async () => {
        try {
          console.log('Fetching latest audit data for pre-fill...');
          const auditData = await fetchLatestAuditData();
          if (auditData) {
            console.log('Found previous audit data:', auditData.basicInfo?.propertyType);
            setPreviousAuditData(auditData);
          }
        } catch (error) {
          console.error('Error fetching latest audit data:', error);
        }
      };
      
      loadUserProfile();
      loadLatestAudit();
    }
  }, [isAuthenticated]);
  
  // Apply previous audit data after user profile and latest audit are loaded
  useEffect(() => {
    if (!getStoredAuditData() && !initialData && userProfileData && previousAuditData) {
      console.log('Applying previous audit data for a new audit...');
      
      // Merge previous audit data with current form data, but prioritize user profile for basic info
      const newFormData = { ...formData };
      const newAutofilledFields = { ...autofilledFields };
      
      // Keep track of which fields were pre-filled
      const prefilledSummary: string[] = [];
      
      // Basic info - prioritize user profile data
      if (userProfileData.fullName) {
        newFormData.basicInfo.fullName = userProfileData.fullName;
        newAutofilledFields.basicInfo.push('fullName');
        prefilledSummary.push('name');
      } else if (previousAuditData.basicInfo?.fullName) {
        newFormData.basicInfo.fullName = previousAuditData.basicInfo.fullName;
        newAutofilledFields.basicInfo.push('fullName');
        prefilledSummary.push('name');
      }
      
      if (userProfileData.email) {
        newFormData.basicInfo.email = userProfileData.email;
        newAutofilledFields.basicInfo.push('email');
        prefilledSummary.push('email');
      } else if (previousAuditData.basicInfo?.email) {
        newFormData.basicInfo.email = previousAuditData.basicInfo.email;
        newAutofilledFields.basicInfo.push('email');
        prefilledSummary.push('email');
      }
      
      if (userProfileData.phone) {
        newFormData.basicInfo.phone = userProfileData.phone;
        newAutofilledFields.basicInfo.push('phone');
        prefilledSummary.push('phone');
      } else if (previousAuditData.basicInfo?.phone) {
        newFormData.basicInfo.phone = previousAuditData.basicInfo.phone;
        newAutofilledFields.basicInfo.push('phone');
        prefilledSummary.push('phone');
      }
      
      if (userProfileData.address) {
        newFormData.basicInfo.address = userProfileData.address;
        newAutofilledFields.basicInfo.push('address');
        prefilledSummary.push('address');
      } else if (previousAuditData.basicInfo?.address) {
        newFormData.basicInfo.address = previousAuditData.basicInfo.address;
        newAutofilledFields.basicInfo.push('address');
        prefilledSummary.push('address');
      }
      
      // User profile settings have specific property details
      if (userProfileData.propertyDetails) {
        // Property type
        if (userProfileData.propertyDetails.propertyType) {
          newFormData.basicInfo.propertyType = userProfileData.propertyDetails.propertyType;
          prefilledSummary.push('property type');
        }
        
        // Year built
        if (userProfileData.propertyDetails.yearBuilt) {
          newFormData.basicInfo.yearBuilt = userProfileData.propertyDetails.yearBuilt;
          prefilledSummary.push('year built');
        }
        
        // Square footage
        if (userProfileData.propertyDetails.squareFootage) {
          newFormData.homeDetails.squareFootage = userProfileData.propertyDetails.squareFootage;
          newFormData.homeDetails.homeSize = userProfileData.propertyDetails.squareFootage;
          prefilledSummary.push('square footage');
        }
        
        // Stories
        if (userProfileData.propertyDetails.stories) {
          newFormData.homeDetails.stories = userProfileData.propertyDetails.stories;
          prefilledSummary.push('number of stories');
        }
      } 
      // Fill remaining fields from previous audit if no user profile data
      else if (previousAuditData.basicInfo) {
        if (previousAuditData.basicInfo.propertyType && !newFormData.basicInfo.propertyType) {
          newFormData.basicInfo.propertyType = previousAuditData.basicInfo.propertyType;
          prefilledSummary.push('property type');
        }
        
        if (previousAuditData.basicInfo.yearBuilt && !newFormData.basicInfo.yearBuilt) {
          newFormData.basicInfo.yearBuilt = previousAuditData.basicInfo.yearBuilt;
          prefilledSummary.push('year built');
        }
      }
      
      // For home details, use previous audit data if not set from property details
      if (previousAuditData.homeDetails) {
        // Only use previous audit data if not already set from property details
        if (previousAuditData.homeDetails.squareFootage && !newFormData.homeDetails.squareFootage) {
          newFormData.homeDetails.squareFootage = previousAuditData.homeDetails.squareFootage;
          newFormData.homeDetails.homeSize = previousAuditData.homeDetails.squareFootage;
          prefilledSummary.push('square footage');
        }
        
        if (previousAuditData.homeDetails.stories && !newFormData.homeDetails.stories) {
          newFormData.homeDetails.stories = previousAuditData.homeDetails.stories;
          prefilledSummary.push('number of stories');
        }
        
        // These fields aren't in property details, so always use from previous audit
        if (previousAuditData.homeDetails.bedrooms) {
          newFormData.homeDetails.bedrooms = previousAuditData.homeDetails.bedrooms;
          prefilledSummary.push('bedrooms');
        }
        
        if (previousAuditData.homeDetails.bathrooms) {
          newFormData.homeDetails.bathrooms = previousAuditData.homeDetails.bathrooms;
          prefilledSummary.push('bathrooms');
        }
        
        if (previousAuditData.homeDetails.homeType) {
          newFormData.homeDetails.homeType = previousAuditData.homeDetails.homeType;
          prefilledSummary.push('home type');
        }
      }
      
      // Current conditions - use window info from user profile if available
      if (userProfileData.windowMaintenance) {
        if (userProfileData.windowMaintenance.windowCount) {
          newFormData.currentConditions.numWindows = userProfileData.windowMaintenance.windowCount;
          newAutofilledFields.currentConditions.push('numWindows');
          prefilledSummary.push('window count');
          
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
        
        if (userProfileData.windowMaintenance.windowType) {
          newFormData.currentConditions.windowType = userProfileData.windowMaintenance.windowType;
          newAutofilledFields.currentConditions.push('windowType');
          prefilledSummary.push('window type');
        }
      }
      // If not available in user profile, use from previous audit
      else if (previousAuditData.currentConditions) {
        if (previousAuditData.currentConditions.numWindows) {
          newFormData.currentConditions.numWindows = previousAuditData.currentConditions.numWindows;
          newAutofilledFields.currentConditions.push('numWindows');
          prefilledSummary.push('window count');
        }
        
        if (previousAuditData.currentConditions.windowCount) {
          newFormData.currentConditions.windowCount = previousAuditData.currentConditions.windowCount;
          newAutofilledFields.currentConditions.push('windowCount');
        }
        
        if (previousAuditData.currentConditions.windowType) {
          newFormData.currentConditions.windowType = previousAuditData.currentConditions.windowType;
          newAutofilledFields.currentConditions.push('windowType');
          prefilledSummary.push('window type');
        }
      }
      
      // Air leaks from weatherization in user profile
      if (userProfileData.weatherization?.draftLocations?.locations) {
        newFormData.currentConditions.airLeaks = userProfileData.weatherization.draftLocations.locations;
        newAutofilledFields.currentConditions.push('airLeaks');
        prefilledSummary.push('air leaks');
      }
      // Or from previous audit if not in user profile
      else if (previousAuditData.currentConditions?.airLeaks?.length) {
        newFormData.currentConditions.airLeaks = previousAuditData.currentConditions.airLeaks;
        newAutofilledFields.currentConditions.push('airLeaks');
        prefilledSummary.push('air leaks');
      }
      
      // Copy other current conditions from previous audit
      if (previousAuditData.currentConditions) {
        if (previousAuditData.currentConditions.insulation) {
          newFormData.currentConditions.insulation = {
            ...newFormData.currentConditions.insulation,
            ...previousAuditData.currentConditions.insulation
          };
          prefilledSummary.push('insulation details');
        }
        
        if (previousAuditData.currentConditions.windowCondition) {
          newFormData.currentConditions.windowCondition = previousAuditData.currentConditions.windowCondition;
          prefilledSummary.push('window condition');
        }
        
        if (previousAuditData.currentConditions.doorCount) {
          newFormData.currentConditions.doorCount = previousAuditData.currentConditions.doorCount;
          prefilledSummary.push('door count');
        }
        
        if (previousAuditData.currentConditions.weatherStripping) {
          newFormData.currentConditions.weatherStripping = previousAuditData.currentConditions.weatherStripping;
          prefilledSummary.push('weather stripping');
        }
        
        if (previousAuditData.currentConditions.temperatureConsistency) {
          newFormData.currentConditions.temperatureConsistency = previousAuditData.currentConditions.temperatureConsistency;
          prefilledSummary.push('temperature consistency');
        }
        
        if (previousAuditData.currentConditions.comfortIssues?.length) {
          newFormData.currentConditions.comfortIssues = previousAuditData.currentConditions.comfortIssues;
          prefilledSummary.push('comfort issues');
        }
      }
      
      // Copy HVAC details from previous audit
      if (previousAuditData.heatingCooling) {
        newFormData.heatingCooling = {
          ...newFormData.heatingCooling,
          ...previousAuditData.heatingCooling
        };
        prefilledSummary.push('heating and cooling details');
      }
      
      // Copy energy consumption details from previous audit
      if (previousAuditData.energyConsumption) {
        newFormData.energyConsumption = {
          ...newFormData.energyConsumption,
          ...previousAuditData.energyConsumption
        };
        prefilledSummary.push('energy consumption details');
      }
      
      // Copy product preferences from previous audit
      if (previousAuditData.productPreferences) {
        newFormData.productPreferences = {
          ...newFormData.productPreferences,
          ...previousAuditData.productPreferences
        };
        prefilledSummary.push('product preferences');
      }
      
      // Apply the updated form data and autofilled fields
      setFormData(newFormData);
      setAutofilledFields(newAutofilledFields);
      
      console.log('Pre-filled form with data from user profile and previous audit:', prefilledSummary.join(', '));
    }
  }, [userProfileData, previousAuditData, initialData, formData, autofilledFields]);

  // Save form data to localStorage when it changes
  useEffect(() => {
    if (currentStep > 1) {
      storeAuditData(formData);
    }
  }, [formData]);

  // Apply mobile home defaults when homeType and/or yearBuilt changes
  useEffect(() => {
    // Propagate mobile home specific defaults to all relevant form sections
    const applyMobileHomeDefaults = () => {
      const propertyType = formData.basicInfo.propertyType;
      const homeType = formData.homeDetails.homeType;
      
      // Only apply if both property type and home type are set to mobile home
      if (propertyType === 'mobile-home' && homeType === 'mobile-home') {
        const yearBuilt = formData.basicInfo.yearBuilt || 2000; // Default to 2000 if not set
        const squareFootage = formData.homeDetails.squareFootage || 
                              (formData.homeDetails.homeSize || 1500); // Use size or default
        
        try {
          console.log('Applying mobile home defaults for year built:', yearBuilt, 'size:', squareFootage);
          // Get mobile-specific defaults based on year and size
          const mobileDefaults = getMobileHomeDefaults(yearBuilt, squareFootage);
          
          if (mobileDefaults) {
            setFormData(prevData => {
              const newData = { ...prevData };
              
              // Apply current conditions defaults with type checking
              if (mobileDefaults.currentConditions) {
                // Extract safely to ensure type safety
                const {
                  insulation,
                  windowType,
                  numWindows,
                  windowCount,
                  airLeaks,
                  estimatedACH,
                  temperatureConsistency
                } = mobileDefaults.currentConditions;
                
                // Cast windowCondition to the correct type
                let windowCondition: 'fair' | 'poor' | 'good' | 'excellent' = 'fair'; // Default value
                
                // Check if the value from mobile defaults is one of our valid enum values
                if (mobileDefaults.currentConditions.windowCondition === 'fair' || 
                    mobileDefaults.currentConditions.windowCondition === 'poor' || 
                    mobileDefaults.currentConditions.windowCondition === 'good' || 
                    mobileDefaults.currentConditions.windowCondition === 'excellent') {
                  // Type assertion is safe here since we've verified it's one of our valid values
                  windowCondition = mobileDefaults.currentConditions.windowCondition as 'fair' | 'poor' | 'good' | 'excellent';
                }
                
                // Safe weatherStripping with type checking
                let weatherStripping = mobileDefaults.currentConditions.weatherStripping;
                if (weatherStripping !== 'none' && 
                    weatherStripping !== 'foam' && 
                    weatherStripping !== 'metal' && 
                    weatherStripping !== 'door-sweep' && 
                    weatherStripping !== 'not-sure') {
                  weatherStripping = 'none'; // Default to a safe value
                }
                
                newData.currentConditions = {
                  ...prevData.currentConditions,
                  windowType,
                  numWindows,
                  windowCount: windowCount as 'few' | 'average' | 'many',
                  airLeaks: Array.isArray(airLeaks) ? airLeaks : prevData.currentConditions.airLeaks,
                  windowCondition,
                  weatherStripping,
                  temperatureConsistency: temperatureConsistency as 'very-consistent' | 'some-variations' | 'large-variations',
                  // Ensure specific properties are properly merged
                  insulation: {
                    ...prevData.currentConditions.insulation,
                    ...(insulation || {})
                  }
                };
                
                // Note: estimatedACH is used internally but not stored in the model
                // We're not adding it to the model to avoid type errors
              }
              
              // Apply HVAC defaults - only setting valid properties
              if (mobileDefaults.heatingCooling) {
                // Create a new heating/cooling object with only the properties we need
                const newHeatingCooling = { ...prevData.heatingCooling };
                
                // Add zone count if valid
                if (typeof mobileDefaults.heatingCooling.zoneCount === 'number') {
                  newHeatingCooling.zoneCount = mobileDefaults.heatingCooling.zoneCount;
                }
                
                // Add thermostat type if present
                if (mobileDefaults.heatingCooling.thermostatType) {
                  newHeatingCooling.thermostatType = mobileDefaults.heatingCooling.thermostatType;
                }
                
                // Add system performance if valid enum value
                const systemPerformance = mobileDefaults.heatingCooling.systemPerformance;
                if (systemPerformance === 'works-well' || 
                    systemPerformance === 'some-problems' || 
                    systemPerformance === 'needs-attention') {
                  newHeatingCooling.systemPerformance = systemPerformance;
                }
                
                // Update heating and cooling systems
                if (mobileDefaults.heatingCooling.heatingSystem) {
                  newHeatingCooling.heatingSystem = {
                    ...prevData.heatingCooling.heatingSystem,
                    ...mobileDefaults.heatingCooling.heatingSystem
                  };
                }
                
                if (mobileDefaults.heatingCooling.coolingSystem) {
                  newHeatingCooling.coolingSystem = {
                    ...prevData.heatingCooling.coolingSystem,
                    ...mobileDefaults.heatingCooling.coolingSystem
                  };
                }
                
                // Apply the updated heating/cooling object
                newData.heatingCooling = newHeatingCooling;
              }
              
              // Apply energy consumption defaults if available
              if (mobileDefaults.energyConsumption) {
                newData.energyConsumption = {
                  ...prevData.energyConsumption,
                  ...mobileDefaults.energyConsumption
                };
              }
              
              return newData;
            });
            
            console.log('Applied mobile home defaults successfully');
          }
        } catch (error) {
          console.error('Error applying mobile home defaults:', error);
        }
      }
    };
    
    applyMobileHomeDefaults();
  }, [formData.basicInfo.propertyType, formData.homeDetails.homeType, formData.basicInfo.yearBuilt]);

  // Update insulation values when property type changes for apartments/condos
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
      // Track completion of the current step
      trackFormStep(`step_${currentStep}_complete`, {
        section: getSectionKey(currentStep),
        nextStep: currentStep + 1
      });
      
      // Track navigation to next step
      trackNavigation('next', {
        fromStep: currentStep,
        toStep: currentStep + 1,
        fromSection: getSectionKey(currentStep),
        toSection: getSectionKey(currentStep + 1)
      });
      
      setCurrentStep(step => step + 1);
      setValidationErrors([]);
    } else {
      // Track validation errors
      trackValidation('error', {
        step: currentStep,
        section: getSectionKey(currentStep),
        errors: validationErrors
      });
    }
  };

  const handlePrevious = () => {
    // Track navigation to previous step
    trackNavigation('previous', {
      fromStep: currentStep,
      toStep: currentStep - 1,
      fromSection: getSectionKey(currentStep),
      toSection: getSectionKey(currentStep - 1)
    });
    
    setCurrentStep(step => step - 1);
    setValidationErrors([]);
  };

  // Function to autofill missing advanced fields with reasonable defaults
  const autofillAdvancedFields = () => {
    // Track advanced options autofill
    trackAdvancedOptions('autofill', {
      step: currentStep,
      section: getSectionKey(currentStep)
    });
    // Create a deep copy of the current form data
    const updatedData = { ...formData };
    
    // 1. Autofill home details advanced fields
    if (!updatedData.homeDetails.bedrooms || updatedData.homeDetails.bedrooms <= 0) {
      // Estimate bedrooms based on size category
      const sizeValue = updatedData.homeDetails.homeSize;
      if (sizeValue <= 1000) updatedData.homeDetails.bedrooms = 1;
      else if (sizeValue <= 1500) updatedData.homeDetails.bedrooms = 2;
      else if (sizeValue <= 2500) updatedData.homeDetails.bedrooms = 3;
      else updatedData.homeDetails.bedrooms = 4;
    }
    
    if (!updatedData.homeDetails.bathrooms || updatedData.homeDetails.bathrooms <= 0) {
      // Estimate bathrooms based on bedrooms and size
      const bedroomCount = updatedData.homeDetails.bedrooms;
      updatedData.homeDetails.bathrooms = Math.max(1, Math.floor(bedroomCount * 0.75));
    }
    
    if (!updatedData.homeDetails.numRooms || updatedData.homeDetails.numRooms <= 0) {
      // Estimate total rooms based on bedrooms
      const bedroomCount = updatedData.homeDetails.bedrooms;
      updatedData.homeDetails.numRooms = bedroomCount + 3; // bedrooms + kitchen + living + dining
    }
    
    if (!updatedData.homeDetails.numFloors || updatedData.homeDetails.numFloors <= 0) {
      // Use stories as floors if not set
      updatedData.homeDetails.numFloors = updatedData.homeDetails.stories || 1;
    }
    
    // Set default wall dimensions based on square footage for rectangular homes
    if (!updatedData.homeDetails.wallLength || updatedData.homeDetails.wallLength <= 0) {
      const squareFootage = updatedData.homeDetails.squareFootage || updatedData.homeDetails.homeSize;
      updatedData.homeDetails.wallLength = Math.round(Math.sqrt(squareFootage));
    }
    
    if (!updatedData.homeDetails.wallWidth || updatedData.homeDetails.wallWidth <= 0) {
      const squareFootage = updatedData.homeDetails.squareFootage || updatedData.homeDetails.homeSize;
      const length = updatedData.homeDetails.wallLength;
      updatedData.homeDetails.wallWidth = Math.round(squareFootage / length);
    }
    
    if (!updatedData.homeDetails.ceilingHeight || updatedData.homeDetails.ceilingHeight <= 0) {
      // Default ceiling height
      updatedData.homeDetails.ceilingHeight = 8; // Standard 8ft ceiling
    }
    
    // 2. Update the form data with the autofilled values
    setFormData(updatedData);
    
    console.log('Autofilled advanced fields with reasonable defaults');
    return updatedData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track submission attempt
    trackSubmission('click', { step: currentStep });
    
    if (onSubmit) {
      onSubmit(formData);
      return;
    }

    // Autofill missing advanced fields with reasonable defaults
    const completeFormData = autofillAdvancedFields();

    // Debug info
    console.log('Final form data before submission:', JSON.stringify(completeFormData, null, 2));
    console.log('Square footage:', completeFormData.homeDetails.squareFootage);

    // Validate all sections
    console.log('Validating all sections...');
    const allSectionErrors = [
      ...Object.keys(formData).flatMap(section =>
        validateSection(section as keyof EnergyAuditData, formData)
      ),
      ...validateSection('lighting', formData) // Add lighting validation
    ];

    if (allSectionErrors.length > 0) {
      console.error('Validation errors:', allSectionErrors);
      setValidationErrors(allSectionErrors);
      
      // Track validation errors on submission
      trackValidation('submission_error', {
        errorCount: allSectionErrors.length,
        errors: allSectionErrors
      });
      
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

      // Add Authorization header if we have an access token in cookies
      const accessToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        console.log('Added Authorization header with access token');
      }

      // The fetch API will automatically include cookies with credentials: 'include'
      console.log('Using credentials: include to send auth cookies automatically');

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

      // Verify response contains a valid ID
      const result = responseData as AuditResponse;
      
      if (!result.id || result.id === 'null' || result.id === 'undefined') {
        console.error('Server returned invalid audit ID:', result.id);
        throw new Error('Server returned invalid audit ID. Please try again later.');
      }
      
      // Log successful ID for debugging
      console.log('Successfully received audit ID:', result.id);
      setSubmittedAuditId(result.id);
      
      // Track successful submission
      trackFormComplete('audit_submission_success', {
        auditId: result.id,
        isAuthenticated: !!isAuthenticated,
        propertyType: formData.basicInfo.propertyType,
        yearBuilt: formData.basicInfo.yearBuilt
      });
      
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
    // Track modal close action
    trackSubmission('modal_close', {});
    
    setShowSubmissionModal(false);
    clearStoredAuditData();
    
    if (!isAuthenticated && submittedAuditId) {
      // For guest users, redirect to the reports page with the audit ID
      window.location.href = `https://energy-audit-store-e66479ed4f2b.herokuapp.com/reports/${submittedAuditId}`;
    } else {
      // For authenticated users, navigate to home
      navigate('/');
    }
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
            propertyType={formData.basicInfo.propertyType}
          />
        );
      case 3:
        return (
          <CurrentConditionsForm
            data={formData.currentConditions}
            onInputChange={(field, value) => handleInputChange('currentConditions', field, value)}
            autofilledFields={autofilledFields.currentConditions}
            propertyType={formData.basicInfo.propertyType}
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
      case 6:
        return (
          <LightingForm
            data={formData.currentConditions}
            onInputChange={(field, value) => handleInputChange('currentConditions', field, value)}
          />
        );
      case 7:
        // Always ensure productPreferences is initialized with default values
        // to prevent validation errors on first render
        if (!formData.productPreferences || !formData.productPreferences.categories) {
          setFormData(prevData => ({
            ...prevData,
            productPreferences: {
              ...(prevData.productPreferences || {}),
              categories: prevData.productPreferences?.categories || ['hvac'],
              features: prevData.productPreferences?.features || [],
              budgetConstraint: prevData.productPreferences?.budgetConstraint || 5000
            }
          }));
        }
        
        // Create a separate handler for product preferences
        const handleProductPreferencesChange = (field: keyof ProductPreferences, value: any) => {
          setUserModified(prev => ({
            ...prev,
            [`productPreferences.${String(field)}`]: true
          }));
          
          setFormData(prevData => ({
            ...prevData,
            productPreferences: {
              ...prevData.productPreferences!,
              [field]: value
            }
          }));
        };
        
        return (
          <ProductPreferencesForm
            data={formData.productPreferences || { categories: [], features: [], budgetConstraint: 5000 }}
            onInputChange={handleProductPreferencesChange}
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
            {currentStep < 7 ? (
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
