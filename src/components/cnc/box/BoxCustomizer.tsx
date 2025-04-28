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
    MATERIAL_RATES,
    SHEET_AREA,
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
        console.error("[BoxCustomizer] Error fetching materials:", message);
        setMaterials(null);
      }
    };

    // Only fetch materials if product loading didn't immediately fail
    if (!error) {
        fetchMaterials();
    }
  }, [error]); // Run when initial product load finishes (check error state)

  // --- Calculation Logic ---
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
        const depth = (currentConfig['depth'] as number) ?? 0;
        const materialId = (currentConfig['material'] as string) ?? '0';
        const boxType = (currentConfig['boxType'] as string) ?? 'closedLid';
        // dimensionsAre might affect interpretation, but not simple area calc
        // const dimensionsAre = (currentConfig['dimensionsAre'] as string) ?? 'outside';
        // materialThickness not directly used in simple area calc

        if (width <= 0 || height <= 0 || depth <= 0 || !materialId || !MATERIAL_RATES[materialId]) {
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
        const sheets = area_m2 > 0 ? Math.ceil(area_m2 / (SHEET_AREA * EFFICIENCY)) : 0;
        const materialInfo = MATERIAL_RATES[materialId];
        const materialCost = sheets * materialInfo.price;
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

  }, [currentConfig, product]);

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
  const selectedMaterialId = currentConfig['materialId'] as string;
  const selectedMaterial = useMemo(() => {
      if (!materials || !selectedMaterialId) return null;
      return materials.find(m => m.id === selectedMaterialId) ?? null;
  }, [materials, selectedMaterialId]);

  const visualizerThickness = selectedMaterial?.thickness_mm ?? 3; // Use thickness_mm, Default to 3 if not found/loaded

  const isAddToCartDisabled = isLoading || !!error || !product || !priceDetails || priceDetails.totalIncGST <= 0;
  const isSaveDisabled = isLoading || !!error || !product || Object.keys(currentConfig).length === 0; // Disable save if loading, error, no product, or no config

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

      {/* Main Two-Column Layout */}
      <div className="flex flex-grow gap-6 md:flex-row flex-col">

        {/* Left Column: Configuration + Actions */}
        <aside className="w-full md:w-96 lg:w-[28rem] flex-shrink-0 flex flex-col space-y-6">
          {/* Configuration Form Area */}
          <div className="flex-shrink-0">
            {isLoading ? (
              <div className="p-4 text-center">Loading Box Builder...</div>
            ) : error ? (
              <div className="p-4 text-red-500">Error: {error}</div>
            ) : product ? (
              <BoxBuilderForm
                product={product}
                // No initialConfig needed here
                onConfigChange={handleConfigChange} // Pass the callback
              />
            ) : (
              <div className="p-4 text-center">Could not load Box Builder data.</div>
            )}
          </div>

          {/* Quote & Actions Area */}
          <div className="flex-shrink-0">
             {/* TODO: Implement Box Builder Quote/Actions using calculated price/turnaround and currentConfig */}
             {/* <div className=\"bg-card p-4 rounded-lg shadow border border-border\">\
               <h3 className=\"text-lg font-semibold mb-4 text-card-foreground\">Quote Summary</h3>\
                <p className=\"text-sm text-muted-foreground\">(Box quote details will appear here based on config)</p>\
                {/* Add price/turnaround display */}
                {/* <Button onClick={handleAddToCart} disabled={isLoading || !!error || !product /* Add price check */ /*} className=\"w-full mt-4\">\
                    Add to Cart {/* Implement logic */}
                {/* </Button>\
                <Button variant=\"outline\" onClick={handleSaveConfig} disabled={isLoading || !!error || !product} className=\"w-full mt-2\">\
                    Save Configuration {/* Implement logic */}
                {/* </Button>\
              </div> */}
             {/* Use the standard QuoteActions component */}
              {/* {product && priceDetails && turnaround !== null ? ( */}
                 <QuoteActions
                    price={priceDetails?.totalIncGST ?? 0} // Pass calculated total price or 0
                    turnaround={turnaround ?? 0} // Pass calculated turnaround or 0
                    onAddToCart={handleAddToCart}
                    onSaveConfig={handleSaveConfig}
                    onReset={handleReset} // Pass the new reset handler
                    isAddToCartDisabled={isAddToCartDisabled} // Pass disable flag
                    isSaveDisabled={isSaveDisabled} // Pass disable flag
                 />
              {/* ) : (
                 <div className="bg-card p-4 rounded-lg shadow border border-border text-center text-muted-foreground">
                   {isLoading ? 'Loading quote...' : error ? 'Error calculating quote.' : 'Configure parameters to get a quote...'}
                 </div>
               )} */}
          </div>
        </aside>

        {/* Right Column: Visualization */}
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