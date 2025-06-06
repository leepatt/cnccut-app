# Perforated Panel Configurator Development Prompt

## Project Overview
Create a React-based web application for configuring and visualizing custom perforated panels. The application should allow users to design panels with various hole patterns, dimensions, and materials, while providing real-time 3D visualization and pricing calculations.

## Technical Requirements

### Core Technologies
- React 18+ with TypeScript
- Three.js with @react-three/fiber and @react-three/drei for 3D visualization
- Shadcn/ui component library for modern UI elements
- RESTful API integration for materials and product data
- Lucide React for icons

### Component Architecture

1. **Main Customizer Component (PerfCustomizer)**
   - Parent component managing overall state and layout
   - Handles price calculations using defined rate constants
   - Coordinates between form and visualizer components
   - Manages material data fetching
   - Implements quote actions and view controls
   - Key Features:
     - Real-time price calculation with GST
     - Material cost calculation based on area
     - Manufacturing cost calculation with complexity factors
     - Sheet quantity calculation
     - Turnaround time estimation
     - Save/load configuration
     - Add to cart functionality

2. **Builder Form Component (PerfBuilderForm)**
   - Dynamic form generation based on product parameters
   - Handles material data fetching and caching
   - Real-time validation and error handling
   - Conditional rendering of parameters
   - Input types:
     - Number inputs with min/max/step validation
     - Button groups for pattern/type selection
     - Select dropdowns for materials
     - Adjuster controls for row/column modification
   - Special handling for slot-specific parameters
   - Accessibility features with ARIA labels

3. **Visualizer Component (PerfVisualizer)**
   - Three.js-based 3D rendering with React Three Fiber
   - Multiple view angles with orbit controls
   - Support for different hole patterns:
     - Grid pattern with configurable spacing
     - Diagonal pattern with hexagonal arrangement
     - Radial pattern (placeholder)
   - Interactive camera controls
   - Real-time updates based on configuration
   - View control buttons for preset angles
   - Efficient hole pattern generation
   - Support for both circular holes and slots

## Feature Requirements

### Panel Configuration
- Width and height (100mm to 2400mm)
- Hole size (5mm to 100mm)
- Hole types:
  - Circular holes
  - Slots with configurable:
    - Length (20mm to 100mm)
    - Rotation (horizontal/vertical)
- Hole spacing (5mm to 100mm)
- Pattern options:
  - Grid (default)
  - Diagonal (hexagonal)
  - Radial (disabled for slots)
- Material selection from API
- Additional rows/columns adjustment (-5 to +5)

### Visualization Features
- Real-time 3D preview
- Multiple view angles:
  - Top view
  - Front view
  - Side view
  - 3D orbit view
- Interactive orbit controls
- True-to-scale representation
- Dynamic hole pattern generation
- Optimized rendering for large patterns

### Business Logic
- Material cost calculation:
  - Area-based pricing
  - Material rates from constants
- Manufacturing cost calculation:
  - Base rate per area
  - Complexity factors:
    - 1.25x for slots
    - Pattern-specific adjustments
- GST calculation (rate from constants)
- Sheet quantity calculation:
  - Based on standard 2.4m x 1.2m sheets
- Turnaround time estimation

### User Interface
- Responsive design with shadcn/ui components
- Intuitive form layout with:
  - Labeled inputs
  - Tooltips for descriptions
  - Error messages
  - Loading states
- Conditional form field visibility
- Save/load configurations
- Add to cart functionality
- View control buttons with icons

## Data Structure

### Product Definition
```typescript
interface ProductDefinition {
  id: string;
  name: string;
  description: string;
  parameters: Parameter[];
}

interface Parameter {
  id: string;
  label: string;
  type: 'number' | 'button-group' | 'select' | 'adjuster';
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string; }[];
  optionsSource?: string;
  description?: string;
}

interface Material {
  id: string;
  name: string;
  // Additional material properties
}
```

### Configuration State
```typescript
interface ProductConfiguration {
  width: number;
  height: number;
  holeSize: number;
  holeType: 'circle' | 'slot';
  slotLength?: number;
  slotRotation?: 'horizontal' | 'vertical';
  spacing: number;
  pattern: 'grid' | 'diagonal' | 'radial';
  material: string;
  additionalRows: number;
  additionalColumns: number;
}

interface PriceDetails {
  materialCost: number;
  manufactureCost: number;
  subTotal: number;
  gstAmount: number;
  totalIncGST: number;
  sheets: number;
}
```

## Constants

```typescript
const MATERIAL_RATES: { [key: string]: number } = {
  // Material ID to rate mapping
};

const MANUFACTURE_RATE = 100; // Base rate
const MANUFACTURE_AREA_RATE = 50; // Per square meter
const GST_RATE = 0.1; // 10%
```

## API Endpoints

1. `/api/products/perforated-panels`
   - GET: Fetches product definition
   - Response: ProductDefinition

2. `/api/materials`
   - GET: Fetches available materials
   - Response: Material[]

## Implementation Guidelines

1. **State Management**
   - Use React hooks for local state
   - Implement proper state updates and side effects
   - Handle loading and error states
   - Cache material data

2. **API Integration**
   - Implement error handling and fallbacks
   - Use placeholder data when API unavailable
   - Handle loading states gracefully

3. **3D Visualization**
   - Implement efficient hole pattern generation
   - Use proper Three.js geometry and materials
   - Optimize rendering performance
   - Handle different view angles
   - Implement proper camera controls

4. **Form Handling**
   - Implement real-time validation
   - Handle all input types
   - Provide clear feedback
   - Support configuration saving/loading
   - Handle conditional field visibility

5. **Price Calculation**
   - Implement material cost calculation
   - Calculate manufacturing costs with complexity
   - Handle GST calculations
   - Update in real-time
   - Calculate sheet quantities

## Testing Requirements
- Unit tests for components
- Integration tests for component interaction
- Visual regression tests
- Performance testing for 3D rendering
- Form validation tests
- Price calculation tests

## Performance Considerations
- Optimize 3D rendering with proper geometry
- Implement efficient hole pattern generation
- Handle large configurations gracefully
- Optimize API calls with caching
- Implement proper error boundaries

## Security Considerations
- Validate all user inputs
- Sanitize API responses
- Implement proper error handling
- Secure configuration storage
- Rate limit API calls

## Accessibility Requirements
- Keyboard navigation
- Screen reader support
- ARIA labels and descriptions
- Color contrast compliance
- Focus management
- Error announcements

## Documentation Requirements
- Component documentation
- API documentation
- State management documentation
- Usage examples
- Configuration guide
- Deployment instructions
