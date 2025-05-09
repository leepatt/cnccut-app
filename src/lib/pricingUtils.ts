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

export function calculateNestingEfficiency(
    radius: number, 
    width: number, 
    angle: number, 
    dataset: EfficiencyDataPoint[]
): number {
    const MIN_EFFICIENCY = 0.05;
    const MAX_EFFICIENCY = 0.95;

    // Filter Data: For now, assume input width will always be 100mm
    // If dataset evolves, filter by width here too.
    const relevantData = dataset.filter(dp => dp.angle === angle /* && dp.width === width */);

    if (relevantData.length === 0) {
        console.warn(`No efficiency data found for angle: ${angle}, width: ${width}. Using default efficiency.`);
        return 0.3; // Default conservative efficiency
    }

    relevantData.sort((a, b) => a.radius - b.radius);

    // Exact Match
    const exactMatch = relevantData.find(dp => dp.radius === radius);
    if (exactMatch) {
        return Math.max(MIN_EFFICIENCY, Math.min(MAX_EFFICIENCY, exactMatch.efficiency));
    }

    // Interpolation / Extrapolation
    if (relevantData.length === 1) {
        // Only one point for this angle, use its efficiency
        return Math.max(MIN_EFFICIENCY, Math.min(MAX_EFFICIENCY, relevantData[0].efficiency));
    }

    let calculatedEfficiency: number;

    if (radius < relevantData[0].radius) {
        // Extrapolate below smallest radius (using first two points)
        const r1 = relevantData[0].radius;
        const e1 = relevantData[0].efficiency;
        const r2 = relevantData[1].radius;
        const e2 = relevantData[1].efficiency;
        calculatedEfficiency = e1 + (radius - r1) * (e2 - e1) / (r2 - r1);
    } else if (radius > relevantData[relevantData.length - 1].radius) {
        // Extrapolate above largest radius (using last two points)
        const rN_minus_1 = relevantData[relevantData.length - 2].radius;
        const eN_minus_1 = relevantData[relevantData.length - 2].efficiency;
        const rN = relevantData[relevantData.length - 1].radius;
        const eN = relevantData[relevantData.length - 1].efficiency;
        calculatedEfficiency = eN_minus_1 + (radius - rN_minus_1) * (eN - eN_minus_1) / (rN - rN_minus_1);
    } else {
        // Interpolate between two radii
        let r1 = 0, e1 = 0, r2 = 0, e2 = 0;
        for (let i = 0; i < relevantData.length - 1; i++) {
            if (radius >= relevantData[i].radius && radius <= relevantData[i+1].radius) {
                r1 = relevantData[i].radius;
                e1 = relevantData[i].efficiency;
                r2 = relevantData[i+1].radius;
                e2 = relevantData[i+1].efficiency;
                break;
            }
        }
        if (r2 === r1) { // Should not happen if sorted and radius not an exact match, but for safety
            calculatedEfficiency = e1;
        } else {
            calculatedEfficiency = e1 + (radius - r1) * (e2 - e1) / (r2 - r1);
        }
    }

    // Clamp the final efficiency
    calculatedEfficiency = Math.max(MIN_EFFICIENCY, Math.min(MAX_EFFICIENCY, calculatedEfficiency));

    // Handle potential NaN from division by zero if r2===r1 wasn't caught somehow
    if (isNaN(calculatedEfficiency)) {
        console.error(`NaN calculated for efficiency: radius=${radius}, angle=${angle}, width=${width}. Returning default.`);
        return 0.3; 
    }

    return calculatedEfficiency;
} 