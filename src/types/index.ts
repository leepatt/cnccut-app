// src/types/index.ts

export interface Material {
  id: string;
  name: string;
  type: string;
  thickness_mm: number;
  cost_per_sq_meter: number;
}

// Represents a single option for parameters like button-group or select
export interface ParameterOption {
  value: string;
  label: string;
}

// Base interface for all parameter types
interface BaseParameter {
  id: string;
  label: string;
  description?: string; // Optional description/tooltip
}

// Specific parameter types extending the base
export interface NumberParameter extends BaseParameter {
  type: 'number';
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface ButtonGroupParameter extends BaseParameter {
  type: 'button-group';
  options: ParameterOption[];
  defaultValue: string; // The value of the default option
}

export interface SelectParameter extends BaseParameter {
  type: 'select';
  optionsSource?: 'materials'; // Specific source for dynamic options
  options?: ParameterOption[];   // Static options (if not from source)
  defaultValue: string;       // The value of the default option
}

// Derived parameter (calculated from other parameters)
export interface DerivedParameter extends BaseParameter {
  formula: string; // Formula to calculate the value
}

// Union type for all possible parameter types
export type ProductParameter = NumberParameter | ButtonGroupParameter | SelectParameter;

// Main definition for a customizable product
export interface ProductDefinition {
  id: string;
  name: string;
  description: string;
  parameters: ProductParameter[];
  derivedParameters?: DerivedParameter[]; // Optional array of derived parameters
}

// Represents the current state of the user's choices for a product
export interface ProductConfiguration {
  [parameterId: string]: string | number; // Keyed by parameter ID
} 