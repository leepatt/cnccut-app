'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BoxBuilderForm } from './BoxBuilderForm';
import BoxVisualizer from './BoxVisualizer';
// Import QuoteActions
import { QuoteActions } from '@/components/cnc/VisualizerArea';
import { Button } from '@/components/ui/button';
import { ProductDefinition, ProductConfiguration, Material } from '@/types';
import { ArrowLeft, Box } from 'lucide-react'; // Keep relevant icons
// Import constants needed for calculation
import {
    EFFICIENCY,
    MANUFACTURE_RATE,
    MANUFACTURE_AREA_RATE,
    GST_RATE
} from '@/lib/cncConstants';

interface BoxCustomizerProps {
  onBack: () => void;
}

// Interface for calculated price details
interface PriceDetails {
    area: number;
    sheets: number;
    materialCost: number;
    manufactureCost: number;
    subTotal: number;
    gstAmount: number;
    totalIncGST: number;
}

const BoxCustomizer: React.FC<BoxCustomizerProps> = ({ onBack }) => {
  // --- State specific to Box Builder ---
  const [product, setProduct] = useState<ProductDefinition | null>(null);
  // State to hold the *current* configuration reported by the form
  const [currentConfig, setCurrentConfig] = useState<ProductConfiguration>({});
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading initially
  const [error, setError] = useState<string | null>(null);
  // --- State for calculated quote ---
  const [priceDetails, setPriceDetails] = useState<PriceDetails | null>(null);
  const [turnaround, setTurnaround] = useState<number | null>(null);
  // --- State for materials data (needed for thickness lookup) ---
  const [materials, setMaterials] = useState<Material[] | null>(null);
  const [materialsLoading, setMaterialsLoading] = useState<boolean>(false);


  // --- Data Fetching ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      setProduct(null); // Reset product state on fetch
      setCurrentConfig({}); // Reset config state
      setPriceDetails(null); // Reset price on load
      setTurnaround(null); // Reset turnaround on load
      try {
        const productRes = await fetch(`/api/products/box-builder`);
        if (!productRes.ok) {
          throw new Error(`Failed to fetch product: ${productRes.statusText}`);
        }
        const productData: ProductDefinition = await productRes.json();
        setProduct(productData);

        // Set initial config based on defaults ONLY AFTER product data is loaded
        // BoxBuilderForm will initialize itself, but we need a starting value here too
        const initialConfig: ProductConfiguration = {};
        productData.parameters.forEach(param => {
            initialConfig[param.id] = param.defaultValue;
        });
        setCurrentConfig(initialConfig);

      } catch (err: unknown) {
        console.error("Failed to load Box Builder product data:", err);
        const errorMessage = (err instanceof Error) ? err.message : 'Failed to load configuration data. Please try again.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []); // Fetch only once on mount

  // Effect to fetch materials (runs once after initial product load attempt)
  const fetchMaterials = useCallback(async () => {
    setMaterialsLoading(true);
    try {
      const response = await fetch('/api/materials');
      if (!response.ok) {
        throw new Error(`Failed to fetch materials: ${response.statusText}`);
      }
      const data: Material[] = await response.json();
      setMaterials(data);
      if (product && !currentConfig.material && data && data.length > 0) {
          setCurrentConfig(prev => ({...prev, material: data[0].id}));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error fetching materials';
      console.error("[BoxCustomizer] Error fetching materials:", message);
      setMaterials(null);
    } finally {
      setMaterialsLoading(false);
    }
  }, [product, currentConfig, setCurrentConfig]);

  useEffect(() => {
    if (!error) {
        fetchMaterials();
    }
  }, [error, fetchMaterials]);

  // --- Calculation Logic ---
  // const materialIdFromConfig = currentConfig.material; // Removed this extraction

  useEffect(() => {
    if (!product || Object.keys(currentConfig).length === 0 || !materials) {
        setPriceDetails(null);
        setTurnaround(null);
        return;
    }

    try {
        // Extract dimensions and config
        const width = (currentConfig['width'] as number) ?? 0;
        const height = (currentConfig['height'] as number) ?? 0;
        const depth = (currentConfig['depth'] as number) ?? 0;
        const materialId = (currentConfig['material'] as string) ?? '0'; // Reverted to using currentConfig directly
        const boxType = (currentConfig['boxType'] as string) ?? 'closedLid';
        // dimensionsAre might affect interpretation, but not simple area calc
        // const dimensionsAre = (currentConfig['dimensionsAre'] as string) ?? 'outside';
        // materialThickness not directly used in simple area calc

        const selectedMaterial = materials.find(m => m.id === materialId);

        if (width <= 0 || height <= 0 || depth <= 0 || !materialId || !selectedMaterial) {
            setPriceDetails(null);
            setTurnaround(null);
            return; // Invalid config for pricing
        }

        // Placeholder Surface Area Calculation (mm^2)
        let area_mm2 = 0;
        const side1 = width * height;
        const side2 = width * depth;
        const side3 = height * depth;

        if (boxType === 'closedLid' || boxType === 'closedNoLid') {
            area_mm2 = 2 * (side1 + side2 + side3);
        } else if (boxType === 'openTop') {
            area_mm2 = 2 * (side1 + side3) + side2; // Missing one width*depth face
        } else {
            area_mm2 = 2 * (side1 + side2 + side3); // Default to closed for calc
        }

        const area_m2 = area_mm2 / 1_000_000;

        // Calculate Sheets & Costs
        const materialSheetAreaM2 = (selectedMaterial.sheet_length_mm / 1000) * (selectedMaterial.sheet_width_mm / 1000);
        // Fallback to a default generic sheet area if material specific is 0, to prevent division by zero.
        // This default (e.g., 2.88 for a 2400x1200 sheet) could also come from cncConstants if preferred for fallback.
        const defaultSheetAreaFallback = 2.88; 
        const currentSheetArea = materialSheetAreaM2 > 0 ? materialSheetAreaM2 : defaultSheetAreaFallback;

        const sheets = area_m2 > 0 ? Math.ceil(area_m2 / (currentSheetArea * EFFICIENCY)) : 0;
        const materialCost = sheets * selectedMaterial.sheet_price;
        const manufactureCost = sheets * MANUFACTURE_RATE + area_m2 * MANUFACTURE_AREA_RATE;
        const subTotal = materialCost + manufactureCost;
        const gstAmount = subTotal * GST_RATE;
        const totalIncGST = subTotal + gstAmount;

        setPriceDetails({
            area: area_m2,
            sheets: sheets,
            materialCost: materialCost,
            manufactureCost: manufactureCost,
            subTotal: subTotal,
            gstAmount: gstAmount,
            totalIncGST: totalIncGST,
        });
        setTurnaround(3); // Placeholder turnaround

    } catch (calcError) {
        console.error("Error during price calculation:", calcError);
        setPriceDetails(null);
        setTurnaround(null);
    }

  }, [currentConfig, product, materials]); // Reverted to [currentConfig, product, materials]

  // --- Callbacks ---
  // Callback to receive updates FROM the form
  const handleConfigChange = useCallback((newConfig: ProductConfiguration) => {
    setCurrentConfig(newConfig); // Update the state here when the form reports changes
    // Recalculate price/turnaround based on newConfig if needed
    // console.log("BoxCustomizer received config change:", newConfig);
  }, []);

  const handleAddToCart = () => {
    console.log('Adding Box to cart:', { config: currentConfig, price: priceDetails });
    // Add actual add to cart logic here (e.g., using priceDetails.totalIncGST)
  }

  const handleSaveConfig = () => {
    console.log('Saving Box configuration:', { config: currentConfig });
    // Add actual save logic here
  }

  // Callback to reset configuration to initial defaults
  const handleReset = useCallback(() => {
    if (product) {
      const initialConfig: ProductConfiguration = {};
      product.parameters.forEach(param => {
          initialConfig[param.id] = param.defaultValue;
      });
      setCurrentConfig(initialConfig);
      setPriceDetails(null); // Also clear price details on reset
      setTurnaround(null); // Clear turnaround on reset
      console.log('Box configuration reset to defaults:', initialConfig);
    } else {
      console.warn('Cannot reset configuration: Product definition not loaded.');
    }
  }, [product]); // Dependency on product to access defaults

  // --- Derived Values for Visualizer (use currentConfig) ---
  const boxWidth = (currentConfig['width'] as number) ?? 100;
  const boxHeight = (currentConfig['height'] as number) ?? 100;
  const boxDepth = (currentConfig['depth'] as number) ?? 400;
  const boxType = (currentConfig['boxType'] as string) ?? 'closedLid';
  const dimensionsAre = (currentConfig['dimensionType'] as string) ?? 'outside';
  const joinType = (currentConfig['joinType'] as string) ?? 'butt'; // Get joinType
  // Derive material thickness from selected material in config
  const selectedMaterialId = currentConfig['material'] as string;
  const selectedMaterialFromMemo = useMemo(() => {
      if (!materials || !selectedMaterialId) return null;
      return materials.find(m => m.id === selectedMaterialId) ?? null;
  }, [materials, selectedMaterialId]);

  const visualizerThickness = selectedMaterialFromMemo?.thickness_mm ?? 3;

  const isAddToCartDisabled = isLoading || materialsLoading || !!error || !product || !priceDetails || priceDetails.totalIncGST <= 0;
  const isSaveDisabled = isLoading || materialsLoading || !!error || !product || Object.keys(currentConfig).length === 0; // Disable save if loading, error, no product, or no config

  // --- DEBUGGING --- 
  console.log('[BoxCustomizer] Passing props to Visualizer:', {
    boxWidth,
    boxHeight,
    boxDepth,
    boxType,
    visualizerThickness,
    dimensionsAre,
    joinType, // Log the joinType being passed
  });
  // --- END DEBUGGING ---

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
          <Box className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Box Builder</h1>
        </div>
      </div>

      {/* Main Two-Column Layout - Reverse order on medium screens and up */}
      <div className="flex flex-grow gap-6 md:flex-row-reverse flex-col overflow-hidden">

        {/* Right Column (becomes left on md+): Configuration + Actions */}
        {/* Increase width */}
        <aside className="w-full md:w-[30rem] lg:w-[34rem] flex-shrink-0 flex flex-col space-y-6 overflow-y-auto">
          {/* Configuration Form Area */}
          <div className="flex-shrink-0 rounded-md border border-border bg-card p-4">
            {isLoading ? (
              <div className="p-4 text-center">Loading Box Builder...</div>
            ) : error ? (
              <div className="p-4 text-red-500">Error: {error}</div>
            ) : product ? (
              <BoxBuilderForm
                product={product}
                onConfigChange={handleConfigChange}
              />
            ) : (
              <div className="p-4 text-center">Could not load Box Builder data.</div>
            )}
          </div>

          {/* Quote & Actions Area */}
          <div className="flex-shrink-0">
             <QuoteActions
                price={priceDetails?.totalIncGST ?? 0} 
                turnaround={turnaround ?? 0} 
                onAddToCart={handleAddToCart}
                onSaveConfig={handleSaveConfig}
                onReset={handleReset} 
                isAddToCartDisabled={isAddToCartDisabled} 
                isSaveDisabled={isSaveDisabled} 
                quantity={1}
                onQuantityChange={() => {}}
                sheets={priceDetails?.sheets || 0} 
                materialCost={priceDetails?.materialCost || 0}
                manufactureCost={priceDetails?.manufactureCost || 0}
             />
          </div>
        </aside>

        {/* Left Column (becomes right on md+): Visualization */}
        <main className="flex-grow min-h-[300px] md:min-h-0 rounded-lg border border-border bg-muted/40 flex items-center justify-center relative">
          <BoxVisualizer
             width={boxWidth}
             height={boxHeight}
             depth={boxDepth}
             boxType={boxType}
             materialThickness={visualizerThickness}
             dimensionsAre={dimensionsAre}
             joinType={joinType} // Pass joinType prop
          />
          {/* Add any overlays or controls for the visualizer */}
        </main>
      </div>
    </div>
  );
};

export default BoxCustomizer; 