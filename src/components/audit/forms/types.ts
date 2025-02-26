import { BasicInfo, HomeDetails, CurrentConditions, HeatingCooling, EnergyConsumption } from '@/types/energyAudit';

export interface FormComponentProps<T> {
  data: T;
  onInputChange: (field: keyof T, value: any) => void;
  onValidate?: (isValid: boolean) => void;
  autofilledFields?: string[];
}

export type BasicInfoFormProps = FormComponentProps<BasicInfo>;
export type HomeDetailsFormProps = FormComponentProps<HomeDetails>;
export type CurrentConditionsFormProps = FormComponentProps<CurrentConditions>;
export type HVACFormProps = FormComponentProps<HeatingCooling>;
export type EnergyUseFormProps = FormComponentProps<EnergyConsumption>;
