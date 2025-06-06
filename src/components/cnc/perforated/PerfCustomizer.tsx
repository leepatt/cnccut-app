'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PerfBuilderForm } from './PerfBuilderForm';
import PerfVisualizer from './PerfVisualizer';
import { QuoteActions } from '@/components/cnc/VisualizerArea';
import { Button } from '@/components/ui/button';
import { ProductDefinition, ProductConfiguration } from '@/types';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import {
    MATERIAL_RATES,
    MANUFACTURE_RATE,
    MANUFACTURE_AREA_RATE,
    GST_RATE
} from '@/lib/cncConstants';

interface PerfCustomizerProps {
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

const PerfCustomizer: React.FC<PerfCustomizerProps> = ({ onBack }) => {
  // State specific to Perforated Panels
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
        // This would be your actual API endpoint for perforated panels data
        const productRes = await fetch(`/api/products/perforated-panels`);
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
      }
      catch (err: unknown) {
        console.error("Failed to load Perforated Panels product data:", err);
        
        // Since API might not exist yet, create placeholder data
        const placeholderProduct: ProductDefinition = {
          id: 'perforated-panels',
          name: 'Perforated Panels',
          description: 'Design panels with custom hole patterns',
          parameters: [
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
              id: 'holeSize',
              label: 'Hole Size (mm)',
              type: 'number',
              defaultValue: 20,
              min: 5,
              max: 100,
              step: 1
            },
            {
              id: 'holeType',
              label: 'Opening Type',
              type: 'button-group',
              options: [
                { value: 'circle', label: 'Circle' },
                { value: 'slot', label: 'Slot' }
              ],
              defaultValue: 'circle'
            },
            {
              id: 'slotLength',
              label: 'Slot Length (mm)',
              type: 'number',
              defaultValue: 40,
              min: 20,
              max: 100,
              step: 1,
              description: 'Length of slot openings'
            },
            {
              id: 'slotRotation',
              label: 'Slot Rotation',
              type: 'button-group',
              options: [
                { value: 'horizontal', label: 'Horizontal' },
                { value: 'vertical', label: 'Vertical' }
              ],
              defaultValue: 'horizontal',
              description: 'Orientation of slots'
            },
            {
              id: 'spacing',
              label: 'Hole Spacing (mm)',
              type: 'number',
              defaultValue: 25,
              min: 5,
              max: 100,
              step: 1
            },
            {
              id: 'pattern',
              label: 'Hole Pattern',
              type: 'button-group',
              options: [
                { value: 'grid', label: 'Grid' },
                { value: 'diagonal', label: 'Diagonal' },
                { value: 'radial', label: 'Radial' }
              ],
              defaultValue: 'grid'
            },
            {
              id: 'material',
              label: 'Material',
              type: 'select',
              optionsSource: 'materials',
              defaultValue: '17'
            },
            {
              id: 'additionalRows',
              label: 'Additional Rows',
              type: 'adjuster',
              defaultValue: 0,
              min: -5,
              max: 5,
              step: 1,
              description: 'Add or remove rows of holes'
            },
            {
              id: 'additionalColumns',
              label: 'Additional Columns',
              type: 'adjuster',
              defaultValue: 0,
              min: -5,
              max: 5,
              step: 1,
              description: 'Add or remove columns of holes'
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

  // Effect to calculate price and turnaround time
  useEffect(() => {
    if (!currentConfig || !product) return;

    const calculatePriceDetails = () => {
      // Get dimensions and material
      const width = currentConfig.width as number;
      const height = currentConfig.height as number;
      const materialId = currentConfig.material as string;
      const holeType = currentConfig.holeType as string;
      const holeSize = currentConfig.holeSize as number;
      const slotLength = 40; // Fixed slot length

      // Calculate area in square meters
      const area = (width * height) / 1000000; // Convert from mm² to m²

      // Get material cost rate
      const materialRate = MATERIAL_RATES[materialId] || 50; // Default rate if not found
      const materialCost = area * (typeof materialRate === 'number' ? materialRate : 50);

      // Calculate manufacturing complexity factor based on hole type and pattern
      let complexityFactor = 1.0;
      
      if (holeType === 'slot') {
        // Slots are more complex to cut than circles
        complexityFactor *= 1.25;
      }

      // Calculate manufacturing cost based on area and complexity
      const manufactureCost = area * MANUFACTURE_AREA_RATE * complexityFactor;

      // Calculate sheets needed (simplified)
      const sheets = Math.ceil(area / (2.4 * 1.2)); // Assuming standard sheet size of 2.4m x 1.2m

      // Calculate totals
      const subTotal = materialCost + manufactureCost;
      const gstAmount = subTotal * GST_RATE;
      const totalIncGST = subTotal + gstAmount;

      // Update price details state
      setPriceDetails({
        materialCost,
        manufactureCost,
        subTotal,
        gstAmount,
        totalIncGST,
        sheets
      });

      // Estimate turnaround time (in days)
      const baseTurnaround = 3;
      const turnaroundMultiplier = complexityFactor;
      setTurnaround(Math.ceil(baseTurnaround * turnaroundMultiplier));
    };

    calculatePriceDetails();
  }, [currentConfig, product]);

  // Callbacks
  const handleConfigChange = useCallback((newConfig: ProductConfiguration) => {
    setCurrentConfig(newConfig);
  }, []);

  const handleAddToCart = () => {
    console.log('Adding Perforated Panel to cart:', { config: currentConfig, price: priceDetails });
    // Add actual add to cart logic here
  }

  const handleSaveConfig = () => {
    console.log('Saving Perforated Panel configuration:', { config: currentConfig });
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
  const width = (currentConfig['width'] as number) ?? 600;
  const height = (currentConfig['height'] as number) ?? 400;
  const holeSize = (currentConfig['holeSize'] as number) ?? 20;
  const spacing = (currentConfig['spacing'] as number) ?? 25;
  const pattern = (currentConfig['pattern'] as 'grid' | 'diagonal' | 'radial') ?? 'grid';
  const additionalRows = (currentConfig['additionalRows'] as number) ?? 0;
  const additionalColumns = (currentConfig['additionalColumns'] as number) ?? 0;
  const holeType = (currentConfig['holeType'] as 'circle' | 'slot') ?? 'circle';
  const slotLength = (currentConfig['slotLength'] as number) ?? 40; // Get from config or default to 40
  const slotRotation = (currentConfig['slotRotation'] as 'horizontal' | 'vertical') ?? 'horizontal';

  // Handle slot length change
  const handleSlotLengthChange = useCallback((newLength: number) => {
    setCurrentConfig(prev => ({
      ...prev,
      slotLength: newLength
    }));
  }, []);

  // Debug log
  console.log('Visualization props:', {
    width,
    height,
    pattern,
    holeSize,
    spacing,
    additionalRows,
    additionalColumns,
    holeType,
    slotLength,
    slotRotation
  });
  
  // Loading and error states
  if (isLoading) {
    return <div className="p-8 text-center">Loading Perforated Panels configuration...</div>;
  }

  if (error && !product) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  if (!product) {
    return <div className="p-8 text-center">No product configuration available</div>;
  }

  return (
    <div className="flex h-[calc(100vh-theme(space.28))] flex-col text-foreground">
      <title>Perforated Panels Configurator</title>
      {/* Back Button / Header */}
      <div className="mb-1 mt-[-1rem] flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="mr-2 h-10 w-10 text-foreground hover:bg-muted hover:text-foreground"
          title="Back to Dashboard"
          aria-label="Go back to Dashboard"
        >
          <ArrowLeft className="h-6 w-6" />
          <span className="sr-only">Back to Dashboard</span>
        </Button>
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-xl font-semibold">Perforated Panels</h1>
        </div>
      </div>

      {/* Main Two-Column Layout - Reverse order on medium screens and up */}
      <div className="flex flex-grow gap-6 md:flex-row-reverse flex-col overflow-hidden">
        {/* Right Column (becomes left on md+): Configuration + Actions */}
        {/* Increase width */}
        <aside className="w-full md:w-[30rem] lg:w-[34rem] flex-shrink-0 flex flex-col space-y-6 overflow-y-auto">
          {/* Configuration Form Area */}
          <div className="flex-shrink-0 rounded-md border border-border bg-card p-4">
            <PerfBuilderForm
              product={product!}
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

        {/* Left Column (becomes right on md+): Visualization */}
        {/* Right Column: Visualization */}
        <main className="flex-grow min-h-[300px] md:min-h-0 rounded-lg border border-border bg-muted/40 flex items-center justify-center relative">
          <PerfVisualizer
            width={width}
            height={height}
            pattern={pattern}
            holeSize={holeSize}
            spacing={spacing}
            additionalRows={additionalRows}
            additionalColumns={additionalColumns}
            holeType={holeType}
            slotLength={slotLength}
            slotRotation={slotRotation}
            onSlotLengthChange={handleSlotLengthChange}
          />
        </main>
      </div>
    </div>
  );
};

export default PerfCustomizer; 