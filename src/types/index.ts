// src/types/index.ts

export interface Material {
  id: string;
  name: string;
  type: string;
  thickness_mm: number;
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

// Represents an item added to the customizer's list before final checkout
export interface PartListItem {
  id: string; // Unique ID for this list item (e.g., generated with uuid)
  partType: 'curve' | 'box' | 'shape' | 'perf'; // Type of part
  config: ProductConfiguration; // The configuration of this specific part
  quantity: number; // How many of this specific configuration
  singlePartAreaM2: number; // Area of one unit of this part (or one split section) in m²
  numSplits: number; // How many sections the original part is split into (default 1)
  itemIdealEfficiency: number; // The calculated ideal nesting efficiency for this specific part type/config
} 