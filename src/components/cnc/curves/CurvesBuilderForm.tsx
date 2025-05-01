'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface CurvesBuilderFormProps {
  product: ProductDefinition;
  initialConfig: ProductConfiguration;
  onConfigChange: (newConfig: ProductConfiguration) => void;
  splitInfo?: {
    isTooLarge: boolean;
    numSplits: number;
  };
  setSplitLinesHovered: (hovered: boolean) => void;
}

export function CurvesBuilderForm({ 
  product, 
  initialConfig, 
  onConfigChange, 
  splitInfo, 
  setSplitLinesHovered
}: CurvesBuilderFormProps) {
  const [config, setConfig] = useState<ProductConfiguration>(initialConfig);
  const [displayAngle, setDisplayAngle] = useState<string | number>(initialConfig.angle || '');
  const [displayArcLength, setDisplayArcLength] = useState<string | number>('');
  const [displayChordLength, setDisplayChordLength] = useState<string | number>('');
  const [displayRadius, setDisplayRadius] = useState<string | number>(String(initialConfig.radius ?? ''));
  const [displayWidth, setDisplayWidth] = useState<string | number>(String(initialConfig.width ?? ''));
  
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

  // Update internal config when initialConfig changes (e.g., on reset)
  useEffect(() => {
    setConfig(initialConfig);
    // Also update display states on reset
    setDisplayAngle(initialConfig.angle || '');
    setDisplayRadius(String(initialConfig.radius ?? ''));
    setDisplayWidth(String(initialConfig.width ?? ''));
    // Reset calculated fields
    setDisplayArcLength('');
    setDisplayChordLength('');
    // Trigger recalculation only if all necessary values are valid numbers
    const radiusNum = Number(initialConfig.radius);
    const widthNum = Number(initialConfig.width);
    const angleNum = Number(initialConfig.angle);
    if (!isNaN(radiusNum) && radiusNum > 0 && 
        !isNaN(widthNum) && widthNum >= 0 && 
        !isNaN(angleNum) && angleNum > 0) {
        const outerRadius = radiusNum + widthNum;
        const angleRad = angleNum * (Math.PI / 180);
        const calculatedArc = outerRadius * angleRad;
        const calculatedChord = 2 * outerRadius * Math.sin(angleRad / 2);
        setDisplayArcLength(calculatedArc > 0 ? calculatedArc.toFixed(2) : '');
        setDisplayChordLength(calculatedChord > 0 ? calculatedChord.toFixed(2) : '');
    } else {
        // Clear calculated if inputs are invalid on reset
        setDisplayArcLength('');
        setDisplayChordLength('');
    }
  }, [initialConfig]);

  // Update parent config when local config changes
  useEffect(() => {
    onConfigChange(config);
  }, [config, onConfigChange]);

  // Separate handler for interdependent fields
  const handleGeometricInputChange = useCallback((field: 'angle' | 'arcLength' | 'chordLength', value: string) => {
    const numValue = parseFloat(value);
    const radius = config.radius as number;
    const width = config.width as number;

    if (isNaN(radius) || radius <= 0 || isNaN(width) || width < 0) {
      // Need radius and width first
      if (field === 'angle') setDisplayAngle(value);
      if (field === 'arcLength') setDisplayArcLength(value);
      if (field === 'chordLength') setDisplayChordLength(value);
      return;
    }

    let calculatedAngle = config.angle as number;
    let calculatedArc = 0;
    let calculatedChord = 0;
    let isValidInput = !isNaN(numValue) && numValue > 0;

    const outerRadius = radius + width;

    try {
      if (field === 'angle' && isValidInput && numValue <= 360) {
        setDisplayAngle(value);
        const angleRad = numValue * (Math.PI / 180);
        calculatedAngle = numValue;
        calculatedArc = outerRadius * angleRad;
        calculatedChord = 2 * outerRadius * Math.sin(angleRad / 2);
        setDisplayArcLength(calculatedArc > 0 ? calculatedArc.toFixed(2) : '');
        setDisplayChordLength(calculatedChord > 0 ? calculatedChord.toFixed(2) : '');
      } else if (field === 'arcLength' && isValidInput) {
        setDisplayArcLength(value);
        if (outerRadius > 0) {
          const angleRad = numValue / outerRadius;
          calculatedAngle = angleRad * (180 / Math.PI);
          if(calculatedAngle > 0 && calculatedAngle <= 360) {
              calculatedChord = 2 * outerRadius * Math.sin(angleRad / 2);
              setDisplayAngle(calculatedAngle.toFixed(2));
              setDisplayChordLength(calculatedChord > 0 ? calculatedChord.toFixed(2) : '');
          } else {
              isValidInput = false; // Angle out of bounds
          }
        } else isValidInput = false;
      } else if (field === 'chordLength' && isValidInput) {
        setDisplayChordLength(value);
         if (outerRadius > 0 && numValue <= 2 * outerRadius) {
           const angleRad = 2 * Math.asin(numValue / (2 * outerRadius));
           calculatedAngle = angleRad * (180 / Math.PI);
           if(calculatedAngle > 0 && calculatedAngle <= 360) {
               calculatedArc = outerRadius * angleRad;
               setDisplayAngle(calculatedAngle.toFixed(2));
               setDisplayArcLength(calculatedArc > 0 ? calculatedArc.toFixed(2) : '');
           } else {
               isValidInput = false; // Angle out of bounds
           }
         } else isValidInput = false;
      } else {
          // Clear fields if input is invalid or cleared
          setDisplayAngle(field === 'angle' ? value : '');
          setDisplayArcLength(field === 'arcLength' ? value : '');
          setDisplayChordLength(field === 'chordLength' ? value : '');
          isValidInput = false;
      }
      
      // Update canonical angle in main config state if calculation was successful
      if(isValidInput) {
          setConfig(prev => ({ ...prev, angle: Number(calculatedAngle.toFixed(2)) }));
      } else {
          // If input was invalid for arc/chord, try recalculating from angle if available
          if(field !== 'angle' && !isNaN(config.angle as number) && (config.angle as number) > 0) {
              const angleRad = (config.angle as number) * (Math.PI / 180);
              calculatedArc = outerRadius * angleRad;
              calculatedChord = 2 * outerRadius * Math.sin(angleRad / 2);
              setDisplayArcLength(calculatedArc > 0 ? calculatedArc.toFixed(2) : '');
              setDisplayChordLength(calculatedChord > 0 ? calculatedChord.toFixed(2) : '');
          } else { // Otherwise clear other fields
              if (field !== 'angle') setDisplayAngle('');
              if (field !== 'arcLength') setDisplayArcLength('');
              if (field !== 'chordLength') setDisplayChordLength('');
              setConfig(prev => ({ ...prev, angle: '' })); // Clear canonical angle if input invalidates it
          }
      }
      
    } catch (e) {
        console.error("Calculation error:", e);
        // Clear fields on error
        setDisplayAngle('');
        setDisplayArcLength('');
        setDisplayChordLength('');
        setConfig(prev => ({ ...prev, angle: '' }));
    }
  }, [config.radius, config.width, config.angle]);

  // General handler for other fields
  const handleValueChange = useCallback((id: string, value: string | number) => {
    const param = product.parameters.find(p => p.id === id);
    if (!param) return;

    const valueStr = String(value); // Ensure value is treated as string for parsing

    // Handle radius and width separately to update display state first
    if (id === 'radius') {
      setDisplayRadius(valueStr); // Update display value immediately
      const numericValue = parseFloat(valueStr);
      const numParam = param as NumberParameter;

      // Validate the number AFTER updating display
      if (!isNaN(numericValue) && 
          numericValue > 0 && // Ensure positive radius
          (numParam.min === undefined || numericValue >= numParam.min) &&
          // Ignore max check specifically for radius
          /* (numParam.max === undefined || numericValue <= numParam.max) */ true ) {
        // Update the actual config state only if the number is valid
        console.log(`[CurvesBuilderForm] Setting radius config to: ${numericValue}`);
        setConfig(prevConfig => {
          // Prevent update if numeric value hasn't changed
          if (prevConfig[id] === numericValue) return prevConfig;

          const newConfig = { ...prevConfig, [id]: numericValue };
          // Trigger recalculation if angle exists, using potentially updated config
          const currentAngle = Number(prevConfig.angle);
          if (!isNaN(currentAngle) && currentAngle > 0) {
              // Use timeout to ensure state update completes before recalculating
              setTimeout(() => handleGeometricInputChange('angle', String(currentAngle)), 0);
          }
          return newConfig;
        });
      } else if (valueStr === '') {
          // If input is cleared, clear the config value and potentially derived fields
          setConfig(prevConfig => {
             if (prevConfig[id] === '') return prevConfig; // No change needed
             const newConfig = { ...prevConfig, [id]: '' };
             const currentAngle = Number(prevConfig.angle);
             // Clear derived fields if angle exists
             if (!isNaN(currentAngle) && currentAngle > 0) {
                  setTimeout(() => handleGeometricInputChange('angle', String(currentAngle)), 0); // Re-pass angle to potentially clear arc/chord
             }
             return newConfig;
          });
      } // Otherwise, do nothing - display state updated, config state invalid
      return; // Stop processing here for radius
    }

    if (id === 'width') {
        setDisplayWidth(valueStr); // Update display value immediately
        const numericValue = parseFloat(valueStr);
        const numParam = param as NumberParameter;

        // Validate the number AFTER updating display
        if (!isNaN(numericValue) && 
            numericValue >= 0 && // Allow 0 width
            (numParam.min === undefined || numericValue >= numParam.min) &&
            // Ignore max check specifically for width
            /* (numParam.max === undefined || numericValue <= numParam.max) */ true ) {
           // Update the actual config state only if the number is valid
            console.log(`[CurvesBuilderForm] Setting width config to: ${numericValue}`);
            setConfig(prevConfig => {
              // Prevent update if numeric value hasn't changed
              if (prevConfig[id] === numericValue) return prevConfig;
              
              const newConfig = { ...prevConfig, [id]: numericValue };
              // Trigger recalculation if angle exists, using potentially updated config
              const currentAngle = Number(prevConfig.angle);
              if (!isNaN(currentAngle) && currentAngle > 0) {
                  setTimeout(() => handleGeometricInputChange('angle', String(currentAngle)), 0);
              }
              return newConfig;
            });
        } else if (valueStr === '') {
            // If input is cleared, clear the config value and potentially derived fields
            setConfig(prevConfig => {
                if (prevConfig[id] === '') return prevConfig; // No change needed
                const newConfig = { ...prevConfig, [id]: '' };
                const currentAngle = Number(prevConfig.angle);
                 // Clear derived fields if angle exists
                if (!isNaN(currentAngle) && currentAngle > 0) {
                    setTimeout(() => handleGeometricInputChange('angle', String(currentAngle)), 0); // Re-pass angle to potentially clear arc/chord
                }
                return newConfig;
            });
        } // Otherwise, do nothing - display state updated, config state invalid
      return; // Stop processing here for width
    }
    
    // Handle other parameter types (select, button-group, other numbers)
    setConfig(prevConfig => {
      let updatedValue: string | number | undefined;
      
      if (param.type === 'number') { // Should only be angle if logic above is correct
        const numericValue = parseFloat(valueStr);
        const numParam = param as NumberParameter;
        if (!isNaN(numericValue) && 
            (numParam.min === undefined || numericValue >= numParam.min) &&
            (numParam.max === undefined || numericValue <= numParam.max)) {
           updatedValue = numericValue;
        } else if (valueStr === '') {
            updatedValue = ''; // Allow clearing other number fields
        } else {
            return prevConfig; // Invalid number input for other fields
        }
      } else { // select, button-group
        updatedValue = valueStr; // Use the string value directly
      }

      // Only update if value actually changes
      if (prevConfig[id] !== updatedValue) {
        const newConfig = { ...prevConfig, [id]: updatedValue };
        return newConfig;
      } else {
        return prevConfig;
      }
    });
  }, [product.parameters, handleGeometricInputChange]); // Removed config.angle dependency
  
  // Memoize parameters for stable rendering
  const materialParam = useMemo(() => product.parameters.find(p => p.id === 'material'), [product.parameters]);
  const radiusParam = useMemo(() => product.parameters.find(p => p.id === 'radius'), [product.parameters]);
  const widthParam = useMemo(() => product.parameters.find(p => p.id === 'width'), [product.parameters]);
  // Angle param is handled specially below

  const otherParams = useMemo(() => 
      product.parameters.filter(p => !['material', 'radius', 'width', 'angle'].includes(p.id)), 
      [product.parameters]
  );

  const renderParameter = (param: ProductParameter) => {
    const commonProps = {
      id: param.id,
    };
    const label = <Label htmlFor={param.id} className="block mb-2 font-medium text-foreground">{param.label}</Label>;

    switch (param.type) {
      case 'number': {
        // Make sure this doesn't render angle, radius, or width as they are handled separately
        if (['angle', 'radius', 'width'].includes(param.id)) return null;
        
        const numParam = param as NumberParameter;
        return (
          <div key={param.id} {...commonProps}>
            {label}
            <Input
              type="number"
              id={numParam.id}
              value={String(config[numParam.id] ?? '')}
              onChange={(e) => handleValueChange(numParam.id, e.target.value)}
              min={numParam.min}
              max={numParam.max}
              step={numParam.step}
              className="w-full"
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
              value={String(config[btnParam.id] ?? '')}
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
        // Make sure this doesn't render material as it's handled separately
        if (param.id === 'material') return null;
        
        let options: { value: string, label: string }[] = [];
        let isLoading = false;
        let errorMsg: string | null = null;
        let placeholder = `Select ${param.label}...`;

        // Check if options should be sourced from materials
        if (param.optionsSource === 'materials') {
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
        } else if (param.options) {
          // Use explicitly defined options
          options = param.options;
        } else {
          // No options defined or sourced
          errorMsg = `No options defined for ${param.label}`;
          placeholder = errorMsg;
          console.warn(`Select parameter '${param.id}' has no options defined or sourced.`);
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
              {param.description && <p className="text-sm text-muted-foreground mt-1">{param.description}</p>}
              {errorMsg && <p className="text-sm text-red-500 mt-1">{errorMsg}</p>}
            </div>
          );
        }

        // Render standard select with options
        return (
          <div key={param.id} {...commonProps}>
            {label}
            <Select
              value={String(config[param.id] ?? '')}
              onValueChange={(value) => handleValueChange(param.id, value)}
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
            {param.description && <p className="text-sm text-muted-foreground mt-1">{param.description}</p>}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
        
        {/* Material (Full Width) */} 
        {materialParam && (
            <div className="md:col-span-2">
                {/* Render Material Select directly */} 
                <Label htmlFor={materialParam.id} className="block mb-2 font-medium text-foreground">{materialParam.label}</Label>
                <Select
                  value={String(config[materialParam.id] ?? '')}
                  onValueChange={(value) => handleValueChange(materialParam.id, value)}
                  disabled={materialsLoading || !!materialsError || !materials}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={materialsLoading ? 'Loading...' : materialsError ? 'Error' : 'Select Material...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {materials?.map(mat => (
                      <SelectItem key={mat.id} value={mat.id}>
                        {mat.name} ({mat.thickness_mm}mm)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {materialsError && <p className="text-sm text-red-500 mt-1">{materialsError}</p>}
                {(materialParam as SelectParameter).description && <p className="text-sm text-muted-foreground mt-1">{(materialParam as SelectParameter).description}</p>}
            </div>
        )}

        {/* Radius (Half Width on MD+) */} 
        {radiusParam && (
            <div className="md:col-span-1">
                {/* Render Radius Input directly */} 
                 <Label htmlFor={radiusParam.id} className="block mb-2 font-medium text-foreground">{radiusParam.label}</Label>
                 <Input
                   type="number"
                   id={radiusParam.id}
                   value={String(displayRadius)}
                   onChange={(e) => handleValueChange(radiusParam.id, e.target.value)}
                   min={(radiusParam as NumberParameter).min}
                   {...((radiusParam as NumberParameter).max !== undefined ? { max: (radiusParam as NumberParameter).max } : {})}
                   step={(radiusParam as NumberParameter).step}
                   className="w-full"
                 />
                 {(radiusParam as NumberParameter).description && <p className="text-sm text-muted-foreground mt-1">{(radiusParam as NumberParameter).description}</p>}
            </div>
        )}

        {/* Width (Half Width on MD+) */} 
        {widthParam && (
            <div className="md:col-span-1">
                 {/* Render Width Input directly */} 
                 <Label htmlFor={widthParam.id} className="block mb-2 font-medium text-foreground">{widthParam.label}</Label>
                 <Input
                   type="number"
                   id={widthParam.id}
                   value={String(displayWidth)}
                   onChange={(e) => handleValueChange(widthParam.id, e.target.value)}
                   min={(widthParam as NumberParameter).min}
                   {...((widthParam as NumberParameter).max !== undefined ? { max: (widthParam as NumberParameter).max } : {})}
                   step={(widthParam as NumberParameter).step}
                   className="w-full"
                 />
                 {(widthParam as NumberParameter).description && <p className="text-sm text-muted-foreground mt-1">{(widthParam as NumberParameter).description}</p>}
            </div>
        )}
        
        {/* Angle / Arc Length / Chord Length Section */} 
        <div className="md:col-span-2 border-t pt-4 mt-2">
            <p className="text-sm text-muted-foreground mb-3">
                Define the curve segment using Angle, Arc Length, or Chord Length. Enter one value, and the others will be calculated.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-6">
                {/* Angle Input */}
                <div className="md:col-span-1">
                   <Label htmlFor="angle" className="block mb-2 font-medium text-foreground">Angle (θ)</Label>
                   <Input
                     type="number"
                     id="angle"
                     value={displayAngle}
                     onChange={(e) => handleGeometricInputChange('angle', e.target.value)}
                     min={0.01}
                     max={360}
                     step={0.1}
                     placeholder="degrees"
                     className="w-full"
                   />
                </div>

                {/* Arc Length Input */}
                <div className="md:col-span-1">
                   <Label htmlFor="arcLength" className="block mb-2 font-medium text-foreground">Arc Length (L)</Label>
                   <Input
                     type="number"
                     id="arcLength"
                     value={displayArcLength}
                     onChange={(e) => handleGeometricInputChange('arcLength', e.target.value)}
                     min={0.01}
                     step={0.1}
                     placeholder="mm"
                     className="w-full"
                   />
                </div>

                {/* Chord Length Input */}
                <div className="md:col-span-1">
                   <Label htmlFor="chordLength" className="block mb-2 font-medium text-foreground">Chord Length (c)</Label>
                   <Input
                     type="number"
                     id="chordLength"
                     value={displayChordLength}
                     onChange={(e) => handleGeometricInputChange('chordLength', e.target.value)}
                     min={0.01}
                     step={0.1}
                     placeholder="mm"
                     className="w-full"
                   />
                </div>
            </div>
        </div>

        {/* Render any other parameters */}
        {otherParams.map(param => (
            <div key={param.id} className="md:col-span-2">
                {renderParameter(param)}
            </div>
        ))}
        
        {/* Split Info Alert */} 
        {splitInfo?.isTooLarge && (
            <div 
              className="md:col-span-2 mt-2 cursor-pointer"
              onMouseEnter={() => setSplitLinesHovered(true)}
              onMouseLeave={() => setSplitLinesHovered(false)}
            >
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        This curve is too large for a single sheet. It will be manufactured in {splitInfo.numSplits} sections.
                    </AlertDescription>
                </Alert>
            </div>
        )}
      </div>
    </div>
  );
} 