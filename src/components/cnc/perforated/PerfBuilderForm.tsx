'use client';

import React, { useState, useCallback, useEffect, ChangeEvent } from 'react';
import {
  ProductDefinition,
  Material,
  ProductParameter,
  ProductConfiguration,
  NumberParameter,
  ButtonGroupParameter,
  SelectParameter,
  AdjusterParameter
} from '@/types';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Plus, Minus } from 'lucide-react';

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

    setConfig((prevConfig: ProductConfiguration) => {
      let newConfig = {
        ...prevConfig,
        [id]: processedValue,
      };

      // If holeType is changed to 'slot', force pattern to 'grid' and ensure default slot values
      if (id === 'holeType') {
        if (processedValue === 'slot') {
          newConfig = {
            ...newConfig,
            pattern: 'grid',
            slotLength: product.parameters.find(p => p.id === 'slotLength')?.defaultValue || 40,
            slotRotation: product.parameters.find(p => p.id === 'slotRotation')?.defaultValue || 'horizontal',
          };
        }
      }
      return newConfig;
    });
  }, [product.parameters]);

  const renderParameter = (param: ProductParameter) => {
    // Skip rendering slot-specific parameters if hole type is not 'slot'
    if ((param.id === 'slotLength' || param.id === 'slotRotation') && config['holeType'] !== 'slot') {
      return null;
    }

    const commonProps = {
      id: param.id,
    };
    const labelId = `perf-label-${param.id}`;
    const label = (
      <div className="block mb-2 font-medium text-foreground">
        <Label>{param.label}</Label>
      </div>
    );

    switch (param.type) {
      case 'number': {
        const numParam = param as NumberParameter;
        const inputId = `perf-${numParam.id}`;
        return (
          <div key={param.id} {...commonProps}>
            {label}
            <Input
              type="number"
              id={inputId}
              aria-labelledby={labelId}
              value={config[numParam.id] as number}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleValueChange(numParam.id, e.target.value)}
              min={numParam.min}
              max={numParam.max}
              step={numParam.step}
              className="w-full"
            />
            {numParam.description && (
              <p 
                id={`${inputId}-desc`} 
                className="text-sm text-muted-foreground mt-1"
                aria-hidden="true"
              >
                {numParam.description}
              </p>
            )}
          </div>
        );
      }
      case 'button-group': {
        const btnParam = param as ButtonGroupParameter;
        const groupId = `perf-${btnParam.id}`;
        let isDisabled = false;

        // Disable pattern selection if holeType is 'slot'
        if (param.id === 'pattern' && config['holeType'] === 'slot') {
          isDisabled = true;
        }

        return (
          <div key={param.id} {...commonProps}>
            {label}
            <ToggleGroup
              type="single"
              id={groupId}
              aria-labelledby={labelId}
              value={config[btnParam.id] as string}
              onValueChange={(value: string) => {
                if (value) {
                  handleValueChange(btnParam.id, value);
                }
              }}
              className="justify-start"
              disabled={isDisabled}
            >
              {btnParam.options.map(option => (
                <ToggleGroupItem 
                  key={option.value} 
                  value={option.value}
                  id={`${groupId}-${option.value}`}
                  aria-label={option.label}
                  title={option.label}
                >
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {btnParam.description && (
              <p 
                id={`${groupId}-desc`} 
                className="text-sm text-muted-foreground mt-1"
                aria-hidden="true"
              >
                {btnParam.description}
              </p>
            )}
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
            options = materials.map((mat: Material) => ({ value: mat.id, label: mat.name }));
          } else {
            placeholder = 'No materials available';
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
              <div className="relative w-full">
                <select
                  disabled
                  className="w-full h-9 px-3 py-2 rounded-md border bg-transparent text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option>{placeholder}</option>
                </select>
              </div>
              {selParam.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selParam.description}
                </p>
              )}
              {errorMsg && (
                <p className="text-sm text-red-500 mt-1" role="alert">
                  {errorMsg}
                </p>
              )}
            </div>
          );
        }

        // Render standard select with options
        return (
          <div key={param.id} {...commonProps}>
            {label}
            <div className="relative w-full">
              <select
                value={config[selParam.id] as string}
                onChange={(e) => handleValueChange(selParam.id, e.target.value)}
                className="w-full h-9 px-3 py-2 rounded-md border bg-transparent text-sm"
              >
                <option value="" disabled>{placeholder}</option>
                {options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {selParam.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {selParam.description}
              </p>
            )}
          </div>
        );
      }
      case 'adjuster': {
        const adjParam = param as AdjusterParameter;
        const value = config[adjParam.id] as number;
        const step = adjParam.step || 1;
        const min = adjParam.min !== undefined ? adjParam.min : -Infinity;
        const max = adjParam.max !== undefined ? adjParam.max : Infinity;
        const adjusterId = `perf-${adjParam.id}`;

        return (
          <div key={param.id} {...commonProps}>
            {label}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleValueChange(adjParam.id, Math.max(min, value - step))}
                disabled={value <= min}
                title={`Decrease ${adjParam.label}`}
                aria-label={`Decrease ${adjParam.label}`}
                id={`${adjusterId}-decrease`}
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </Button>
              <div 
                className="w-12 text-center"
                id={`${adjusterId}-value`}
                aria-label={`${adjParam.label} value`}
                role="status"
              >
                {value}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleValueChange(adjParam.id, Math.min(max, value + step))}
                disabled={value >= max}
                title={`Increase ${adjParam.label}`}
                aria-label={`Increase ${adjParam.label}`}
                id={`${adjusterId}-increase`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            {adjParam.description && (
              <p 
                id={`${adjusterId}-desc`} 
                className="text-sm text-muted-foreground mt-1"
                aria-hidden="true"
              >
                {adjParam.description}
              </p>
            )}
          </div>
        );
      }
      default:
        const unknownParam = param as { id: string; type: string };
        return (
          <div key={unknownParam.id}>
            Unsupported parameter type: {unknownParam.type}
          </div>
        );
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