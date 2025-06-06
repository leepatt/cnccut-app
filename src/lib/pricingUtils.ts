export interface EfficiencyDataPoint {
  radius: number; // in mm
  angle: number;  // in degrees
  width: number;  // in mm
  efficiency: number; // decimal, e.g., 0.65 for 65%
}

export const CURVE_EFFICIENCY_RATES: EfficiencyDataPoint[] = [
  // 90-degree angle data (width: 100mm)
  { radius: 200, angle: 90, width: 100, efficiency: 0.65 },
  { radius: 400, angle: 90, width: 100, efficiency: 0.58 },
  { radius: 600, angle: 90, width: 100, efficiency: 0.42 },
  { radius: 800, angle: 90, width: 100, efficiency: 0.44 },
  { radius: 1000, angle: 90, width: 100, efficiency: 0.38 },
  { radius: 1200, angle: 90, width: 100, efficiency: 0.34 },
  { radius: 1400, angle: 90, width: 100, efficiency: 0.39 },
  { radius: 1600, angle: 90, width: 100, efficiency: 0.25 },

  // 180-degree angle data (width: 100mm)
  { radius: 200, angle: 180, width: 100, efficiency: 0.30 },
  { radius: 400, angle: 180, width: 100, efficiency: 0.37 },
  { radius: 600, angle: 180, width: 100, efficiency: 0.20 },
  { radius: 800, angle: 180, width: 100, efficiency: 0.18 },
];

// Constants for width adjustment mechanism
const REFERENCE_WIDTH_MM = 100;
const WIDTH_ADJUSTMENT_SENSITIVITY = 0.5; // Example: 10% width diff from ref -> 5% efficiency diff (inverse)
const MIN_WIDTH_ADJUSTMENT_FACTOR = 0.7;  // Min multiplier for efficiency due to width
const MAX_WIDTH_ADJUSTMENT_FACTOR = 1.3;  // Max multiplier for efficiency due to width

export function calculateNestingEfficiency(
    radius: number,
    actualWidth: number, // Explicitly named to distinguish from reference width in dataset
    angle: number,
    dataset: EfficiencyDataPoint[]
): number {
    const MIN_EFFICIENCY = 0.05;
    const MAX_EFFICIENCY = 0.95;
    const DEFAULT_EFFICIENCY = 0.3; // Fallback efficiency

    // Filter dataset for the given angle.
    // The provided dataset is assumed to be for REFERENCE_WIDTH_MM.
    const relevantData = dataset.filter(dp => dp.angle === angle /* && dp.width === REFERENCE_WIDTH_MM */);

    let baseEfficiencyAtRefWidth: number;

    if (relevantData.length === 0) {
        console.warn(`No base efficiency data found for angle: ${angle} at reference width ${REFERENCE_WIDTH_MM}mm. Using default efficiency before width adjustment.`);
        baseEfficiencyAtRefWidth = DEFAULT_EFFICIENCY;
    } else {
        relevantData.sort((a, b) => a.radius - b.radius);

        const exactMatch = relevantData.find(dp => dp.radius === radius);
        if (exactMatch) {
            baseEfficiencyAtRefWidth = exactMatch.efficiency;
        } else if (relevantData.length === 1) {
            baseEfficiencyAtRefWidth = relevantData[0].efficiency;
        } else {
            // Interpolation / Extrapolation based on radius
            if (radius < relevantData[0].radius) {
                // Extrapolate below smallest radius (using first two points)
                const r1 = relevantData[0].radius;
                const e1 = relevantData[0].efficiency;
                const r2 = relevantData[1].radius;
                const e2 = relevantData[1].efficiency;
                if (r2 === r1) { // Should not happen with distinct sorted points, but safety
                    baseEfficiencyAtRefWidth = e1;
                } else {
                    baseEfficiencyAtRefWidth = e1 + (radius - r1) * (e2 - e1) / (r2 - r1);
                }
            } else if (radius > relevantData[relevantData.length - 1].radius) {
                // Extrapolate above largest radius (using last two points)
                const rN_minus_1 = relevantData[relevantData.length - 2].radius;
                const eN_minus_1 = relevantData[relevantData.length - 2].efficiency;
                const rN = relevantData[relevantData.length - 1].radius;
                const eN = relevantData[relevantData.length - 1].efficiency;
                if (rN === rN_minus_1) { // Safety for identical points
                    baseEfficiencyAtRefWidth = eN;
                } else {
                    baseEfficiencyAtRefWidth = eN_minus_1 + (radius - rN_minus_1) * (eN - eN_minus_1) / (rN - rN_minus_1);
                }
            } else {
                // Interpolate between two radii
                let r1 = 0, e1 = 0, r2 = 0, e2 = 0;
                let found = false;
                for (let i = 0; i < relevantData.length - 1; i++) {
                    if (radius >= relevantData[i].radius && radius <= relevantData[i+1].radius) {
                        r1 = relevantData[i].radius;
                        e1 = relevantData[i].efficiency;
                        r2 = relevantData[i+1].radius;
                        e2 = relevantData[i+1].efficiency;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    // Fallback if interpolation range not found (e.g., radius is outside all segments but not caught by extrapolation)
                    // This can happen if relevantData has >= 2 points, but radius isn't between any pair,
                    // nor strictly outside the min/max of the whole set. This implies an issue with data or logic flow.
                    // As a robust fallback, find the point with the closest radius.
                    console.warn(`Interpolation range not found for radius ${radius}, angle ${angle}. Using efficiency of the closest radius point.`);
                    let closestPoint = relevantData[0];
                    let minDiff = Math.abs(radius - closestPoint.radius);
                    for(let i = 1; i < relevantData.length; i++) {
                        const diff = Math.abs(radius - relevantData[i].radius);
                        if(diff < minDiff) {
                            minDiff = diff;
                            closestPoint = relevantData[i];
                        }
                    }
                    baseEfficiencyAtRefWidth = closestPoint.efficiency;
                } else if (r2 === r1) { // If points have same radius, use first one's efficiency
                    baseEfficiencyAtRefWidth = e1;
                } else {
                    baseEfficiencyAtRefWidth = e1 + (radius - r1) * (e2 - e1) / (r2 - r1);
                }
            }
        }
    }

    // Ensure base efficiency is not NaN before clamping and adjustment
    if (isNaN(baseEfficiencyAtRefWidth)) {
        console.warn(`Base efficiency calculation resulted in NaN for radius=${radius}, angle=${angle}. Using default efficiency before width adjustment.`);
        baseEfficiencyAtRefWidth = DEFAULT_EFFICIENCY;
    }
    
    // Clamp the calculated base efficiency (from data or default) before width adjustment
    baseEfficiencyAtRefWidth = Math.max(MIN_EFFICIENCY, Math.min(MAX_EFFICIENCY, baseEfficiencyAtRefWidth));

    // --- Width Adjustment ---
    let widthAdjustmentFactor = 1.0;
    if (REFERENCE_WIDTH_MM > 0 && actualWidth > 0) {
        const widthRatio = actualWidth / REFERENCE_WIDTH_MM;
        // Inverse relationship: if actualWidth > REFERENCE_WIDTH_MM, factor < 1 (lower efficiency)
        // if actualWidth < REFERENCE_WIDTH_MM, factor > 1 (higher efficiency)
        widthAdjustmentFactor = 1 - WIDTH_ADJUSTMENT_SENSITIVITY * (widthRatio - 1);
        // Clamp the adjustment factor itself
        widthAdjustmentFactor = Math.max(MIN_WIDTH_ADJUSTMENT_FACTOR, Math.min(MAX_WIDTH_ADJUSTMENT_FACTOR, widthAdjustmentFactor));
    } else if (actualWidth <= 0) {
        console.warn(`Invalid actualWidth (${actualWidth}mm) provided for efficiency calculation. No width adjustment will be applied.`);
    }
    // If REFERENCE_WIDTH_MM is invalid (e.g., 0), no adjustment is made either.

    let finalCalculatedEfficiency = baseEfficiencyAtRefWidth * widthAdjustmentFactor;

    // Clamp the final overall efficiency
    finalCalculatedEfficiency = Math.max(MIN_EFFICIENCY, Math.min(MAX_EFFICIENCY, finalCalculatedEfficiency));

    if (isNaN(finalCalculatedEfficiency)) {
        console.error(`Final efficiency calculation resulted in NaN for radius=${radius}, angle=${angle}, actualWidth=${actualWidth}. Returning default.`);
        return DEFAULT_EFFICIENCY;
    }

    return finalCalculatedEfficiency;
} 