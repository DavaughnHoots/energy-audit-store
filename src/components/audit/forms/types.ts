import { BasicInfo, HomeDetails, CurrentConditions, HeatingCooling, EnergyConsumption, ProductPreferences } from '@/types/energyAudit';

export interface FormComponentProps<T> {
  data: T;
  onInputChange: (field: keyof T, value: any) => void;
  onValidate?: (isValid: boolean) => void;
  autofilledFields?: string[];
}

export type BasicInfoFormProps = FormComponentProps<BasicInfo>;
export type HomeDetailsFormProps = FormComponentProps<HomeDetails>;
export interface CurrentConditionsFormProps extends FormComponentProps<CurrentConditions> {
  propertyType?: string; // Added to access the property type from BasicInfo
}
export type HVACFormProps = FormComponentProps<HeatingCooling>;
export type EnergyUseFormProps = FormComponentProps<EnergyConsumption>;
export type ProductPreferencesFormProps = FormComponentProps<ProductPreferences>;
