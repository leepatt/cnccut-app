"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
// Keep RadiusVisualizer import removed or commented if it's rendered by parent
// import RadiusVisualizer from './RadiusVisualizer';
import {
    MATERIAL_RATES,
    INITIAL_MATERIAL_ID,
    GST_RATE,
    SHOPIFY_VARIANT_ID,
    SHEET_AREA,
    USABLE_SHEET_LENGTH,
    USABLE_SHEET_WIDTH,
    EFFICIENCY,
    MANUFACTURE_RATE,
    MANUFACTURE_AREA_RATE,
    PLACEHOLDERS
} from '@/lib/cncConstants';

// --- Types ---
interface RadiusRowData {
  id: number;
  radius: string;
  width: string;
  angle: string;
  arcLength: string;
  chordLength: string;
  qty: string;
  isTooLarge: boolean;
  numSplits: number;
}

interface SummaryData {
  area: string;
  sheets: number;
  manufactureCost: string;
  materialCost: string;
  subTotal: string;
  gstAmount: string;
  totalIncGST: string;
}

// Type for the state passed up to the parent
export interface RadiusBuilderState {
    rows: RadiusRowData[];
    material: string;
    selectedIndex: number;
    selectedRowData: RadiusRowData | null;
    summary: SummaryData;
    isAddingToCart: boolean;
    handleAddToCart: () => Promise<void>; // Pass the handler function itself
    // Add any other state the parent might need
}

// --- Component Props ---
interface RadiusBuilderProps {
  onStateChange: (newState: RadiusBuilderState) => void;
}

export default function RadiusBuilder({ onStateChange }: RadiusBuilderProps) {
  const [rows, setRows] = useState<RadiusRowData[]>([
    { id: Date.now(), radius: '', width: '', angle: '', arcLength: '', chordLength: '', qty: '1', isTooLarge: false, numSplits: 1 }
  ]);
  const [material, setMaterial] = useState<string>(INITIAL_MATERIAL_ID);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);

  // --- Derived State: Summary (keep this calculation internal) ---
  const summary = useMemo<SummaryData>(() => {
    let totalArea = 0;
    rows.forEach((row) => {
        const r = parseFloat(row.radius);
        const w = parseFloat(row.width);
        const a = parseFloat(row.angle);
        const q = parseInt(row.qty, 10);

        if (!isNaN(r) && r > 0 && !isNaN(w) && w >= 0 && !isNaN(a) && a > 0 && a <= 360 && !isNaN(q) && q > 0) {
            const outerR = r + w;
            const outerAreaSector = (Math.PI * (outerR ** 2) * a) / 360;
            const innerAreaSector = (Math.PI * (r ** 2) * a) / 360;
            const areaPerPart = (outerAreaSector - innerAreaSector) / 1_000_000; // Convert mm^2 to m^2
            totalArea += (areaPerPart * q);
        }
    });

    const sheets = totalArea > 0 ? Math.ceil(totalArea / (SHEET_AREA * EFFICIENCY)) : 0;
    const materialInfo = MATERIAL_RATES[material] || { price: 0 };
    const materialCost = sheets * materialInfo.price;
    const manufactureCost = sheets * MANUFACTURE_RATE + totalArea * MANUFACTURE_AREA_RATE;
    const subTotal = materialCost + manufactureCost;
    const gstAmount = subTotal * GST_RATE;
    const totalIncGST = subTotal + gstAmount;

    return {
        area: totalArea.toFixed(2),
        sheets: sheets,
        manufactureCost: manufactureCost.toFixed(2),
        materialCost: materialCost.toFixed(2),
        subTotal: subTotal.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        totalIncGST: totalIncGST.toFixed(2),
    };
  }, [rows, material]);

  // --- Handlers (keep internal logic) ---
  const handleAddRow = useCallback(() => {
    setRows(prevRows => [
      ...prevRows,
      { id: Date.now(), radius: '', width: '', angle: '', arcLength: '', chordLength: '', qty: '1', isTooLarge: false, numSplits: 1 }
    ]);
    setSelectedIndex(rows.length); // Select the new row (index will be current length before adding)
  }, [rows.length]);

  const handleRemoveRow = useCallback((indexToRemove: number) => {
    setRows(prevRows => {
      const newRows = prevRows.filter((_, index) => index !== indexToRemove);
      if (newRows.length === 0) {
        return [{ id: Date.now(), radius: '', width: '', angle: '', arcLength: '', chordLength: '', qty: '1', isTooLarge: false, numSplits: 1 }];
      }
      return newRows;
    });
    setSelectedIndex(prevIndex => {
      if (prevIndex === indexToRemove) {
        return Math.max(0, prevIndex - 1);
      } else if (prevIndex > indexToRemove) {
        return prevIndex - 1;
      }
      return prevIndex;
    });
  }, []);

  const handleUpdateRowValue = useCallback((index: number, field: keyof RadiusRowData, value: string) => {
    setRows(prevRows => {
        const newRows = [...prevRows];
        const rowToUpdate = { ...newRows[index] };

        if (field === 'qty') {
            const qtyVal = parseInt(value, 10);
             rowToUpdate[field] = isNaN(qtyVal) || qtyVal < 1 ? '1' : value; // Basic validation for qty
        } else if (field === 'radius' || field === 'width' || field === 'angle' || field === 'arcLength' || field === 'chordLength') {
            const numVal = parseFloat(value);
            rowToUpdate[field] = (isNaN(numVal) || numVal < 0) ? '' : value; // Basic validation for dimensions
        } else {
            // For other fields like id, isTooLarge (if editable), handle appropriately
        }

        let r = parseFloat(field === 'radius' ? value : rowToUpdate.radius);
        let w = parseFloat(field === 'width' ? value : rowToUpdate.width);
        let a = parseFloat(field === 'angle' ? value : rowToUpdate.angle);
        let arcL = parseFloat(field === 'arcLength' ? value : rowToUpdate.arcLength);
        let chordL = parseFloat(field === 'chordLength' ? value : rowToUpdate.chordLength);
        r = isNaN(r) ? 0 : r; w = isNaN(w) ? 0 : w; a = isNaN(a) ? 0 : a; arcL = isNaN(arcL) ? 0 : arcL; chordL = isNaN(chordL) ? 0 : chordL;
        const outerRadius = r + w;

        if (outerRadius > 0) {
            if (field === 'angle' && a > 0 && a <= 360) {
                 const a_rad = a * Math.PI / 180;
                 rowToUpdate.arcLength = ((Math.PI * outerRadius * a) / 180).toFixed(2);
                 rowToUpdate.chordLength = (2 * outerRadius * Math.sin(a_rad / 2)).toFixed(2);
            } else if (field === 'arcLength' && arcL > 0) {
                const angle_rad = arcL / outerRadius;
                const newAngle = angle_rad * (180 / Math.PI);
                if (newAngle > 0 && newAngle <= 360) {
                    rowToUpdate.angle = newAngle.toFixed(2);
                    rowToUpdate.chordLength = (2 * outerRadius * Math.sin(angle_rad / 2)).toFixed(2);
                } else { rowToUpdate.angle = ''; rowToUpdate.chordLength = ''; }
            } else if (field === 'chordLength' && chordL > 0 && chordL <= 2 * outerRadius) {
                const angle_rad = 2 * Math.asin(chordL / (2 * outerRadius));
                const newAngle = angle_rad * (180 / Math.PI);
                 if (newAngle > 0 && newAngle <= 360) {
                    rowToUpdate.angle = newAngle.toFixed(2);
                    rowToUpdate.arcLength = (outerRadius * angle_rad).toFixed(2);
                } else { rowToUpdate.angle = ''; rowToUpdate.arcLength = ''; }
            } else if (field === 'radius' || field === 'width') {
                a = parseFloat(rowToUpdate.angle);
                if (!isNaN(a) && a > 0 && a <= 360) {
                    const a_rad = a * Math.PI / 180;
                    rowToUpdate.arcLength = ((Math.PI * outerRadius * a) / 180).toFixed(2);
                    rowToUpdate.chordLength = (2 * outerRadius * Math.sin(a_rad / 2)).toFixed(2);
                } else { rowToUpdate.arcLength = ''; rowToUpdate.chordLength = ''; }
            }
             if ((field === 'angle' || field === 'arcLength' || field === 'chordLength') && value === '') {
                 if (field !== 'angle') rowToUpdate.angle = '';
                 if (field !== 'arcLength') rowToUpdate.arcLength = '';
                 if (field !== 'chordLength') rowToUpdate.chordLength = '';
             }
        } else { rowToUpdate.angle = ''; rowToUpdate.arcLength = ''; rowToUpdate.chordLength = ''; }

        rowToUpdate.isTooLarge = false;
        rowToUpdate.numSplits = 1;
        a = parseFloat(rowToUpdate.angle);
        if (!isNaN(a) && a > 0 && a <= 360 && outerRadius > 0) {
            const R = outerRadius;
            const a_rad = a * Math.PI / 180;
            const chordLengthOuter = 2 * R * Math.sin(a_rad / 2);
            const sagittaOuter = R * (1 - Math.cos(a_rad / 2));
            const partHeight = (a <= 180) ? sagittaOuter : (w > 0 && r === 0) ? R : (w > 0 && r > 0) ? sagittaOuter + w : sagittaOuter;
            const fitsNormally = (chordLengthOuter <= USABLE_SHEET_LENGTH && partHeight <= USABLE_SHEET_WIDTH);
            const fitsRotated = (chordLengthOuter <= USABLE_SHEET_WIDTH && partHeight <= USABLE_SHEET_LENGTH);
            if (!fitsNormally && !fitsRotated) {
                rowToUpdate.isTooLarge = true;
                const splitsLength = Math.max(1, Math.ceil(chordLengthOuter / USABLE_SHEET_LENGTH));
                const splitsHeight = Math.max(1, Math.ceil(partHeight / USABLE_SHEET_WIDTH));
                rowToUpdate.numSplits = Math.max(2, splitsLength, splitsHeight);
                console.warn(`Part too large. Approx splits: ${rowToUpdate.numSplits}.`);
            }
        }
        newRows[index] = rowToUpdate;
        return newRows;
    });
  }, []);

  const handleFocusRow = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleMaterialChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setMaterial(event.target.value);
  }, []);

  // Keep AddToCart logic here, but it will be passed up
  const handleAddToCart = useCallback(async () => {
    setIsAddingToCart(true);
    const properties: { [key: string]: string | number } = {
        'Material': MATERIAL_RATES[material]?.name || 'Unknown',
        'Total Area (m²)': summary.area,
        'Sheets Required': summary.sheets,
        'Manufacture Cost': `$${summary.manufactureCost}`,
        'Material Cost': `$${summary.materialCost}`
    };
    let validRowCount = 0;
    rows.forEach((row) => {
        const r = parseFloat(row.radius);
        const w = parseFloat(row.width);
        const a = parseFloat(row.angle);
        const q = parseInt(row.qty, 10);
        const isValid = !isNaN(r) && r > 0 && !isNaN(w) && w >= 0 && !isNaN(a) && a > 0 && a <= 360 && !isNaN(q) && q > 0;
        if (isValid) {
            validRowCount++;
            properties[`Part ${validRowCount}`] = `R: ${r.toFixed(1)}mm, W: ${w.toFixed(1)}mm, θ: ${a.toFixed(1)}°, Qty: ${q}${row.isTooLarge ? ` (SPLIT x${row.numSplits})` : ''}`;
        }
    });
    if (validRowCount === 0) {
        alert("Please enter at least one valid part configuration."); setIsAddingToCart(false); return;
    }
    const totalPrice = parseFloat(summary.totalIncGST);
     if (isNaN(totalPrice) || totalPrice <= 0) {
         alert("Cannot add item with zero or invalid price."); setIsAddingToCart(false); return;
    }
    const quantityToAdd = Math.round(totalPrice * 100);
    const formData = { 'items': [{ 'id': SHOPIFY_VARIANT_ID, 'quantity': quantityToAdd, 'properties': properties }] };
    console.log("Sending to Shopify:", JSON.stringify(formData, null, 2));
    try {
        const response = await fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        if (!response.ok) {
            let errorData; try { errorData = await response.json(); } catch { console.error('Shopify Non-JSON Error Response:', await response.text()); }
            throw new Error(errorData?.description || errorData?.message || `HTTP error! status: ${response.status}`);
        }
        const json = await response.json(); console.log('Added to cart:', json); window.location.href = '/cart';
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error adding to cart:', error);
            alert(`Error adding item to cart: ${error.message}`);
        } else {
            console.error('Unknown error occurred:', error);
            alert('An unknown error occurred while adding item to cart.');
        }
        setIsAddingToCart(false);
    }
  }, [rows, material, summary]);

  // --- Selected Row Data (keep internal for state calculation) ---
  const selectedRowData = useMemo(() => rows[selectedIndex] || null, [rows, selectedIndex]);

  // --- Effect to pass state up ---
  useEffect(() => {
    const currentState: RadiusBuilderState = {
        rows,
        material,
        selectedIndex,
        selectedRowData,
        summary,
        isAddingToCart,
        handleAddToCart
    };
    onStateChange(currentState);
    // Specify dependencies for when to notify the parent
  }, [rows, material, selectedIndex, selectedRowData, summary, isAddingToCart, handleAddToCart, onStateChange]);


  // --- Render ONLY the controls --- (Visualizer/Summary/Actions removed)
  return (
    <div className="space-y-6">
      {/* --- Material Selection --- */}
      <div> {/* Wrap in div if needed */} 
        <label htmlFor="material-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Material:
        </label>
        <select
          id="material-select"
          name="material-select"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
          value={material}
          onChange={handleMaterialChange}
        >
          {Object.entries(MATERIAL_RATES).map(([id, { name, price }]) => (
            <option key={id} value={id}>
              {name} - ${price.toFixed(2)}/sheet
            </option>
          ))}
        </select>
      </div>

      {/* --- Input Rows --- */}
      <div className="mb-4">
        <div className="grid grid-cols-12 gap-2 items-center px-2 py-1 text-sm font-medium text-gray-500 border-b border-gray-200">
          <div className="col-span-2">Radius (r)</div>
          <div className="col-span-2">Width (w)</div>
          <div className="col-span-2">Angle (θ)</div>
          <div className="col-span-2">Arc Length (L)</div>
          <div className="col-span-2">Chord Length (c)</div>
          <div className="col-span-1">Qty</div>
          <div className="col-span-1 text-center">Action</div>
        </div>
        <div id="input-rows-container" className="space-y-2 mt-2">
          {rows.map((rowData, index) => (
            <div
              key={rowData.id}
              className={`grid grid-cols-12 gap-2 items-center p-2 rounded transition-colors duration-150 ${selectedIndex === index ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'}`}
              onFocus={() => handleFocusRow(index)} // Select row when any input inside gets focus
              tabIndex={-1}
            >
              {(['radius', 'width', 'angle', 'arcLength', 'chordLength'] as const).map((field) => (
                <input
                  key={field}
                  type="number"
                  min="0"
                  step="any"
                  aria-label={`${field} for row ${index + 1}`}
                  className="col-span-2 p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition duration-150 ease-in-out"
                  placeholder={PLACEHOLDERS[field]}
                  value={rowData[field]}
                  onChange={(e) => handleUpdateRowValue(index, field, e.target.value)}
                />
              ))}
              <input
                type="number"
                min="1"
                step="1"
                aria-label={`Quantity for row ${index + 1}`}
                className="col-span-1 p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition duration-150 ease-in-out"
                placeholder={PLACEHOLDERS.qty}
                value={rowData.qty}
                onChange={(e) => handleUpdateRowValue(index, 'qty', e.target.value)}
              />
              <button
                type="button"
                aria-label={`Remove row ${index + 1}`}
                title="Remove row"
                className="col-span-1 flex justify-center items-center text-white bg-red-600 hover:bg-red-700 px-2 py-1.5 rounded-md text-lg font-bold shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                onClick={() => handleRemoveRow(index)}
                disabled={rows.length <= 1}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* --- Add Row Button --- */}
      <div className="text-right">
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          + Add Another Part
        </button>
      </div>

      {/* Visualizer and Summary sections are removed from here, rendered by parent */}

    </div>
  );
} 