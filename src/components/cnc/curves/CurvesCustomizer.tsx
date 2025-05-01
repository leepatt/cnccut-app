'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CurvesBuilderForm } from './CurvesBuilderForm';
import CurvesVisualizer from './CurvesVisualizer';
import { QuoteActions } from '@/components/cnc/VisualizerArea';
import { Button } from '@/components/ui/button';
import { ProductDefinition, ProductConfiguration, Material } from '@/types';
import { ArrowLeft, CircleDashed, AlertTriangle } from 'lucide-react';
import {
    MATERIAL_RATES,
    MANUFACTURE_RATE,
    MANUFACTURE_AREA_RATE,
    GST_RATE,
    SHEET_AREA,
    USABLE_SHEET_LENGTH,
    USABLE_SHEET_WIDTH,
    EFFICIENCY,
    // SHOPIFY_VARIANT_ID - Uncomment when implementing cart functionality
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
    sheets: number;
}

// Interface for derived measurements
interface DerivedMeasurements {
  arcLength: number;
  chordLength: number;
}

// Interface for split information
interface SplitInfo {
  isTooLarge: boolean;
  numSplits: number;
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
  // New state for split information
  const [splitInfo, setSplitInfo] = useState<SplitInfo>({
    isTooLarge: false,
    numSplits: 1
  });
  const [quantity, setQuantity] = useState<number>(1);
  // New state for split line hover
  const [splitLinesHovered, setSplitLinesHovered] = useState(false);

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

        // Set specific initial config after fetching product definition
        // Use defaults from productData for unspecified fields
        const initialConfig: ProductConfiguration = {};
        productData.parameters.forEach(param => {
          // Prioritize user-defined defaults, then API defaults
          if (param.id === 'radius') {
              initialConfig[param.id] = 900;
          } else if (param.id === 'width') {
              initialConfig[param.id] = 100;
          } else if (param.id === 'angle') {
              initialConfig[param.id] = 90;
          } else {
              initialConfig[param.id] = param.defaultValue; // Use API default for others
          }
        });
        setCurrentConfig(initialConfig);
        
        setQuantity(1); // Set initial quantity directly

      } catch (err: unknown) {
        console.error("Failed to load Curves product data:", err);
        const errorMessage = (err instanceof Error) ? err.message : 'Failed to load configuration data.';
        setError(errorMessage);
        // Clear states on error
        setProduct(null);
        setCurrentConfig({});
        setMaterials(null);
        setPriceDetails(null);
        setTurnaround(null);
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

    // Check if part is too large for a single sheet
    const a_rad = angle * Math.PI / 180;
    const chordLengthOuter = 2 * outerRadius * Math.sin(a_rad / 2);
    const sagittaOuter = outerRadius * (1 - Math.cos(a_rad / 2));
    const partHeight = width > 0 ? sagittaOuter + width : sagittaOuter;
    
    const fitsNormally = (chordLengthOuter <= USABLE_SHEET_LENGTH && partHeight <= USABLE_SHEET_WIDTH);
    const fitsRotated = (chordLengthOuter <= USABLE_SHEET_WIDTH && partHeight <= USABLE_SHEET_LENGTH);
    const partFits = fitsNormally || fitsRotated;
    
    if (!partFits) {
      // Calculate splits needed
      const splitsLengthNormal = Math.ceil(chordLengthOuter / USABLE_SHEET_LENGTH);
      const splitsHeightNormal = Math.ceil(partHeight / USABLE_SHEET_WIDTH);
      const splitsNeededNormal = Math.max(splitsLengthNormal, splitsHeightNormal);
      
      const splitsLengthRotated = Math.ceil(partHeight / USABLE_SHEET_LENGTH);
      const splitsHeightRotated = Math.ceil(chordLengthOuter / USABLE_SHEET_WIDTH);
      const splitsNeededRotated = Math.max(splitsLengthRotated, splitsHeightRotated);
      
      const numSplits = Math.max(2, Math.min(splitsNeededNormal, splitsNeededRotated));
      
      // Store split info in state
      setSplitInfo({ isTooLarge: true, numSplits });
    } else {
      setSplitInfo({ isTooLarge: false, numSplits: 1 });
    }
  }, [currentConfig, product]);

  // Calculation Logic for pricing
  useEffect(() => {
    if (!product || Object.keys(currentConfig).length === 0 || quantity < 1) {
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
        
        // Calculate area of ONE curved segment
        const outerRadius = radius + width;
        const segmentArea = (angle / 360) * Math.PI * (Math.pow(outerRadius, 2) - Math.pow(radius, 2));
        const materialAreaPerPart = segmentArea / 1000000; // m² per part

        // Calculate TOTAL area based on quantity
        const totalMaterialArea = materialAreaPerPart * quantity;

        // Apply efficiency factor to sheet calculation - include splits if necessary
        const effectiveArea = splitInfo.isTooLarge ? totalMaterialArea * 1.15 : totalMaterialArea; // Add 15% waste for splits
        const sheets = effectiveArea > 0 ? Math.ceil(effectiveArea / (SHEET_AREA * EFFICIENCY)) : 0;

        // Calculate Costs based on TOTAL area and sheets
        const materialCost = sheets * materialInfo.price;
        const manufactureCost = MANUFACTURE_RATE * sheets + effectiveArea * MANUFACTURE_AREA_RATE;
        const subTotal = materialCost + manufactureCost;
        const gstAmount = subTotal * GST_RATE;
        const totalIncGST = subTotal + gstAmount;

        setPriceDetails({
            materialCost,
            manufactureCost,
            subTotal,
            gstAmount,
            totalIncGST,
            sheets,
        });
        
        // Calculate turnaround based on size, complexity and splits
        const complexity = angle > 180 ? 1.5 : 1;
        const splitFactor = splitInfo.isTooLarge ? 1.5 : 1; // Longer turnaround for split items
        const baseTurnaround = 2; // Base days
        setTurnaround(Math.ceil(baseTurnaround * complexity * splitFactor));

    } catch (calcError) {
        console.error("Error during price calculation:", calcError);
        setPriceDetails(null);
        setTurnaround(null);
    }
  }, [currentConfig, product, derivedMeasurements, splitInfo, quantity]);

  // Callbacks
  const handleConfigChange = useCallback((newConfig: ProductConfiguration) => {
    setCurrentConfig(newConfig);
  }, []);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    setQuantity(newQuantity);
  }, []);

  const handleAddToCart = () => {
    if (!priceDetails || !currentConfig.radius) {
      console.log('Cannot add to cart: Invalid configuration');
      return;
    }
    
    // Format properties for cart
    const materialName = materials?.find(m => m.id === (currentConfig.material as string))?.name || 
                        MATERIAL_RATES[(currentConfig.material as string)]?.name || 
                        'Unknown';
    
    const properties = {
      'Material': materialName,
      'Dimensions': `R: ${currentConfig.radius}mm, W: ${currentConfig.width}mm, θ: ${currentConfig.angle}°`,
      'Quantity': quantity.toString(),
      'Arc Length': `${derivedMeasurements.arcLength.toFixed(1)}mm`,
      'Chord Length': `${derivedMeasurements.chordLength.toFixed(1)}mm`,
      'Total Area (m²)': (derivedMeasurements.arcLength * derivedMeasurements.chordLength / 1_000_000).toFixed(2),
      'Manufacturing Notes': splitInfo.isTooLarge ? `Will be manufactured in ${splitInfo.numSplits} sections` : 'Single piece'
    };
    
    console.log('Adding Curve to cart:', { 
      config: currentConfig, 
      quantity: quantity,
      price: priceDetails,
      properties: properties
    });
    
    // Shopify cart integration - uncomment to enable
    /* 
    // Calculate quantity for $0.01 product
    const quantityToAdd = Math.round(priceDetails.totalIncGST * 100);
    
    const formData = {
      'items': [{
        'id': SHOPIFY_VARIANT_ID,
        'quantity': quantityToAdd,
        'properties': properties
      }]
    };
    
    fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errData => {
          throw new Error(errData.description || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    })
    .then(json => {
      console.log('Added to cart:', json);
      window.location.href = '/cart'; // Redirect to cart
    })
    .catch((error) => {
      console.error('Error adding to cart:', error);
      alert(`Error adding item to cart: ${error.message}`);
    });
    */
  }

  const handleSaveConfig = () => {
    console.log('Saving Curve configuration:', { config: currentConfig });
    // Add actual save logic here
  }

  const handleReset = useCallback(() => {
    if (product) {
      // Reset to the specific defaults, not API defaults
      const initialConfig: ProductConfiguration = {};
      product.parameters.forEach(param => {
        if (param.id === 'radius') {
            initialConfig[param.id] = 900;
        } else if (param.id === 'width') {
            initialConfig[param.id] = 100;
        } else if (param.id === 'angle') {
            initialConfig[param.id] = 90;
        } else {
            initialConfig[param.id] = param.defaultValue; // Use API default for others
        }
      });
      setCurrentConfig(initialConfig);
      setQuantity(1); // Reset quantity on manual reset
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

  // Log the config values before rendering/passing down
  console.log('[CurvesCustomizer] Current Config:', currentConfig);
  console.log(`[CurvesCustomizer] Passing radius to Visualizer: ${radius}`);

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

      {/* Main Two-Column Layout - Reverse order on medium screens and up */} 
      <div className="flex flex-grow gap-6 md:flex-row-reverse flex-col overflow-hidden">
        
        {/* Right Column (becomes left on md+): Configuration + Actions */} 
        {/* Increase width: md:w-96 -> md:w-[30rem], lg:w-[28rem] -> lg:w-[34rem] */}
        <aside className="w-full md:w-[30rem] lg:w-[34rem] flex-shrink-0 flex flex-col space-y-6 overflow-y-auto">
          {/* Configuration Form Area */}
          <div className="flex-shrink-0 rounded-md border border-border bg-card p-4">
            <CurvesBuilderForm
              product={product!}
              initialConfig={currentConfig}
              onConfigChange={handleConfigChange}
              splitInfo={splitInfo}
              setSplitLinesHovered={setSplitLinesHovered}
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
              quantity={quantity}
              onQuantityChange={handleQuantityChange}
              sheets={priceDetails?.sheets || 0}
              materialCost={priceDetails?.materialCost || 0}
              manufactureCost={priceDetails?.manufactureCost || 0}
            />
          </div>
        </aside>

        {/* Left Column (becomes right on md+): Visualization */}
        <main className="flex-grow relative rounded-lg border border-border bg-muted/40 flex flex-col items-center justify-center min-h-[350px] md:min-h-0">
          <CurvesVisualizer
            radius={radius}
            width={curvesWidth}
            angle={angle}
            materialThickness={materialThickness}
            arcLength={derivedMeasurements.arcLength}
            chordLength={derivedMeasurements.chordLength}
            showDimensions={true}
            isTooLarge={splitInfo.isTooLarge}
            numSplits={splitInfo.numSplits}
            splitLinesHovered={splitLinesHovered}
          />
          
          {/* Split Warning - Moved to top-center */}
          {splitInfo.isTooLarge && (
            <div 
              className="absolute top-4 left-1/2 -translate-x-1/2 z-10 cursor-pointer"
              onMouseEnter={() => setSplitLinesHovered(true)}
              onMouseLeave={() => setSplitLinesHovered(false)}
            >
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md flex items-center text-sm shadow-md">
                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Will be manufactured in {splitInfo.numSplits} sections due to size constraints</span>
              </div>
            </div>
          )}
        </main>

      </div>
    </div>
  );
};

export default CurvesCustomizer; 