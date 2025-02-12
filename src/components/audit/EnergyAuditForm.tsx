import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '@/context/AuthContext';
import { HomeIcon, Thermometer, Lightbulb, Battery, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import AuditSubmissionModal from './AuditSubmissionModal';
import {
  BasicInfoForm,
  HomeDetailsForm,
  CurrentConditionsForm,
  HVACForm,
  EnergyUseForm
} from './forms';
import {
  EnergyAuditData,
  validateBasicInfo,
  validateHomeDetails,
  BasicInfo,
  HomeDetails,
  CurrentConditions,
  HeatingCooling,
  EnergyConsumption
} from '../../../backend/src/types/energyAudit';

type FormSectionData = {
  basicInfo: BasicInfo;
  homeDetails: HomeDetails;
  currentConditions: CurrentConditions;
  heatingCooling: HeatingCooling;
  energyConsumption: EnergyConsumption;
};

type SectionFieldValue<T extends keyof FormSectionData> =
  T extends 'basicInfo' ? string | undefined :
  T extends 'homeDetails' ? number | HomeDetails['homeType'] | HomeDetails['basementType'] | HomeDetails['basementHeating'] :
  T extends 'currentConditions' ? CurrentConditions[keyof CurrentConditions] | CurrentConditions['insulation'] :
  T extends 'heatingCooling' ? HeatingCooling[keyof HeatingCooling] :
  T extends 'energyConsumption' ? EnergyConsumption[keyof EnergyConsumption] | EnergyConsumption['occupancyHours'] :
  never;

const EnergyAuditForm: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const today = new Date().toISOString().substring(0, 10);

  const [formData, setFormData] = useState<FormSectionData>({
    basicInfo: {
      fullName: '',
      email: '',
      phone: undefined,
      address: '',
      auditDate: today,
      propertyType: 'residential',
      yearBuilt: new Date().getFullYear()
    },
    homeDetails: {
      yearBuilt: new Date().getFullYear(),
      homeSize: 1500, // Default to a valid size within 100-50,000 range
      squareFootage: 1500, // Match homeSize as default
      numRooms: 1, // Default to valid minimum
      homeType: 'single-family',
      numFloors: 1,
      basementType: 'none'
    },
    currentConditions: {
      insulation: {
        attic: 'not-sure',
        walls: 'not-sure',
        basement: 'not-sure',
        floor: 'not-sure'
      },
      windowType: 'not-sure',
      numWindows: 1, // Default to valid minimum
      windowCondition: 'fair',
      weatherStripping: 'not-sure'
    },
    heatingCooling: {
      heatingSystem: {
        type: 'furnace',
        fuelType: 'natural-gas',
        age: 1, // Default to valid minimum
        lastService: today
      },
      coolingSystem: {
        type: 'none',
        age: 1 // Default to valid minimum
      }
    },
    energyConsumption: {
      powerConsumption: '2-4kW',
      occupancyHours: {
        weekdays: '7-12',
        weekends: '13-18'
      },
      season: 'spring-fall',
      occupancyPattern: '',
      monthlyBill: 1, // Default to valid minimum (positive number)
      peakUsageTimes: [],
      electricBill: 0,
      gasBill: 0
    }
  });

  const setFormError = (message: string | undefined | null) => {
    setError(() => message ?? null);
  };

  const updateFormData = <T extends keyof FormSectionData>(
    section: T,
    field: string,
    value: SectionFieldValue<T>
  ) => {
    setFormData(prev => {
      if (field === '') {
        return {
          ...prev,
          [section]: value
        };
      }

      const sectionData = prev[section];
      if (typeof sectionData === 'object' && sectionData !== null) {
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [field]: value
          }
        };
      }
      return prev;
    });
    setFormError(null);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        const basicInfoErrors = validateBasicInfo(formData.basicInfo);
        if (basicInfoErrors.length > 0) {
          setFormError(basicInfoErrors[0]);
          return false;
        }
        break;
      case 2:
        const homeDetailsErrors = validateHomeDetails(formData.homeDetails);
        if (homeDetailsErrors.length > 0) {
          setFormError(homeDetailsErrors[0]);
          return false;
        }
        break;
      // Add validation for other steps as needed
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      const { isAuthenticated } = useAuth();
      
      if (isAuthenticated) {
        // Submit directly if user is logged in
        const response = await fetch('/api/energy-audit/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Failed to submit audit');

        const { auditId } = await response.json();
        navigate(`/dashboard?newAudit=${auditId}`);
      } else {
        // Show modal for guest users
        setShowModal(true);
      }
    } catch (err) {
      setFormError('Failed to submit the audit. Please try again.');
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoForm
            data={formData.basicInfo}
            onInputChange={(field, value) => updateFormData('basicInfo', field, value)}
          />
        );
      case 2:
        return (
          <HomeDetailsForm
            data={formData.homeDetails}
            onInputChange={(field, value) => updateFormData('homeDetails', field, value as SectionFieldValue<'homeDetails'>)}
          />
        );
      case 3:
        return (
          <HVACForm
            data={formData.heatingCooling}
            onInputChange={(section, field, value) => {
              updateFormData('heatingCooling', section, {
                ...formData.heatingCooling[section],
                [field]: value
              } as HeatingCooling[keyof HeatingCooling]);
            }}
          />
        );
      case 4:
        return (
          <CurrentConditionsForm
            data={formData.currentConditions}
            onInputChange={(section, field, value) => {
              if (section === 'insulation') {
                updateFormData('currentConditions', 'insulation', {
                  ...formData.currentConditions.insulation,
                  [field]: value
                } as CurrentConditions['insulation']);
              } else {
                updateFormData('currentConditions', field, value as CurrentConditions[keyof CurrentConditions]);
              }
            }}
          />
        );
      case 5:
        return (
          <EnergyUseForm
            data={formData.energyConsumption}
            onInputChange={(field, subfield, value) => {
              if (field === 'occupancyHours') {
                updateFormData('energyConsumption', 'occupancyHours', {
                  ...formData.energyConsumption.occupancyHours,
                  [subfield]: value
                } as EnergyConsumption['occupancyHours']);
              } else {
                updateFormData('energyConsumption', field, value as EnergyConsumption[keyof EnergyConsumption]);
              }
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {error !== null && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between">
            <div className={`text-sm ${currentStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
              <HomeIcon className="h-5 w-5 mb-1" />
              Basic Info
            </div>
            <div className={`text-sm ${currentStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
              <HomeIcon className="h-5 w-5 mb-1" />
              Home Details
            </div>
            <div className={`text-sm ${currentStep >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
              <Thermometer className="h-5 w-5 mb-1" />
              HVAC
            </div>
            <div className={`text-sm ${currentStep >= 4 ? 'text-green-600' : 'text-gray-400'}`}>
              <Lightbulb className="h-5 w-5 mb-1" />
              Insulation
            </div>
            <div className={`text-sm ${currentStep >= 5 ? 'text-green-600' : 'text-gray-400'}`}>
              <Battery className="h-5 w-5 mb-1" />
              Energy Use
            </div>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-green-600 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Steps */}
        <form onSubmit={e => e.preventDefault()}>
          {renderStep()}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </button>
            )}

            <div className="ml-auto">
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep(currentStep)) {
                      setCurrentStep(prev => prev + 1);
                    }
                  }}
                  className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Complete Audit'
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Submission Modal */}
      <AuditSubmissionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        formData={formData}
        onSubmitSuccess={(auditId) => {
          navigate(`/dashboard?newAudit=${auditId}`);
        }}
      />
    </div>
  );
};

export default EnergyAuditForm;
