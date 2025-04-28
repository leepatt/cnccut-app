'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  ProductDefinition,
  Material,
  ProductParameter,
  ProductConfiguration,
  NumberParameter,
  ButtonGroupParameter,
  SelectParameter
} from '@/types';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface BoxBuilderFormProps {
  product: ProductDefinition;
  onConfigChange: (newConfig: ProductConfiguration) => void;
}

// Helper function to initialize form state from product defaults
function initializeState(parameters: ProductParameter[]): ProductConfiguration {
    const initialState: ProductConfiguration = {};
    parameters.forEach(param => {
        initialState[param.id] = param.defaultValue;
    });
    return initialState;
}

export function BoxBuilderForm({ product, onConfigChange }: BoxBuilderFormProps) {
  const [config, setConfig] = useState<ProductConfiguration>(() => initializeState(product.parameters));
  // State for materials data
  const [materials, setMaterials] = useState<Material[] | null>(null);
  const [materialsLoading, setMaterialsLoading] = useState<boolean>(false);
  const [materialsError, setMaterialsError] = useState<string | null>(null);

  // Effect to fetch materials
  useEffect(() => {
    // Check if any parameter needs materials
    const needsMaterials = product.parameters.some(p => (p as SelectParameter).optionsSource === 'materials');

    if (needsMaterials) {
      const fetchMaterials = async () => {
        setMaterialsLoading(true);
        setMaterialsError(null);
        try {
          const response = await fetch('/api/materials');
          if (!response.ok) {
            throw new Error(`Failed to fetch materials: ${response.statusText}`);
          }
          const data: Material[] = await response.json();
          setMaterials(data);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unknown error fetching materials';
          console.error("Error fetching materials:", message);
          setMaterialsError(message);
          setMaterials(null); // Clear materials on error
        } finally {
          setMaterialsLoading(false);
        }
      };
      fetchMaterials();
    }
  }, [product.parameters]); // Re-run if product parameters change

  useEffect(() => {
    console.log('[BoxBuilderForm] Emitting config change:', config);
    onConfigChange(config);
  }, [config, onConfigChange]);

  const handleValueChange = useCallback((id: string, value: string | number) => {
    const param = product.parameters.find(p => p.id === id);
    const processedValue = param?.type === 'number' ? Number(value) : value;

    setConfig(prevConfig => {
       const newConfig = {
         ...prevConfig,
         [id]: processedValue,
       };
       return newConfig;
    });
  }, [product.parameters]);

  const renderParameter = (param: ProductParameter) => {
    const commonProps = {
      id: param.id,
    };
    const label = <Label htmlFor={param.id} className="block mb-2 font-medium text-foreground">{param.label}</Label>;

    switch (param.type) {
      case 'number': {
        const numParam = param as NumberParameter;
        return (
          <div key={param.id} {...commonProps}>
            {label}
            <Input
              type="number"
              id={numParam.id}
              value={config[numParam.id] as number}
              onChange={(e) => handleValueChange(numParam.id, e.target.value)}
              min={numParam.min}
              max={numParam.max}
              step={numParam.step}
              className="w-full" // Use full width within grid cell
            />
            {numParam.description && <p className="text-sm text-muted-foreground mt-1">{numParam.description}</p>}
          </div>
        );
      }
      case 'button-group': {
        const btnParam = param as ButtonGroupParameter;
        return (
          <div key={param.id} {...commonProps}>
            {label}
            <ToggleGroup
              type="single"
              value={config[btnParam.id] as string}
              onValueChange={(value: string) => {
                if (value) {
                  handleValueChange(btnParam.id, value);
                }
              }}
              className="justify-start" // Align buttons to the left
            >
              {btnParam.options.map(option => (
                <ToggleGroupItem key={option.value} value={option.value} aria-label={option.label}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
             {btnParam.description && <p className="text-sm text-muted-foreground mt-1">{btnParam.description}</p>}
          </div>
        );
      }
       case 'select': {
        const selParam = param as SelectParameter;
        let options: { value: string, label: string }[] = [];
        let isLoading = false;
        let errorMsg: string | null = null;
        let placeholder = `Select ${selParam.label}...`;

        // Check if options should be sourced from materials
        if (selParam.optionsSource === 'materials') {
          if (materialsLoading) {
             isLoading = true;
             placeholder = 'Loading materials...';
          } else if (materialsError) {
             errorMsg = materialsError;
             placeholder = 'Error loading materials';
          } else if (materials) {
             // Map Material data to options format
             options = materials.map(mat => ({ value: mat.id, label: mat.name }));
          } else {
             placeholder = 'No materials available'; // Should not happen if fetch logic is correct
          }
        } else if (selParam.options) {
           // Use explicitly defined options
           options = selParam.options;
        } else {
            // No options defined or sourced
            errorMsg = `No options defined for ${selParam.label}`;
            placeholder = errorMsg;
            console.warn(`Select parameter '${selParam.id}' has no options defined or sourced.`);
        }

        // Render disabled select if loading or error
        if (isLoading || errorMsg) {
             return (
                 <div key={param.id} {...commonProps}>
                    {label}
                    <Select disabled>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={placeholder} />
                        </SelectTrigger>
                    </Select>
                    {selParam.description && <p className="text-sm text-muted-foreground mt-1">{selParam.description}</p>}
                    {errorMsg && <p className="text-sm text-red-500 mt-1">{errorMsg}</p>}
                </div>
            );
        }

        // Render standard select with options
        return (
          <div key={param.id} {...commonProps}>
            {label}
            <Select
              value={config[selParam.id] as string}
              onValueChange={(value) => handleValueChange(selParam.id, value)}
            >
              <SelectTrigger className="w-full"> {/* Use full width within grid cell */}
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selParam.description && <p className="text-sm text-muted-foreground mt-1">{selParam.description}</p>}
          </div>
        );
      }
      default:
        // Use a type assertion if param structure is known but not fully typed
        const paramType = (param as { type?: string }).type ?? 'unknown';
        console.warn("Unsupported parameter type:", paramType);
        return null;
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6 p-4 rounded-lg bg-card border border-border">
       <h2 className="text-xl font-semibold mb-4 text-card-foreground">Configure Your Box</h2>
       {/* Use CSS Grid for parameter layout */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
         {/* Render parameters manually in the desired order */}
         {/* Row 1: Width, Depth */}
         {renderParameter(product.parameters.find(p => p.id === 'width')!)}
         {renderParameter(product.parameters.find(p => p.id === 'depth')!)}

         {/* Row 2: Height, Dimension Type */}
         {renderParameter(product.parameters.find(p => p.id === 'height')!)}
         {renderParameter(product.parameters.find(p => p.id === 'dimensionType')!)}

         {/* Row 3: Material (Full Width) */}
         <div className="md:col-span-2">
            {renderParameter(product.parameters.find(p => p.id === 'materialId')!)}
         </div>

         {/* Row 4: Box Type, Join Type */}
         {renderParameter(product.parameters.find(p => p.id === 'boxType')!)}
         {renderParameter(product.parameters.find(p => p.id === 'joinType')!)}

         {/* Render any remaining parameters just in case (though all should be covered) */}
         {/* {product.parameters
            .filter(p => !['width', 'depth', 'height', 'dimensionType', 'materialId', 'boxType', 'joinType'].includes(p.id))
            .map(renderParameter)} */}
       </div>
       {/* TODO: Add Submit / Add to Cart button? */}
       {/* <Button type="submit">Calculate Price / Add to Cart</Button> */}
       {/* Optional: Display current config for debugging */}
        {/* <pre className="mt-4 p-2 bg-secondary rounded text-sm overflow-x-auto">
          {JSON.stringify(config, null, 2)}
        </pre> */}
    </form>
  );
}

