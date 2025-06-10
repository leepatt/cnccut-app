// src/types/index.ts

export interface Material {
  id: string;
  name: string;
  type: string;
  thickness_mm: number;
  cost_per_sq_meter?: number; // Optional for backward compatibility
  sheet_price: number;
  sheet_length_mm: number;
  sheet_width_mm: number;
  usable_sheet_length_mm: number;
  usable_sheet_width_mm: number;
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
  type: string;
  defaultValue: string | number;
  description?: string;
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
}

export interface SelectParameter extends BaseParameter {
  type: 'select';
  options?: ParameterOption[];
  optionsSource?: 'materials';
}

export interface AdjusterParameter extends BaseParameter {
  type: 'adjuster';
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
}

// Derived parameter (calculated from other parameters)
export interface DerivedParameter extends BaseParameter {
  formula: string; // Formula to calculate the value
}

// Union type for all possible parameter types
export type ProductParameter = NumberParameter | ButtonGroupParameter | SelectParameter | AdjusterParameter;

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
  [key: string]: string | number;
}

// Represents a part item in the curves configurator
export interface PartListItem {
  id: string;
  partType: string;
  config: ProductConfiguration;
  quantity: number;
  singlePartAreaM2: number;
  numSplits: number;
  itemIdealEfficiency: number;
} 