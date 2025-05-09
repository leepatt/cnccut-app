'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for unique IDs
import { CurvesBuilderForm } from './CurvesBuilderForm';
import CurvesVisualizer from './CurvesVisualizer';
import { Button } from '@/components/ui/button';
import { ProductDefinition, ProductConfiguration, Material, PartListItem } from '@/types'; // Added PartListItem
import { ArrowLeft, CircleDashed, AlertTriangle, Trash2, PlusCircle, Sheet, RotateCcw } from 'lucide-react'; // Removed Wrench
import { Separator } from "@/components/ui/separator"; // Added Separator
import { ScrollArea } from "@/components/ui/scroll-area"; // Added ScrollArea
import {
    MANUFACTURE_RATE,
    MANUFACTURE_AREA_RATE,
    GST_RATE,
    EFFICIENCY, // General efficiency for non-curve parts (used in weighted average)
} from '@/lib/cncConstants';
// Import the efficiency calculation logic
import { calculateNestingEfficiency, CURVE_EFFICIENCY_RATES } from '@/lib/pricingUtils';

// Define Props Interface (Ensuring it exists)
interface CurvesCustomizerProps {
  onBack: () => void;
}

// Removed old PriceDetails interface, we'll use a similar one for the total list
interface TotalPriceDetails {
    materialCost: number;
    manufactureCost: number;
    subTotal: number;
    gstAmount: number;
    totalIncGST: number;
    sheetsByMaterial: { [materialId: string]: number }; // Track sheets per material
}

// Interface for derived measurements (remains the same)
interface DerivedMeasurements {
  arcLength: number;
  chordLength: number;
}

// Interface for split information (remains the same)
interface SplitInfo {
  isTooLarge: boolean;
  numSplits: number;
}

const R_PLACEHOLDER = 900;
const W_PLACEHOLDER = 100;
const A_PLACEHOLDER = 90;
const THICKNESS_PLACEHOLDER = 18; // Default thickness if no material for placeholder
const RADIUS_TYPE_PLACEHOLDER = 'internal'; // For placeholder, assume radiusType is 'internal' and R_PLACEHOLDER is inner radius

const getDefaultConfig = (): ProductConfiguration => ({
  material: '',
  radiusType: 'internal', // Default radiusType
  specifiedRadius: '',   // New field, formerly radius
  width: '',   
  angle: '',   
  // Other parameters will be added from product definition with their API defaults
});


const CurvesCustomizer: React.FC<CurvesCustomizerProps> = ({ onBack }) => {
  // State specific to Curves Builder
  const [product, setProduct] = useState<ProductDefinition | null>(null);
  const [currentConfig, setCurrentConfig] = useState<ProductConfiguration>(getDefaultConfig());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [materials, setMaterials] = useState<Material[] | null>(null);

  // State for the list of parts added by the user
  const [partsList, setPartsList] = useState<PartListItem[]>([]);
  // State for the quantity of the part currently being configured
  const [currentPartQuantity, setCurrentPartQuantity] = useState<number>(1);
  
  // State for the calculated quote FOR THE ENTIRE partsList
  const [totalPriceDetails, setTotalPriceDetails] = useState<TotalPriceDetails | null>(null);
  const [totalTurnaround, setTotalTurnaround] = useState<number | null>(null); // Represents max turnaround

  // State for derived measurements of the CURRENTLY configured part
  const [derivedMeasurements, setDerivedMeasurements] = useState<DerivedMeasurements>({
    arcLength: 0,
    chordLength: 0
  });
  // State for split information of the CURRENTLY configured part
  const [splitInfo, setSplitInfo] = useState<SplitInfo>({
    isTooLarge: false,
    numSplits: 1
  });
  // State for split line hover (remains the same)
  const [splitLinesHovered, setSplitLinesHovered] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null); // New state for focused field

  // --- Data Fetching (remains largely the same) ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      setProduct(null);
      setTotalPriceDetails(null);
      setTotalTurnaround(null);
      try {
        const productRes = await fetch(`/api/products/curves`);
        if (!productRes.ok) throw new Error(`Failed to fetch product: ${productRes.statusText}`);
        const productData: ProductDefinition = await productRes.json();
        setProduct(productData);

        const initialConfig = getDefaultConfig();
        productData.parameters.forEach(param => {
          // Add all params to initialConfig, using their defaultValue from JSON if defined, 
          // otherwise they'll keep what getDefaultConfig set (e.g. '' for core, 'internal' for radiusType)
          if (!Object.prototype.hasOwnProperty.call(initialConfig, param.id) || initialConfig[param.id] === undefined) {
            initialConfig[param.id] = param.defaultValue !== undefined ? param.defaultValue : '';
          }
        });
        setCurrentConfig(initialConfig);
        setCurrentPartQuantity(1);

      } catch (err: unknown) {
        console.error("Failed to load Curves product data:", err);
        const errorMessage = (err instanceof Error) ? err.message : 'Failed to load configuration data.';
        setError(errorMessage);
        setProduct(null);
        setCurrentConfig(getDefaultConfig()); // Reset to default on error
        setMaterials(null);
        setTotalPriceDetails(null);
        setTotalTurnaround(null);
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
        // DO NOT set default material here anymore, user must select.
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error fetching materials';
        console.error("[CurvesCustomizer] Error fetching materials:", message);
        setMaterials(null);
      }
    };

    if (!error) { // Only fetch if no initial error
        fetchMaterials();
    }
  // Removed currentConfig from dependencies to prevent re-fetching material when config changes to empty
  }, [error, product]);


  // Determine if the current configuration is incomplete for actual part calculation
  const isConfigIncomplete = !(
      currentConfig.material && currentConfig.material !== '' &&
      currentConfig.radiusType && (currentConfig.radiusType === 'internal' || currentConfig.radiusType === 'external') &&
      Number(currentConfig.specifiedRadius) > 0 &&
      Number(currentConfig.width) > 0 && // Width must be > 0 now
      Number(currentConfig.angle) > 0
  );

  // Calculate actual inner and outer radii based on currentConfig or placeholder values
  const getActualRadii = () => {
    const rType = isConfigIncomplete ? RADIUS_TYPE_PLACEHOLDER : currentConfig.radiusType as 'internal' | 'external';
    const specRad = isConfigIncomplete ? R_PLACEHOLDER : Number(currentConfig.specifiedRadius);
    const w = isConfigIncomplete ? W_PLACEHOLDER : Number(currentConfig.width);

    let actualInnerR = 0;
    let actualOuterR = 0;

    if (rType === 'internal') {
      actualInnerR = specRad;
      actualOuterR = specRad + w;
    } else { // external
      actualOuterR = specRad;
      actualInnerR = specRad - w;
    }
    // Ensure inner radius is not negative (validation should prevent this for user input)
    if (actualInnerR < 0) actualInnerR = 0; 
    return { actualInnerRadius: actualInnerR, actualOuterRadius: actualOuterR };
  };

  const { actualInnerRadius, actualOuterRadius } = getActualRadii();

  const effectiveAngle = isConfigIncomplete ? A_PLACEHOLDER : Number(currentConfig.angle);

  // --- Derived Measurements & Split Info for CURRENT Config (or placeholder) ---
  useEffect(() => {
    const angleNum = Number(effectiveAngle); // This is derived from currentConfig.angle or A_PLACEHOLDER

    // Basic validation for geometric properties
    if (isNaN(actualOuterRadius) || actualOuterRadius <= 0 || isNaN(angleNum) || angleNum <= 0) {
      setDerivedMeasurements({ arcLength: 0, chordLength: 0 });
      setSplitInfo({ isTooLarge: false, numSplits: 1 });
      return;
    }

    const angleRad = angleNum * (Math.PI / 180);
    const calculatedArcLength = actualOuterRadius * angleRad;
    const calculatedChordLength = 2 * actualOuterRadius * Math.sin(angleRad / 2); // This is chord_N1 for an unsplit part

    setDerivedMeasurements({
      arcLength: calculatedArcLength,
      chordLength: calculatedChordLength
    });

    // New Split Info Logic
    // If config is incomplete, or material info is missing, default to not splitting.
    if (isConfigIncomplete || !currentConfig.material || !materials || materials.length === 0) {
      setSplitInfo({ isTooLarge: false, numSplits: 1 });
      return;
    }

    const selectedMaterial = materials.find(m => m.id === (currentConfig.material as string));
    // If material details or sheet dimensions are missing/invalid, default to not splitting.
    if (!selectedMaterial || !selectedMaterial.sheet_length_mm || !selectedMaterial.sheet_width_mm || selectedMaterial.sheet_length_mm <= 0 || selectedMaterial.sheet_width_mm <= 0) {
      setSplitInfo({ isTooLarge: false, numSplits: 1 });
      return;
    }

    const sheetL = selectedMaterial.sheet_length_mm;
    const sheetW = selectedMaterial.sheet_width_mm;
    const partConfigWidth = Number(currentConfig.width);

    // Ensure partConfigWidth is a valid number.
    if (isNaN(partConfigWidth) || partConfigWidth < 0) {
        setSplitInfo({ isTooLarge: false, numSplits: 1 });
        return;
    }
    
    let availableSheetLengthForChord: number;
    if (partConfigWidth <= Math.min(sheetL, sheetW)) {
      // Part width fits into the smaller sheet dimension, so chord can use the larger dimension.
      availableSheetLengthForChord = Math.max(sheetL, sheetW);
    } else if (partConfigWidth <= Math.max(sheetL, sheetW)) {
      // Part width fits into the larger sheet dimension, so chord must use the smaller dimension.
      availableSheetLengthForChord = Math.min(sheetL, sheetW);
    } else {
      // Part's configured radial width is too large for the sheet in any orientation.
      // It's one piece, and it's too wide. Splitting angle won't fix this.
      setSplitInfo({ isTooLarge: true, numSplits: 1 });
      return;
    }

    // If sheet dimensions were such that available length is zero (e.g. bad data somehow passed initial checks)
    if (availableSheetLengthForChord <= 0) {
        setSplitInfo({ isTooLarge: false, numSplits: 1 }); // Default to not too large if sheet data is problematic
        return;
    }

    const chord_N1 = calculatedChordLength; // Chord length of the unsplit part

    if (chord_N1 <= availableSheetLengthForChord) {
      // The unsplit part fits.
      setSplitInfo({ isTooLarge: false, numSplits: 1 });
    } else {
      // The unsplit part is too long for the available sheet length, needs splitting.
      const MAX_ALLOWED_SPLITS = 10; // Define a reasonable maximum number of splits
      let numSplitsCalc = Math.ceil(chord_N1 / availableSheetLengthForChord);
      
      // Ensure numSplits is at least 2 (since it didn't fit as 1) and cap at MAX_ALLOWED_SPLITS.
      numSplitsCalc = Math.max(2, Math.min(numSplitsCalc, MAX_ALLOWED_SPLITS)); 
      
      setSplitInfo({ isTooLarge: true, numSplits: numSplitsCalc });
    }

  }, [
    actualOuterRadius, 
    effectiveAngle, 
    currentConfig.material, 
    currentConfig.width, // Added currentConfig.width
    materials,           // Added materials
    isConfigIncomplete   // Added isConfigIncomplete
  ]);


  // --- NEW: Main Pricing Calculation for the ENTIRE Parts List ---
  useEffect(() => {
    if (partsList.length === 0 || !materials) {
        setTotalPriceDetails(null);
        setTotalTurnaround(null);
        return;
    }

    try {
        let totalMaterialCost = 0;
        let totalManufactureCost = 0;
        // ... (rest of the pricing logic remains the same) ...
        // Code up to line 297 from previous version is assumed to be here
// ... existing code ...
        const sheetsByMaterial: { [materialId: string]: number } = {};

        // Group parts by material
        const groupedByMaterial: { [materialId: string]: PartListItem[] } = {};
        partsList.forEach(part => {
            const matId = part.config.material as string;
            if (!groupedByMaterial[matId]) {
                groupedByMaterial[matId] = [];
            }
            groupedByMaterial[matId].push(part);
        });

        // Process each material group
        for (const materialId_loopVariable in groupedByMaterial) { // Renamed materialId to avoid conflict
            const groupItems = groupedByMaterial[materialId_loopVariable];
            const selectedMaterial = materials.find(m => m.id === materialId_loopVariable);

            if (!selectedMaterial) {
                console.error(`Material details not found for ID: ${materialId_loopVariable}. Skipping group.`);
                continue; 
            }

            let sumOfWeightedEfficiencies = 0;
            let sumOfTotalAreas = 0;

            groupItems.forEach(item => {
                const itemTotalArea = item.singlePartAreaM2 * item.numSplits * item.quantity;
                sumOfWeightedEfficiencies += itemTotalArea * item.itemIdealEfficiency;
                sumOfTotalAreas += itemTotalArea;
            });

            let groupNestingEfficiency = EFFICIENCY; 
            if (sumOfTotalAreas > 0) {
                groupNestingEfficiency = sumOfWeightedEfficiencies / sumOfTotalAreas;
                groupNestingEfficiency = Math.max(0.05, Math.min(0.95, groupNestingEfficiency)); 
            } else {
                groupNestingEfficiency = 0;
            }
            
            if (isNaN(groupNestingEfficiency)) { 
                console.error(`NaN calculated for group efficiency (Material: ${materialId_loopVariable}). Using fallback.`);
                groupNestingEfficiency = EFFICIENCY;
            }

            const materialSheetAreaM2 = (selectedMaterial.sheet_length_mm / 1000) * (selectedMaterial.sheet_width_mm / 1000);
            const defaultSheetAreaFallback = 2.88;
            const currentSheetAreaM2 = materialSheetAreaM2 > 0 ? materialSheetAreaM2 : defaultSheetAreaFallback;

            const sheetsNeededForGroup = sumOfTotalAreas > 0 && currentSheetAreaM2 > 0 && groupNestingEfficiency > 0
                ? Math.ceil(sumOfTotalAreas / (currentSheetAreaM2 * groupNestingEfficiency))
                : 0;

            sheetsByMaterial[materialId_loopVariable] = sheetsNeededForGroup;

            const materialCostForGroup = sheetsNeededForGroup * selectedMaterial.sheet_price;
            const manufactureCostForGroup = MANUFACTURE_RATE * sheetsNeededForGroup + sumOfTotalAreas * MANUFACTURE_AREA_RATE;

            totalMaterialCost += materialCostForGroup;
            totalManufactureCost += manufactureCostForGroup;
            // totalAreaM2 += sumOfTotalAreas; // This was defined but not used later in this block.
            
            let maxTurnaround = 0; // maxTurnaround should be scoped outside this loop if it's for the whole order.
                                  // Assuming it was meant to be initialized before this pricing useEffect.
                                  // For now, keeping its update logic as it was, but it might need review.
            groupItems.forEach(item => {
                const itemAngle = item.config.angle as number ?? 90;
                const complexity = itemAngle > 180 ? 1.5 : 1; 
                const splitFactorForTurnaround = item.numSplits > 1 ? 1.5 : 1;
                const baseTurnaround = 2; 
                const itemTurnaround = Math.ceil(baseTurnaround * complexity * splitFactorForTurnaround);
                maxTurnaround = Math.max(maxTurnaround, itemTurnaround);
            });
             // If maxTurnaround is for the whole order, it should be updated at the end of the loop or after.
             // For now, setting totalTurnaround with the max found in the last processed group.
            setTotalTurnaround(maxTurnaround); 
        }


        const subTotal = totalMaterialCost + totalManufactureCost;
        const gstAmount = subTotal * GST_RATE;
        const totalIncGST = subTotal + gstAmount;

        setTotalPriceDetails({
            materialCost: totalMaterialCost,
            manufactureCost: totalManufactureCost,
            subTotal: subTotal,
            gstAmount: gstAmount,
            totalIncGST: totalIncGST,
            sheetsByMaterial: sheetsByMaterial,
        });
        // setTotalTurnaround(maxTurnaround); // This was set inside the loop, might need to be set once after.

    } catch (calcError) {
        console.error("Error during total price calculation:", calcError);
        setTotalPriceDetails(null);
        setTotalTurnaround(null);
    }

  }, [partsList, materials]);


  const handleConfigChange = useCallback((changedValues: Partial<ProductConfiguration>) => {
    setCurrentConfig(prevConfig => {
      const updatedConfig = { ...prevConfig };
      for (const key in changedValues) {
        if (Object.prototype.hasOwnProperty.call(changedValues, key)) {
          const value = changedValues[key];
          if (value !== undefined) { 
            updatedConfig[key] = value; 
          } 
          // Assuming CurvesBuilderForm sends '' or valid values, not undefined to signify deletion for ProductConfiguration
        }
      }
      return updatedConfig;
    });
  }, []);

  const handleFieldFocusChange = useCallback((fieldId: string | null) => {
    setFocusedField(fieldId);
  }, []);

  const handleCurrentPartQuantityChange = useCallback((newQuantity: number) => {
    setCurrentPartQuantity(Math.max(1, newQuantity)); 
  }, []);
  
  const handleAddPart = useCallback(() => {
    const specRadiusNum = Number(currentConfig.specifiedRadius);
    const widthNum = Number(currentConfig.width);
    const angleNum = Number(currentConfig.angle);
    const radiusTypeVal = currentConfig.radiusType as 'internal' | 'external';
    // const materialIdValue = currentConfig['material'] as string; // Removed unused variable
    // const selectedMaterial = materials?.find(m => m.id === materialIdValue); // Remains commented out

    if (isConfigIncomplete || widthNum <= 0 || radiusTypeVal === 'external' && specRadiusNum <= widthNum) {
        console.error("Cannot add part: Invalid configuration, quantity, or width.");
        return;
    }
    
    let singlePartAreaM2 = 0;
    // Use effectiveAngle, effectiveRadius, effectiveWidth for calculations if part is being added from placeholder state?
    // No, use the actual currentConfig values because user must have filled them to enable "Add Part".
    // The isConfigIncomplete check above handles this.
    const numSplitsValue = splitInfo.isTooLarge ? splitInfo.numSplits : 1; // Renamed to avoid conflict
    let itemIdealEfficiency = 0.3;

    if (numSplitsValue <= 1) {
        const areaMM2 = (angleNum / 360) * Math.PI * (Math.pow(actualOuterRadius, 2) - Math.pow(actualInnerRadius, 2));
        singlePartAreaM2 = areaMM2 / 1000000; 
        itemIdealEfficiency = calculateNestingEfficiency(actualInnerRadius, widthNum, angleNum, CURVE_EFFICIENCY_RATES);
    } else {
        const splitPartAngle = angleNum / numSplitsValue;
        const areaOfOneSplitSectionMM2 = (splitPartAngle / 360) * Math.PI * (Math.pow(actualOuterRadius, 2) - Math.pow(actualInnerRadius, 2));
        singlePartAreaM2 = areaOfOneSplitSectionMM2 / 1000000;
        itemIdealEfficiency = calculateNestingEfficiency(actualInnerRadius, widthNum, splitPartAngle, CURVE_EFFICIENCY_RATES);
    }

    if (isNaN(singlePartAreaM2) || singlePartAreaM2 <= 0) {
        console.error("Cannot add part: Invalid calculated area.");
        return;
    }
    if (isNaN(itemIdealEfficiency)) {
         console.warn("Calculated ideal efficiency is NaN, using default 0.3");
         itemIdealEfficiency = 0.3;
    }

    const newPart: PartListItem = {
        id: uuidv4(),
        partType: 'curve',
        config: { ...currentConfig }, 
        quantity: currentPartQuantity,
        singlePartAreaM2: singlePartAreaM2,
        numSplits: numSplitsValue,
        itemIdealEfficiency: itemIdealEfficiency
    };

    setPartsList(prevList => [...prevList, newPart]);
    
    // Reset configurator to default empty state
    if (product) {
        const defaultConfigForReset = getDefaultConfig();
         product.parameters.forEach(param => {
          if (!Object.prototype.hasOwnProperty.call(defaultConfigForReset, param.id) || defaultConfigForReset[param.id] === undefined) {
            defaultConfigForReset[param.id] = param.defaultValue !== undefined ? param.defaultValue : '';
          }
        });
        setCurrentConfig(defaultConfigForReset);
    } else {
        setCurrentConfig(getDefaultConfig());
    }
    setCurrentPartQuantity(1);

  }, [currentConfig, currentPartQuantity, splitInfo, product, isConfigIncomplete, actualInnerRadius, actualOuterRadius]); // Removed materials

  const handleDeletePart = useCallback((idToDelete: string) => {
      setPartsList(prevList => prevList.filter(part => part.id !== idToDelete));
  }, []);
  
  const handleCheckout = useCallback(() => {
      console.log("Proceeding to Checkout with:");
      console.log("Parts:", partsList);
      console.log("Totals:", totalPriceDetails);
      alert("Checkout initiated! Check console for details.");
  }, [partsList, totalPriceDetails]);

  const handleReset = useCallback(() => {
    if (product) {
        const defaultConfigForReset = getDefaultConfig();
         product.parameters.forEach(param => {
          if (!Object.prototype.hasOwnProperty.call(defaultConfigForReset, param.id) || defaultConfigForReset[param.id] === undefined) {
            defaultConfigForReset[param.id] = param.defaultValue !== undefined ? param.defaultValue : '';
          }
        });
        setCurrentConfig(defaultConfigForReset);
    } else {
        setCurrentConfig(getDefaultConfig());
    }
    setCurrentPartQuantity(1);
    setPartsList([]);
    setTotalPriceDetails(null);
    setTotalTurnaround(null);
  }, [product]);

  // --- Visualizer Props Extraction ---
  const visualizerInnerRadius = actualInnerRadius; // Always pass actual inner radius to visualizer
  const visualizerWidth = isConfigIncomplete ? W_PLACEHOLDER : Number(currentConfig.width);
  const visualizerAngle = effectiveAngle; // Already derived from currentConfig or placeholder
  
  let currentMaterialThickness = THICKNESS_PLACEHOLDER; 
  const materialId = currentConfig.material as string;
  if (!isConfigIncomplete && materials && materialId && materialId !== '') {
      const material = materials.find(m => m.id === materialId);
      if (material) currentMaterialThickness = material.thickness_mm;
  } // Else, it remains THICKNESS_PLACEHOLDER (if isConfigIncomplete or no material selected)
  
  // --- Loading and Error States (remain the same) ---
  if (isLoading && !product) { // Adjusted loading condition
    return <div className="p-8 text-center">Loading Curves configuration...</div>;
  }
  if (error && !product) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }
  if (!product) { // If still no product after loading attempt (and no error shown)
    return <div className="p-8 text-center">No product configuration available. Please try refreshing.</div>;
  }
  
  // const visualizerRadiusValue = isConfigIncomplete ? R_PLACEHOLDER : Number(currentConfig.specifiedRadius); // Removed unused variable
  // const visualizerWidthValue = isConfigIncomplete ? W_PLACEHOLDER : Number(currentConfig.width); // Removed unused variable
  // const visualizerAngleValue = isConfigInincomplete ? A_PLACEHOLDER : Number(currentConfig.angle); // Removed unused variable


  // --- JSX Structure Update ---
  return (
    <div className="flex h-screen flex-col text-foreground"> 
      <div className="mb-1 mt-4 flex items-center px-4 md:px-8 flex-shrink-0"> 
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2 h-10 w-10"> 
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-2">
          <CircleDashed className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Radius and Curves</h1>
        </div>
      </div>

      <div className="flex flex-grow gap-6 md:flex-row-reverse flex-col overflow-hidden px-4 md:px-8 pb-4"> 
        <aside className="w-full md:w-[30rem] lg:w-[36rem] flex-shrink-0 flex flex-col gap-4"> 
          <div className="flex-shrink-0 rounded-md border border-border bg-card p-4 space-y-4"> 
            <h2 className="text-lg font-semibold mb-2">Configure New Part</h2>
            {isLoading && !product ? ( // Show loading in form area if product is still loading
              <div>Loading form...</div>
            ) : product ? ( // Only render form if product definition is available
              <CurvesBuilderForm
                product={product}
                initialConfig={currentConfig} 
                onConfigChange={handleConfigChange}
                onFieldFocusChange={handleFieldFocusChange}
                splitInfo={splitInfo} 
                setSplitLinesHovered={setSplitLinesHovered}
                quantity={currentPartQuantity}
                onQuantityChange={handleCurrentPartQuantityChange}
              />
            ) : (
               <div>Could not load product definition for the form.</div> // Fallback if product is null after load attempt
            )}

            <Button 
                onClick={handleAddPart}
                disabled={isLoading || !!error || isConfigIncomplete} // Disable if loading, error, or config incomplete
                className="w-full mt-2"
            >
                <PlusCircle className="mr-2 h-4 w-4"/>
                Add Part to Sheet
            </Button>
          </div>

          <ScrollArea className="flex-grow rounded-md border border-border bg-card p-4 min-h-0"> 
            <div className="space-y-4">
                {/* Parts List */} 
                <div>
                    <h2 className="text-lg font-semibold mb-3">Parts Added to Sheet</h2>
                    {partsList.length === 0 ? (
                        <p className="text-sm text-muted-foreground\">No parts added yet.</p>
                    ) : (
                        <ul className="space-y-2">
                            {partsList.map((part, index) => (
                                <li key={part.id} className="flex justify-between items-center text-sm border-b border-dashed border-border pb-1">
                                    <span>
                                        {`${index + 1}. R:${part.config.specifiedRadius} W:${part.config.width} A:${part.config.angle}° (Qty: ${part.quantity})`}
                                        {part.numSplits > 1 && <span className="text-xs text-orange-500 ml-1">(Split x{part.numSplits})</span>}
                                    </span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeletePart(part.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <Separator/>
                {/* Pricing Summary */} 
                <div>
                    <h2 className="text-lg font-semibold mb-3">Order Summary</h2>
                    {totalPriceDetails ? (
                        <div className="space-y-2 text-sm">
                            {Object.entries(totalPriceDetails.sheetsByMaterial).map(([matId, count]) => (
                                <div key={matId} className="flex justify-between items-center">
                                    <div className="flex items-center text-muted-foreground">
                                      <Sheet className="h-4 w-4 mr-2" /> 
                                      {materials?.find(m=>m.id===matId)?.name || matId} ({count} sheet{count !== 1 ? 's' : ''})
                                    </div>
                                </div>
                            ))}
                             <Separator className="my-1" />
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground\">Material Cost</span>
                                <span className="font-medium text-foreground\">${totalPriceDetails.materialCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                 <span className="text-muted-foreground\">Manufacturing Cost</span>
                                <span className="font-medium text-foreground\">${totalPriceDetails.manufactureCost.toFixed(2)}</span>
                            </div>
                             <Separator className="my-1" />
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground\">Subtotal</span>
                                <span className="font-medium text-foreground\">${totalPriceDetails.subTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground\">GST</span>
                                <span className="font-medium text-foreground\">${totalPriceDetails.gstAmount.toFixed(2)}</span>
                            </div>
                            <Separator className="my-2 font-bold" />
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-base font-semibold text-foreground\">Total Price:</span>
                                <span className="text-xl font-bold text-foreground\">${totalPriceDetails.totalIncGST.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground\">Estimated Turnaround:</span>
                                <span className="font-medium text-foreground">
                                    {totalTurnaround ? `${totalTurnaround} Day${totalTurnaround !== 1 ? 's' : ''}` : 'N/A'}
                                </span>
                            </div>
                            <div className="mt-4 flex flex-col space-y-2 pt-4 border-t border-border">
                                <Button
                                    variant="ghost"
                                    onClick={handleReset}
                                    className="w-full text-muted-foreground hover:bg-muted hover:text-foreground"
                                    size="sm"
                                >
                                    <RotateCcw className="mr-1 h-4 w-4" /> Reset Order
                                </Button>
                                <Button
                                    onClick={handleCheckout} 
                                    disabled={partsList.length === 0}
                                >
                                    Proceed to Checkout
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground\">Add parts to see pricing.</p>
                    )}
                </div>
            </div>
          </ScrollArea>
        </aside>

        <main className="flex-grow relative rounded-lg border border-border bg-muted/40 flex flex-col items-center justify-center min-h-[350px] md:min-h-0">
          <CurvesVisualizer
            radius={visualizerInnerRadius} // Pass calculated actualInnerRadius
            width={visualizerWidth}
            angle={visualizerAngle}
            materialThickness={currentMaterialThickness}
            arcLength={derivedMeasurements.arcLength} 
            chordLength={derivedMeasurements.chordLength} 
            showDimensions={true} 
            isPlaceholderMode={isConfigIncomplete} 
            activeFieldHighlight={focusedField} 
            isTooLarge={splitInfo.isTooLarge} 
            numSplits={splitInfo.numSplits} 
            splitLinesHovered={splitLinesHovered}
          />
          
          {splitInfo.isTooLarge && !isConfigIncomplete && ( // Only show split warning if not in placeholder mode
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