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

      } catch (err: unknown) {
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
        const width = (currentConfig['width'] as number) ?? 0;
        const height = (currentConfig['height'] as number) ?? 0;
        const holeSize = (currentConfig['holeSize'] as number) ?? 0;
        const spacing = (currentConfig['spacing'] as number) ?? 0;
        const pattern = (currentConfig['pattern'] as string) ?? 'grid';
        const materialId = (currentConfig['material'] as string) ?? '0';

        if (width <= 0 || height <= 0 || !materialId || !MATERIAL_RATES[materialId]) {
            setPriceDetails(null);
            setTurnaround(null);
            return; // Invalid config for pricing
        }

        // Calculate panel area
        const panelArea = (width * height) / 1000000; // Convert mm² to m²
        
        // Calculate hole count based on pattern
        let holeCount = 0;
        
        // Complexity factor for different patterns
        let complexityFactor = 1.0;
        
        if (pattern === 'grid') {
            // Simple grid pattern
            const rows = Math.floor((height - 2 * spacing) / (holeSize + spacing));
            const cols = Math.floor((width - 2 * spacing) / (holeSize + spacing));
            holeCount = rows * cols;
            complexityFactor = 1.0;
        } else if (pattern === 'diagonal') {
            // Diagonal pattern (slightly more complex)
            const rows = Math.floor((height - 2 * spacing) / (holeSize + spacing));
            const cols = Math.floor((width - 2 * spacing) / (holeSize + spacing));
            holeCount = Math.ceil(rows * cols * 0.85); // Estimate: slightly fewer holes than grid
            complexityFactor = 1.2;
        } else if (pattern === 'radial') {
            // Radial pattern (most complex)
            const minDimension = Math.min(width, height);
            const maxRadius = minDimension / 2 - spacing;
            let totalHoles = 1; // Center hole
            
            for (let r = spacing + holeSize; r <= maxRadius; r += spacing + holeSize) {
                const circumference = 2 * Math.PI * r;
                const holes = Math.floor(circumference / (holeSize + spacing));
                totalHoles += holes;
            }
            
            holeCount = totalHoles;
            complexityFactor = 1.5;
        }
        
        // Calculate material and manufacturing costs
        const materialInfo = MATERIAL_RATES[materialId];
        const materialCost = panelArea * materialInfo.price;
        
        // Base manufacturing cost plus complexity and hole count factors
        const holeFactor = 0.02 * holeCount; // Cost increases with number of holes
        const manufactureCost = MANUFACTURE_RATE + panelArea * MANUFACTURE_AREA_RATE * complexityFactor + holeFactor;
        
        const subTotal = materialCost + manufactureCost;
        const gstAmount = subTotal * GST_RATE;
        const totalIncGST = subTotal + gstAmount;

        setPriceDetails({
            materialCost,
            manufactureCost,
            subTotal,
            gstAmount,
            totalIncGST,
            sheets: 1, // Assuming a single sheet for simplicity
        });
        
        // Calculate turnaround based on complexity and size
        const baseTurnaround = 2; // Base days
        const sizeFactorTurnaround = panelArea > 1 ? 1 : 0; // Additional day for large panels
        setTurnaround(Math.ceil(baseTurnaround * complexityFactor) + sizeFactorTurnaround);

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
          <LayoutGrid className="h-5 w-5 text-primary" />
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
          />
        </main>
      </div>
    </div>
  );
};

export default PerfCustomizer; 