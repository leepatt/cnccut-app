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

interface PerfBuilderFormProps {
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

export function PerfBuilderForm({ product, onConfigChange }: PerfBuilderFormProps) {
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
    console.log('[PerfBuilderForm] Emitting config change:', config);
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
              <SelectTrigger className="w-full">
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
        // Since param is known to be ProductParameter, use type assertion for safety
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <div key={(param as any).id}>Unsupported parameter type: {(param as any).type}</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {product.parameters.map(renderParameter)}
      </div>
    </div>
  );
} 