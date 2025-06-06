# Perforated Panel Configurator

A comprehensive system for designing and ordering custom perforated panels with real-time 3D visualization and dynamic pricing.

## System Architecture

### Core Components

#### 1. PerfCustomizer.tsx (Main Orchestrator)
The central component that manages the entire configuration experience:

**Key Responsibilities:**
- State Management:
  - Product definition and configuration
  - Price calculations
  - Material data
  - Turnaround time estimates
- Business Logic:
  - Dynamic pricing based on:
    - Material costs (using MATERIAL_RATES)
    - Manufacturing complexity
    - Area-based calculations
    - GST handling
  - Sheet optimization
  - Configuration validation
- Component Coordination:
  - Form and visualizer synchronization
  - Quote generation
  - Cart integration

**State Structure:**
```typescript
interface PriceDetails {
    materialCost: number;
    manufactureCost: number;
    subTotal: number;
    gstAmount: number;
    totalIncGST: number;
    sheets: number;
}

interface State {
    product: ProductDefinition | null;
    currentConfig: ProductConfiguration;
    priceDetails: PriceDetails | null;
    turnaround: number | null;
    isLoading: boolean;
    error: string | null;
}
```

#### 2. PerfBuilderForm.tsx (Configuration Interface)
The form component handling user input and validation:

**Key Features:**
- Dynamic Parameter Types:
  - Number inputs (dimensions, sizes)
  - Button groups (pattern selection)
  - Select dropdowns (materials)
  - Adjusters (row/column controls)
- Material Management:
  - Async material data fetching
  - Error handling
  - Loading states
- Validation Rules:
  - Min/max constraints
  - Step validation
  - Pattern-specific rules
- Conditional Rendering:
  - Slot-specific controls
  - Pattern limitations

**Parameter Types:**
```typescript
interface BaseParameter {
    id: string;
    label: string;
    type: string;
    defaultValue: any;
    description?: string;
}

interface NumberParameter extends BaseParameter {
    type: 'number';
    min: number;
    max: number;
    step: number;
}

interface ButtonGroupParameter extends BaseParameter {
    type: 'button-group';
    options: Array<{value: string, label: string}>;
}

interface SelectParameter extends BaseParameter {
    type: 'select';
    optionsSource?: 'materials';
    options?: Array<{value: string, label: string}>;
}

interface AdjusterParameter extends BaseParameter {
    type: 'adjuster';
    min: number;
    max: number;
    step: number;
}
```

#### 3. PerfVisualizer.tsx (3D Visualization)
Real-time 3D preview component using Three.js:

**Features:**
- Pattern Types:
  - Grid: Regular matrix pattern
  - Diagonal: 60° offset pattern
  - Radial: Circular pattern
- Opening Types:
  - Circles: Simple circular holes
  - Slots: Elongated openings with rotation
- Camera Controls:
  - Orbit: Free 3D rotation
  - Top view
  - Front view
  - Side view
- Dynamic Updates:
  - Real-time pattern generation
  - Responsive to configuration changes
  - Performance optimized rendering

**Pattern Generation Logic:**
```typescript
interface HolePattern {
    pattern: 'grid' | 'diagonal' | 'radial';
    holeType: 'circle' | 'slot';
    width: number;
    height: number;
    holeSize: number;
    spacing: number;
    slotLength?: number;
    slotRotation?: 'horizontal' | 'vertical';
    additionalRows: number;
    additionalColumns: number;
}
```

## Technical Implementation

### 1. Dependencies
```json
{
  "dependencies": {
    "@react-three/fiber": "^8.0.0",
    "@react-three/drei": "^9.0.0",
    "three": "^0.150.0",
    "react": "^18.0.0",
    "lucide-react": "^0.260.0"
  }
}
```

### 2. Constants and Configuration
```typescript
const MATERIAL_RATES: Record<string, number> = {
    // Material ID to price per m² mapping
};

const MANUFACTURE_RATE = 100; // Base manufacturing rate
const MANUFACTURE_AREA_RATE = 50; // Per m² manufacturing rate
const GST_RATE = 0.1; // 10% GST
```

### 3. API Integration

**Required Endpoints:**
- `/api/products/perforated-panels`: Product definition
- `/api/materials`: Available materials
- `/api/quote`: Quote generation (optional)

**Response Structures:**
```typescript
interface Material {
    id: string;
    name: string;
    rate: number;
    thickness: number;
}

interface ProductDefinition {
    id: string;
    name: string;
    description: string;
    parameters: ProductParameter[];
}
```

### 4. State Management Flow

1. Configuration Update:
```typescript
const handleConfigChange = (newConfig: ProductConfiguration) => {
    setCurrentConfig(newConfig);
    calculatePricing(newConfig);
    updateVisualization(newConfig);
};
```

2. Price Calculation:
```typescript
const calculatePricing = (config: ProductConfiguration) => {
    const area = (config.width * config.height) / 1000000;
    const materialCost = area * MATERIAL_RATES[config.material];
    const complexityFactor = getComplexityFactor(config);
    const manufactureCost = area * MANUFACTURE_AREA_RATE * complexityFactor;
    // ... additional calculations
};
```

3. Pattern Generation:
```typescript
const generatePattern = (config: ProductConfiguration) => {
    switch (config.pattern) {
        case 'grid':
            return generateGridPattern(config);
        case 'diagonal':
            return generateDiagonalPattern(config);
        case 'radial':
            return generateRadialPattern(config);
    }
};
```

## User Interface Guidelines

### 1. Form Layout
- Group related parameters
- Show/hide conditional fields
- Provide immediate feedback
- Use clear labels and descriptions

### 2. Visualization
- Maintain responsive performance
- Provide intuitive camera controls
- Show scale reference
- Update in real-time

### 3. Error Handling
- Validate input ranges
- Show clear error messages
- Prevent invalid configurations
- Handle API failures gracefully

## Building from Scratch

1. Setup Project:
   ```bash
   npx create-next-app@latest perforated-panel-configurator
   cd perforated-panel-configurator
   npm install @react-three/fiber @react-three/drei three
   ```

2. Create Component Structure:
   ```
   src/
   ├── components/
   │   └── cnc/
   │       └── perforated/
   │           ├── PerfCustomizer.tsx
   │           ├── PerfBuilderForm.tsx
   │           └── PerfVisualizer.tsx
   ```

3. Implement Core Components:
   - Start with PerfCustomizer
   - Add form components
   - Integrate 3D visualization
   - Add pricing logic

4. Setup API Routes:
   - Product definition
   - Materials endpoint
   - Quote generation

5. Add Testing:
   ```bash
   npm install --save-dev jest @testing-library/react
   ```

6. Deploy:
   - Build optimization
   - Performance testing
   - Browser compatibility

## Performance Considerations

1. Three.js Optimization:
   - Use geometry instancing for holes
   - Implement view frustum culling
   - Optimize render loop

2. State Management:
   - Debounce configuration updates
   - Memoize expensive calculations
   - Lazy load components

3. API Integration:
   - Implement caching
   - Handle loading states
   - Error boundaries

## Security Considerations

1. Input Validation:
   - Sanitize all user input
   - Validate on both client and server
   - Prevent XSS attacks

2. API Security:
   - Implement rate limiting
   - Validate authentication
   - Secure sensitive data

## Maintenance and Updates

1. Version Control:
   - Semantic versioning
   - Change documentation
   - Migration guides

2. Monitoring:
   - Error tracking
   - Performance metrics
   - Usage analytics

3. Documentation:
   - API documentation
   - Component storybook
   - Update guides 