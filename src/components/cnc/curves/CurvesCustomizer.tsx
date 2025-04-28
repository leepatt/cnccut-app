'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CurvesBuilderForm } from './CurvesBuilderForm';
import CurvesVisualizer from './CurvesVisualizer';
import { QuoteActions } from '@/components/cnc/VisualizerArea';
import { Button } from '@/components/ui/button';
import { ProductDefinition, ProductConfiguration, Material } from '@/types';
import { ArrowLeft, CircleDashed } from 'lucide-react';
import {
    MATERIAL_RATES,
    MANUFACTURE_RATE,
    MANUFACTURE_AREA_RATE,
    GST_RATE
} from '@/lib/cncConstants';

interface CurvesCustomizerProps {
  onBack: () => void;
}

// Interface for calculated price details
interface PriceDetails {
    materialCost: number;
    manufactureCost: number;
    subTotal: number;
    gstAmount: number;
    totalIncGST: number;
}

// Interface for derived measurements
interface DerivedMeasurements {
  arcLength: number;
  chordLength: number;
}

const CurvesCustomizer: React.FC<CurvesCustomizerProps> = ({ onBack }) => {
  // State specific to Curves Builder
  const [product, setProduct] = useState<ProductDefinition | null>(null);
  const [currentConfig, setCurrentConfig] = useState<ProductConfiguration>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // State for calculated quote
  const [priceDetails, setPriceDetails] = useState<PriceDetails | null>(null);
  const [turnaround, setTurnaround] = useState<number | null>(null);
  // State for materials data (needed for thickness lookup)
  const [materials, setMaterials] = useState<Material[] | null>(null);
  // State for derived measurements
  const [derivedMeasurements, setDerivedMeasurements] = useState<DerivedMeasurements>({
    arcLength: 0,
    chordLength: 0
  });

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
        // This would be your actual API endpoint for curves data
        const productRes = await fetch(`/api/products/curves`);
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
        console.error("Failed to load Curves product data:", err);
        
        // Since API might not exist yet, create placeholder data
        const placeholderProduct: ProductDefinition = {
          id: 'curves',
          name: 'Radius and Curves',
          description: 'Custom curved timber elements',
          parameters: [
            {
              id: 'radius',
              label: 'Int. Radius (r) (mm)',
              type: 'number',
              defaultValue: 1200,
              min: 50,
              max: 2000,
              step: 10,
              description: 'Internal radius of the curved element'
            },
            {
              id: 'width',
              label: 'Width (w) (mm)',
              type: 'number',
              defaultValue: 100,
              min: 20,
              max: 500,
              step: 5,
              description: 'Thickness of the curved segment (radial width)'
            },
            {
              id: 'angle',
              label: 'Angle (θ) (degrees)',
              type: 'number',
              defaultValue: 90,
              min: 5,
              max: 270,
              step: 5,
              description: 'Angle of the curved segment'
            },
            {
              id: 'material',
              label: 'Material',
              type: 'select',
              optionsSource: 'materials',
              defaultValue: '17',
              description: 'Material determines thickness of the part'
            }
          ],
          derivedParameters: [
            {
              id: 'arcLength',
              label: 'Arc Length (L) (mm)',
              description: 'Length along the outer curved edge',
              formula: '(radius + width) * (angle * Math.PI / 180)'
            },
            {
              id: 'chordLength',
              label: 'Chord Length (c) (mm)',
              description: 'Straight-line distance between ends',
              formula: '2 * (radius + width) * Math.sin(angle * Math.PI / 360)'
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

  // Effect to fetch materials 
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch('/api/materials');
        if (!response.ok) {
          throw new Error(`Failed to fetch materials: ${response.statusText}`);
        }
        const data: Material[] = await response.json();
        setMaterials(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error fetching materials';
        console.error("[CurvesCustomizer] Error fetching materials:", message);
        setMaterials(null);
      }
    };

    if (!error) {
        fetchMaterials();
    }
  }, [error]);

  // Calculate derived measurements
  useEffect(() => {
    if (!product || Object.keys(currentConfig).length === 0) {
      return;
    }

    // Extract dimensions
    const radius = (currentConfig['radius'] as number) ?? 0;
    const width = (currentConfig['width'] as number) ?? 0;
    const angle = (currentConfig['angle'] as number) ?? 0;

    if (radius <= 0 || width <= 0 || angle <= 0) {
      return;
    }

    // Calculate outer radius
    const outerRadius = radius + width;
    
    // Calculate arc length: outerRadius * angle in radians (outer arc)
    const arcLength = outerRadius * (angle * Math.PI / 180);
    
    // Calculate chord length: 2 * outerRadius * sin(angle/2)
    const chordLength = 2 * outerRadius * Math.sin(angle * Math.PI / 360);

    setDerivedMeasurements({
      arcLength,
      chordLength
    });
  }, [currentConfig, product]);

  // Calculation Logic for pricing
  useEffect(() => {
    if (!product || Object.keys(currentConfig).length === 0) {
        setPriceDetails(null);
        setTurnaround(null);
        return;
    }

    try {
        // Extract dimensions and config
        const radius = (currentConfig['radius'] as number) ?? 0;
        const width = (currentConfig['width'] as number) ?? 0;
        const angle = (currentConfig['angle'] as number) ?? 0;
        const materialId = (currentConfig['material'] as string) ?? '0';

        if (radius <= 0 || width <= 0 || angle <= 0 || !materialId || !MATERIAL_RATES[materialId]) {
            setPriceDetails(null);
            setTurnaround(null);
            return; // Invalid config for pricing
        }

        // Get material info to determine thickness
        const materialInfo = MATERIAL_RATES[materialId];
        
        // Calculate area of the curved segment
        // Area = angle/360 * π * (outer radius² - inner radius²)
        const outerRadius = radius + width;
        const segmentArea = (angle / 360) * Math.PI * (Math.pow(outerRadius, 2) - Math.pow(radius, 2));
        
        // Convert mm² to m²
        const materialArea = segmentArea / 1000000;

        // Calculate Costs
        const materialCost = materialArea * materialInfo.price;
        const manufactureCost = MANUFACTURE_RATE + materialArea * MANUFACTURE_AREA_RATE;
        const subTotal = materialCost + manufactureCost;
        const gstAmount = subTotal * GST_RATE;
        const totalIncGST = subTotal + gstAmount;

        setPriceDetails({
            materialCost,
            manufactureCost,
            subTotal,
            gstAmount,
            totalIncGST,
        });
        
        // Calculate turnaround based on size and complexity
        const complexity = angle > 180 ? 1.5 : 1;
        const baseTurnaround = 2; // Base days
        setTurnaround(Math.ceil(baseTurnaround * complexity));

    } catch (calcError) {
        console.error("Error during price calculation:", calcError);
        setPriceDetails(null);
        setTurnaround(null);
    }
  }, [currentConfig, product, derivedMeasurements]);

  // Callbacks
  const handleConfigChange = useCallback((newConfig: ProductConfiguration) => {
    setCurrentConfig(newConfig);
  }, []);

  const handleAddToCart = () => {
    console.log('Adding Curve to cart:', { config: currentConfig, price: priceDetails });
    // Add actual add to cart logic here
  }

  const handleSaveConfig = () => {
    console.log('Saving Curve configuration:', { config: currentConfig });
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
  const radius = (currentConfig['radius'] as number) ?? 1200;
  const curvesWidth = (currentConfig['width'] as number) ?? 100;
  const angle = (currentConfig['angle'] as number) ?? 90;
  // Get material thickness from materialId if we have materials loaded
  const materialId = currentConfig['material'] as string;
  let materialThickness = 18; // Default if we can't get it

  // Try to get thickness from material
  if (materials && materialId) {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      materialThickness = material.thickness_mm;
    }
  }

  // Loading and error states
  if (isLoading) {
    return <div className="p-8 text-center">Loading Curves configuration...</div>;
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
          <CircleDashed className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Radius and Curves</h1>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex flex-grow gap-6 md:flex-row flex-col overflow-hidden">
        {/* Left Column: Configuration + Actions */}
        <aside className="w-full md:w-96 lg:w-[28rem] flex-shrink-0 flex flex-col space-y-6 overflow-y-auto">
          {/* Configuration Form Area */}
          <div className="flex-shrink-0 rounded-md border border-border bg-card p-4">
            <CurvesBuilderForm
              product={product}
              onConfigChange={handleConfigChange}
              derivedMeasurements={derivedMeasurements}
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
            />
          </div>
        </aside>

        {/* Right Column: Visualization */}
        <main className="flex-grow relative rounded-lg border border-border bg-muted/40 flex items-center justify-center min-h-[350px] md:min-h-0">
          <CurvesVisualizer
            radius={radius}
            width={curvesWidth}
            angle={angle}
            materialThickness={materialThickness}
            arcLength={derivedMeasurements.arcLength}
            chordLength={derivedMeasurements.chordLength}
            showDimensions={true}
          />
        </main>
      </div>
    </div>
  );
};

export default CurvesCustomizer; 