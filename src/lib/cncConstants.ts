// Material rates in $/m^2
export const MATERIAL_RATES: { [key: string]: number } = {
    '17': 50, // 17mm Formply
    '19': 65, // 19mm CD Ply
    '25': 85  // 25mm CD Ply
};

// export const INITIAL_MATERIAL_ID = Object.keys(MATERIAL_RATES)[0] || '17'; // No longer needed as material selection defaults in components

export const GST_RATE = 0.10;

// Consider managing this via environment variables or configuration
export const SHOPIFY_VARIANT_ID = 45300623343794;

// Sheet Dimensions & Properties (in mm and m^2)
// export const SHEET_AREA = 2.88; // m^2 // Now calculated dynamically or fallback in components
// export const USABLE_SHEET_LENGTH = 2390; // mm // Moved to materials.json
// export const USABLE_SHEET_WIDTH = 1190; // mm // Moved to materials.json
export const EFFICIENCY = 0.5; // Nesting efficiency factor (remains as per user instruction)

// Manufacturing Rates
export const MANUFACTURE_RATE = 80; // $/sheet
export const MANUFACTURE_AREA_RATE = 20; // $/m^2

// Visualizer Defaults & Settings
export const SVG_VIEW_SIZE = 400; // pixels
export const SVG_PADDING = 25; // pixels
export const DEFAULT_VISUALIZER_DIMENSIONS = { r: 900, w: 90, a: 90 }; // mm/deg

// Input Placeholders
export const PLACEHOLDERS = {
    radius: 'mm', width: 'mm', angle: 'deg',
    arcLength: 'mm', chordLength: 'mm', qty: '',
}; 