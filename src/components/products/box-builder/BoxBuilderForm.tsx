'use client';

import React, { useState, useCallback } from 'react';
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
  materials: Material[];
}

// Helper function to initialize form state from product defaults
function initializeState(parameters: ProductParameter[]): ProductConfiguration {
    const initialState: ProductConfiguration = {};
    parameters.forEach(param => {
        initialState[param.id] = param.defaultValue;
    });
    return initialState;
}

export function BoxBuilderForm({ product, materials }: BoxBuilderFormProps) {
  const [config, setConfig] = useState<ProductConfiguration>(() => initializeState(product.parameters));

  const handleValueChange = useCallback((id: string, value: string | number) => {
    // Ensure numeric inputs store numbers, not strings
    const param = product.parameters.find(p => p.id === id);
    const processedValue = param?.type === 'number' ? Number(value) : value;

    setConfig(prevConfig => ({
      ...prevConfig,
      [id]: processedValue,
    }));
    // TODO: Trigger price calculation or preview update here?
    console.log('Updated config:', { ...config, [id]: processedValue });
  }, [product.parameters, config]); // Add config to dependency array if needed elsewhere


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

        if (selParam.optionsSource === 'materials') {
          options = materials.map(mat => ({ value: mat.id, label: `${mat.name} (${mat.thickness_mm}mm)` }));
        } else if (selParam.options) {
           options = selParam.options;
        }

        return (
          <div key={param.id} {...commonProps}>
            {label}
            <Select
              value={config[selParam.id] as string}
              onValueChange={(value) => handleValueChange(selParam.id, value)}
            >
              <SelectTrigger className="w-full"> {/* Use full width within grid cell */}
                <SelectValue placeholder={`Select ${selParam.label}...`} />
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
       {/* Wrap parameters in a responsive grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
         {product.parameters.map(renderParameter)}
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

