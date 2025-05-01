'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShapeBuilderForm } from './ShapeBuilderForm';
import ShapeVisualizer from './ShapeVisualizer';
import { QuoteActions } from '@/components/cnc/VisualizerArea';
import { Button } from '@/components/ui/button';
import { ProductDefinition, ProductConfiguration } from '@/types';
import { ArrowLeft, Shapes } from 'lucide-react';
import {
    MATERIAL_RATES,
    MANUFACTURE_RATE,
    MANUFACTURE_AREA_RATE,
    GST_RATE
} from '@/lib/cncConstants';

interface ShapeCustomizerProps {
  onBack: () => void;
}

// Interface for calculated price details
interface PriceDetails {
    materialCost: number;
    manufactureCost: number;
    subTotal: number;
    gstAmount: number;
    totalIncGST: number;
    sheets: number;
}

const ShapeCustomizer: React.FC<ShapeCustomizerProps> = ({ onBack }) => {
  // State specific to Shape Builder
  const [product, setProduct] = useState<ProductDefinition | null>(null);
  const [currentConfig, setCurrentConfig] = useState<ProductConfiguration>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // State for calculated quote
  const [priceDetails, setPriceDetails] = useState<PriceDetails | null>(null);
  const [turnaround, setTurnaround] = useState<number | null>(null);

  // Data Fetching
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      setProduct(null);
      setCurrentConfig({});
      setPriceDetails(null);
      setTurnaround(null);
      try {
        // This would be your actual API endpoint for shapes data
        const productRes = await fetch(`/api/products/shapes`);
        if (!productRes.ok) {
          throw new Error(`Failed to fetch product: ${productRes.statusText}`);
        }
        const productData: ProductDefinition = await productRes.json();
        setProduct(productData);

        // Set initial config based on defaults
        const initialConfig: ProductConfiguration = {};
        productData.parameters.forEach(param => {
            initialConfig[param.id] = param.defaultValue;
        });
        setCurrentConfig(initialConfig);

      } catch (err: unknown) {
        console.error("Failed to load Shape Builder product data:", err);
        
        // Since API might not exist yet, create placeholder data
        const placeholderProduct: ProductDefinition = {
          id: 'shapes',
          name: 'Shape Builder',
          description: 'Create parts from standard geometric shapes',
          parameters: [
            {
              id: 'shapeType',
              label: 'Shape Type',
              type: 'button-group',
              options: [
                { value: 'rectangle', label: 'Rectangle' },
                { value: 'circle', label: 'Circle' },
                { value: 'triangle', label: 'Triangle' },
                { value: 'hexagon', label: 'Hexagon' }
              ],
              defaultValue: 'rectangle'
            },
            {
              id: 'width',
              label: 'Width (mm)',
              type: 'number',
              defaultValue: 600,
              min: 100,
              max: 2400,
              step: 10
            },
            {
              id: 'height',
              label: 'Height (mm)',
              type: 'number',
              defaultValue: 400,
              min: 100,
              max: 1200,
              step: 10
            },
            {
              id: 'diameter',
              label: 'Diameter (mm)',
              type: 'number',
              defaultValue: 500,
              min: 100,
              max: 1200,
              step: 10
            },
            {
              id: 'material',
              label: 'Material',
              type: 'select',
              optionsSource: 'materials',
              defaultValue: '17'
            }
          ]
        };
        
        setProduct(placeholderProduct);
        
        // Initialize with placeholder defaults
        const initialConfig: ProductConfiguration = {};
        placeholderProduct.parameters.forEach(param => {
          initialConfig[param.id] = param.defaultValue;
        });
        setCurrentConfig(initialConfig);
        
        const errorMessage = (err instanceof Error) ? err.message : 'Failed to load configuration data. Using defaults.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculation Logic
  useEffect(() => {
    if (!product || Object.keys(currentConfig).length === 0) {
        setPriceDetails(null);
        setTurnaround(null);
        return;
    }

    try {
        // Extract dimensions and config
        const shapeType = (currentConfig['shapeType'] as string) ?? 'rectangle';
        const width = (currentConfig['width'] as number) ?? 0;
        const height = (currentConfig['height'] as number) ?? 0;
        const diameter = (currentConfig['diameter'] as number) ?? 0;
        const materialId = (currentConfig['material'] as string) ?? '0';

        if (!materialId || !MATERIAL_RATES[materialId]) {
            setPriceDetails(null);
            setTurnaround(null);
            return; // Invalid config for pricing
        }

        // Calculate area based on shape type
        let area_mm2 = 0;
        let complexity = 1.0;
        
        if (shapeType === 'rectangle' && width > 0 && height > 0) {
            area_mm2 = width * height;
            complexity = 1.0; // Simple shape
        } 
        else if (shapeType === 'circle' && diameter > 0) {
            const radius = diameter / 2;
            area_mm2 = Math.PI * radius * radius;
            complexity = 1.2; // Slightly more complex
        }
        else if (shapeType === 'triangle' && width > 0 && height > 0) {
            area_mm2 = 0.5 * width * height;
            complexity = 1.1; // Medium complexity
        }
        else if (shapeType === 'hexagon' && diameter > 0) {
            // Area of a regular hexagon: (3√3/2) * (diameter/2)^2
            area_mm2 = (3 * Math.sqrt(3) / 2) * Math.pow(diameter / 2, 2);
            complexity = 1.3; // More complex shape
        }
        else {
            // Invalid dimensions
            setPriceDetails(null);
            setTurnaround(null);
            return;
        }
        
        // Convert mm² to m²
        const area_m2 = area_mm2 / 1_000_000;

        // Calculate material and manufacturing costs
        const materialInfo = MATERIAL_RATES[materialId];
        const materialCost = area_m2 * materialInfo.price;
        
        // Base manufacturing cost plus complexity and size factors
        const baseCost = MANUFACTURE_RATE;
        const sizeFactorCost = area_m2 * MANUFACTURE_AREA_RATE;
        const complexityCost = complexity * sizeFactorCost;
        const manufactureCost = baseCost + complexityCost;
        
        const subTotal = materialCost + manufactureCost;
        const gstAmount = subTotal * GST_RATE;
        const totalIncGST = subTotal + gstAmount;

        setPriceDetails({
            materialCost,
            manufactureCost,
            subTotal,
            gstAmount,
            totalIncGST,
            sheets: 1, // Assuming a default sheets value
        });
        
        // Calculate turnaround based on complexity and size
        const baseTurnaround = 1; // Base days for simple shapes
        const complexityTurnaround = Math.ceil(complexity);
        const sizeFactor = area_m2 > 1 ? 1 : 0; // Additional day for large shapes
        setTurnaround(baseTurnaround + Math.floor(complexityTurnaround / 2) + sizeFactor);

    } catch (calcError) {
        console.error("Error during price calculation:", calcError);
        setPriceDetails(null);
        setTurnaround(null);
    }
  }, [currentConfig, product]);

  // Callbacks
  const handleConfigChange = useCallback((newConfig: ProductConfiguration) => {
    setCurrentConfig(newConfig);
  }, []);

  const handleAddToCart = () => {
    console.log('Adding Shape to cart:', { config: currentConfig, price: priceDetails });
    // Add actual add to cart logic here
  }

  const handleSaveConfig = () => {
    console.log('Saving Shape configuration:', { config: currentConfig });
    // Add actual save logic here
  }

  const handleReset = useCallback(() => {
    if (product) {
      const initialConfig: ProductConfiguration = {};
      product.parameters.forEach(param => {
        initialConfig[param.id] = param.defaultValue;
      });
      setCurrentConfig(initialConfig);
    }
  }, [product]);

  // Extract visualization props
  const shapeType = (currentConfig['shapeType'] as 'rectangle' | 'circle' | 'triangle' | 'hexagon') ?? 'rectangle';
  const width = (currentConfig['width'] as number) ?? 600;
  const height = (currentConfig['height'] as number) ?? 400;
  const diameter = (currentConfig['diameter'] as number) ?? 500;
  
  // Loading and error states
  if (isLoading) {
    return <div className="p-8 text-center">Loading Shape Builder configuration...</div>;
  }

  if (error && !product) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  if (!product) {
    return <div className="p-8 text-center">No product configuration available</div>;
  }

  return (
    <div className="flex h-[calc(100vh-theme(space.28))] flex-col text-foreground">
      {/* Back Button / Header */}
      <div className="mb-1 mt-[-1rem] flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="mr-2 h-10 w-10 text-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-6 w-6" />
          <span className="sr-only">Back to Dashboard</span>
        </Button>
        <div className="flex items-center gap-2">
          <Shapes className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Shape Builder</h1>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex flex-grow gap-6 md:flex-row flex-col">
        {/* Left Column: Configuration + Actions */}
        <aside className="w-full md:w-96 lg:w-[28rem] flex-shrink-0 flex flex-col space-y-6">
          {/* Configuration Form Area */}
          <div className="flex-shrink-0 rounded-md border border-border bg-card p-4">
            <ShapeBuilderForm
              product={product}
              onConfigChange={handleConfigChange}
            />
          </div>

          {/* Quote & Actions Area */}
          <div className="flex-shrink-0">
            <QuoteActions
              price={priceDetails?.totalIncGST || 0}
              turnaround={turnaround || 0}
              onAddToCart={handleAddToCart}
              onSaveConfig={handleSaveConfig}
              onReset={handleReset}
              isAddToCartDisabled={!priceDetails}
              isSaveDisabled={!priceDetails}
              quantity={1}
              onQuantityChange={() => {}}
              sheets={priceDetails?.sheets || 0}
              materialCost={priceDetails?.materialCost || 0}
              manufactureCost={priceDetails?.manufactureCost || 0}
            />
          </div>
        </aside>

        {/* Right Column: Visualization */}
        <main className="flex-grow min-h-[300px] md:min-h-0 rounded-lg border border-border bg-muted/40 flex items-center justify-center relative">
          <ShapeVisualizer
            shapeType={shapeType}
            width={width}
            height={height}
            diameter={diameter}
          />
        </main>
      </div>
    </div>
  );
};

export default ShapeCustomizer; 