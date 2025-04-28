import React, { useMemo, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box as DreiBox } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Orbit, Square, RectangleHorizontal, RectangleVertical } from 'lucide-react';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface BoxVisualizerProps {
  width?: number;
  height?: number;
  depth?: number;
  materialThickness?: number;
  boxType?: 'openTop' | 'closedLid' | string; // Allow string for default case
  dimensionsAre?: 'inside' | 'outside' | string; // Allow string for default case
}

// Reusable Panel component with Edge Lines
const Panel: React.FC<{ position: [number, number, number], args: [number, number, number] }> = ({ position, args }) => {
  const meshRef = useRef<THREE.Mesh>(null!); // Ref for the mesh geometry

  // Define geometry for edges
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(...args)), [args]);

  return (
    <group position={position}> {/* Group to hold mesh and edges */}
      <DreiBox ref={meshRef} args={args} castShadow receiveShadow>
        {/* Material for smoothing */}
        <meshStandardMaterial color="#D2B48C" side={THREE.DoubleSide} flatShading={false} />
      </DreiBox>
      {/* Edge Lines */}
      <lineSegments geometry={edges} renderOrder={1}> {/* Render lines on top */}
        <lineBasicMaterial color="#654321" linewidth={1.5} /> {/* Darker brown edges */}
      </lineSegments>
    </group>
  );
};

// --- View Controls Component (Placeholder - will be created below) ---
interface ViewControlsProps {
  setTopView: () => void;
  setFrontView: () => void;
  setSideView: () => void;
  resetCamera: () => void;
}

const ViewControls: React.FC<ViewControlsProps> = ({ setTopView, setFrontView, setSideView, resetCamera }) => {
  // Implementation will be added in the next step
  return (
     <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-1 bg-card p-1 rounded-lg shadow-md border border-border">
          <Button variant="ghost" size="icon" onClick={resetCamera} title="3D View (Orbit)">
            <Orbit className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={setTopView} title="Top View">
            <Square className="h-5 w-5" />
          </Button>
           <Button variant="ghost" size="icon" onClick={setFrontView} title="Front View">
            <RectangleHorizontal className="h-5 w-5" />
          </Button>
           <Button variant="ghost" size="icon" onClick={setSideView} title="Side View">
            <RectangleVertical className="h-5 w-5" />
          </Button>
        </div>
     </div>
  );
};
// --- End View Controls Component ---

const BoxVisualizer: React.FC<BoxVisualizerProps> = ({
    width: propWidth = 100, // Default width in mm
    height: propHeight = 50, // Default height in mm
    depth: propDepth = 100, // Default depth in mm
    materialThickness: propThickness = 3, // Default thickness in mm
    boxType = 'closedLid',
    dimensionsAre = 'outside',
}) => {
  // Define a scaling factor (e.g., 100 to convert mm to cm for display)
  const scaleFactor = 100;

  // Log received props
  console.log('[BoxVisualizer] Received props:', {
      propWidth,
      propHeight,
      propDepth,
      propThickness, // <-- Check this value
      boxType,
      dimensionsAre,
  });

  // Calculate dimensions and positions based on props
  const { panels } = useMemo(() => {
    // Log thickness used in calculation
    console.log('[BoxVisualizer useMemo] Using propThickness:', propThickness);
    // Log dimensionsAre used in calculation
    console.log('[BoxVisualizer useMemo] Using dimensionsAre:', dimensionsAre);

    const thickness = Math.max(0.1, propThickness) / scaleFactor; // Scaled thickness, ensure non-zero
    console.log('[BoxVisualizer useMemo] Calculated scaled thickness:', thickness);

    const w = Math.max(0.1, propWidth) / scaleFactor;
    const h = Math.max(0.1, propHeight) / scaleFactor; // Input height interpretation depends on dimensionsAre
    const d = Math.max(0.1, propDepth) / scaleFactor;

    // Define inner/outer width and depth based on dimensionsAre
    let innerW: number, innerD: number, outerW: number, outerD: number;

    // Check the actual value being passed for boxType
    console.log('[BoxVisualizer useMemo] Using boxType:', boxType);
    const hasLid = boxType === 'closed'; // Use the value from config ('closed'/'open')

    // Inside dimensions are given
    if (dimensionsAre === 'inside') {
      innerW = w; // w is innerWidth
      innerD = d; // d is innerDepth
      outerW = w + 2 * thickness; // Add thickness twice for outer
      outerD = d + 2 * thickness; // Add thickness twice for outer
    }
    // Outside dimensions are given
    else { // dimensionsAre === 'outside'
      outerW = w; // w is outerWidth
      outerD = d; // d is outerDepth
      innerW = w - 2 * thickness; // Subtract thickness twice for inner
      innerD = d - 2 * thickness; // Subtract thickness twice for inner
    }
    // Ensure inner dimensions are non-negative
    innerW = Math.max(0.001, innerW);
    innerD = Math.max(0.001, innerD);

    // Calculate wall height and panel positions based on the new logic (REVISED AGAIN)
    let sideWallH: number;
    let bottomPanelY: number;
    let topPanelY: number | null = null;

    if (dimensionsAre === 'outside') {
        // Input h is total outer height. Side walls span this height.
        sideWallH = h;
        bottomPanelY = -sideWallH / 2 + thickness / 2;
        if (hasLid) {
            topPanelY = sideWallH / 2 - thickness / 2;
        }
    } else { // dimensionsAre === 'inside'
        // Input h is inner height. Side walls span inner height + top/bottom thickness.
        sideWallH = h + 2 * thickness;
        bottomPanelY = -sideWallH / 2 + thickness / 2; // Base sits at the bottom of the full side wall height
        if (hasLid) {
            topPanelY = sideWallH / 2 - thickness / 2; // Lid sits at the top of the full side wall height
        }
    }
    sideWallH = Math.max(0.001, sideWallH); // Ensure non-negative wall height

    const calculatedPanels = [
      // Bottom Panel: Positioned at bottom, uses INNER dimensions
      { position: [0, bottomPanelY, 0], args: [innerW, thickness, innerD] },

      // Front Panel: Centered vertically, spans full sideWallH and OUTER width
      { position: [0, 0, outerD / 2 - thickness / 2], args: [outerW, sideWallH, thickness] },

      // Back Panel: Centered vertically, spans full sideWallH and OUTER width
      { position: [0, 0, -outerD / 2 + thickness / 2], args: [outerW, sideWallH, thickness] },

      // Left Panel: Centered vertically, spans full sideWallH and INNER depth (fits between front/back)
      { position: [-outerW / 2 + thickness / 2, 0, 0], args: [thickness, sideWallH, innerD] },

      // Right Panel: Centered vertically, spans full sideWallH and INNER depth (fits between front/back)
      { position: [outerW / 2 - thickness / 2, 0, 0], args: [thickness, sideWallH, innerD] },
    ];

    // Add Top Panel if needed: Positioned at top, uses INNER dimensions
    if (hasLid && topPanelY !== null) {
      calculatedPanels.push(
        { position: [0, topPanelY, 0], args: [innerW, thickness, innerD] }
      );
    }

    return { panels: calculatedPanels };

  }, [propWidth, propHeight, propDepth, propThickness, boxType, dimensionsAre, scaleFactor]);

  // Ref for OrbitControls
  const controlsRef = useRef<OrbitControlsImpl>(null!);

  // Calculate a suitable distance for fixed views based on box size
  const viewDistance = useMemo(() => {
      const scaledWidth = propWidth / scaleFactor;
      const scaledHeight = propHeight / scaleFactor;
      const scaledDepth = propDepth / scaleFactor;
      return Math.max(scaledWidth, scaledHeight, scaledDepth) * 2; // Reduced multiplier to zoom in fixed views
  }, [propWidth, propHeight, propDepth, scaleFactor]);

  // Camera control functions
  const setTopView = useCallback(() => {
      if (!controlsRef.current) return;
      controlsRef.current.object.position.set(0, viewDistance, 0.001); // Slight Z offset to ensure 'up' is Y
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
  }, [viewDistance]);

  const setFrontView = useCallback(() => {
      if (!controlsRef.current) return;
      controlsRef.current.object.position.set(0, 0, viewDistance);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
  }, [viewDistance]);

    const setSideView = useCallback(() => {
      if (!controlsRef.current) return;
      controlsRef.current.object.position.set(viewDistance, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
  }, [viewDistance]);

  const resetCamera = useCallback(() => {
     if (!controlsRef.current) return;
     // Explicitly set back to the initial calculated position
     const initialX = propWidth/scaleFactor * 2; // Reduced multiplier
     const initialY = propHeight/scaleFactor * 2; // Reduced multiplier
     const initialZ = propDepth/scaleFactor * 2; // Reduced multiplier
     controlsRef.current.object.position.set(initialX, initialY, initialZ);
     controlsRef.current.target.set(0, 0, 0); // Look at the center
     controlsRef.current.update();
  }, [propWidth, propHeight, propDepth, scaleFactor]); // Add dependencies

  // Log received props just before rendering
  console.log('[BoxVisualizer Render] Received dimensionsAre:', dimensionsAre);

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows // Enable shadows
        gl={{ antialias: true }} // Explicitly enable antialiasing
        camera={{ position: [propWidth/scaleFactor * 6, propHeight/scaleFactor * 6, propDepth/scaleFactor * 6], fov: 50 }} // Increased multipliers again
        style={{ background: '#f0f0f0', height: '100%', width: '100%' }}
        className="rounded-lg" // Add rounding to match container
      >
        {/* Group to center the box */}
        <group position={[0, 0, 0]}>
           {/* Ambient light for overall illumination */}
          <ambientLight intensity={0.8} /> {/* Increased intensity */}
          {/* Directional lights for better definition - Adjusted setup */}
          <directionalLight
            position={[8, 10, 8]} // Main key light from top-front-right
            intensity={1.0} // Slightly stronger key light
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-bias={-0.001} // Added shadow bias
           />
          <directionalLight
              position={[-5, 5, -5]} // Fill light from opposite side
              intensity={0.5} // Softer fill light
          />
          {/* Removed the third directional light for simplicity */}

          {/* Render the calculated panels */}
          {panels.map((panelProps, index) => (
            <Panel key={index} {...panelProps as { position: [number, number, number], args: [number, number, number] }} />
          ))}
        </group>
        <OrbitControls ref={controlsRef} /> {/* Assign ref */}
      </Canvas>
      {/* Render the View Controls */}
      <ViewControls
          setTopView={setTopView}
          setFrontView={setFrontView}
          setSideView={setSideView}
          resetCamera={resetCamera}
        />
    </div>
  );
};

export default BoxVisualizer; 