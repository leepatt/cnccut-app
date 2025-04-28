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
  joinType?: 'butt' | 'finger' | string; // Add joinType prop
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
        <lineBasicMaterial color="#654321" linewidth={5.0} /> {/* Further increased line width */}
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

const BoxVisualizer: React.FC<BoxVisualizerProps> = (props) => {
  // Destructure props with defaults *inside* the component body
  const {
    width: propWidth = 100,
    height: propHeight = 50,
    depth: propDepth = 100,
    materialThickness: propThickness = 3,
    boxType = 'closedLid',
    dimensionsAre = 'outside',
    joinType = 'butt' // Keep default here for internal use
  } = props;

  // --- DEBUGGING ---
  console.log('[BoxVisualizer] Received props:', {
    propWidth,
    propHeight,
    propDepth,
    propThickness,
    boxType,
    dimensionsAre,
    joinType, // Log destructured joinType used internally
    propsJoinType: props.joinType // Log the actual prop value
  });
  // --- END DEBUGGING ---

  const scaleFactor = 100;

  // Calculate dimensions and positions based on props
  const { bottomPanelData, otherPanels } = useMemo(() => {
    // --- DEBUGGING ---
    // Use props.joinType here for logging if needed, but the dependency is key
    console.log('[BoxVisualizer useMemo] Running calculation. joinType prop:', props.joinType);
    // --- END DEBUGGING ---
    
    console.log('[BoxVisualizer useMemo] Using propThickness:', propThickness);
    // Log dimensionsAre used in calculation
    console.log('[BoxVisualizer useMemo] Using dimensionsAre:', props.dimensionsAre);

    const thickness = Math.max(0.1, propThickness) / scaleFactor; // Define thickness once
    console.log('[BoxVisualizer useMemo] Calculated scaled thickness:', thickness);

    const w = Math.max(0.1, propWidth) / scaleFactor;
    const h = Math.max(0.1, propHeight) / scaleFactor;
    const d = Math.max(0.1, propDepth) / scaleFactor;

    // Define inner/outer width and depth based on dimensionsAre
    let innerW: number, innerD: number, outerW: number, outerD: number;

    const currentBoxType = props.boxType ?? 'closedLid';
    const currentDimensionsAre = props.dimensionsAre ?? 'outside';

    // Check the actual value being passed for boxType
    console.log('[BoxVisualizer useMemo] Using boxType:', currentBoxType);
    const hasLid = currentBoxType === 'closed';

    // Inside dimensions are given
    if (currentDimensionsAre === 'inside') {
      innerW = w;
      innerD = d;
      outerW = w + 2 * thickness;
      outerD = d + 2 * thickness;
    }
    // Outside dimensions are given
    else { // dimensionsAre === 'outside'
      outerW = w;
      outerD = d;
      innerW = w - 2 * thickness;
      innerD = d - 2 * thickness;
    }
    innerW = Math.max(0.001, innerW);
    innerD = Math.max(0.001, innerD);

    // Calculate wall height and panel positions based on the new logic (REVISED AGAIN)
    let sideWallH: number;
    let bottomPanelY: number;
    let topPanelY: number | null = null;

    if (currentDimensionsAre === 'outside') {
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

    // --- Define panels --- 
    const bottomPanelInfo = {
        positionY: bottomPanelY,
        args: [innerW, thickness, innerD],
        fingerSize: thickness // Finger width/depth is thickness
    };

    const remainingPanels = [
        // Front Panel
        { position: [0, 0, outerD / 2 - thickness / 2], args: [outerW, sideWallH, thickness], type: 'front' },
        // Back Panel
        { position: [0, 0, -outerD / 2 + thickness / 2], args: [outerW, sideWallH, thickness], type: 'back' },
        // Left Panel
        { position: [-outerW / 2 + thickness / 2, 0, 0], args: [thickness, sideWallH, innerD], type: 'left' },
        // Right Panel
        { position: [outerW / 2 - thickness / 2, 0, 0], args: [thickness, sideWallH, innerD], type: 'right' },
    ];

    // Add Top Panel if needed
    if (hasLid && topPanelY !== null) {
      remainingPanels.push(
        { position: [0, topPanelY, 0], args: [innerW, thickness, innerD], type: 'top' }
      );
    }

    return { bottomPanelData: bottomPanelInfo, otherPanels: remainingPanels };

  }, [propWidth, propHeight, propDepth, propThickness, props.boxType, props.dimensionsAre, scaleFactor, props.joinType]);

  // --- DEBUGGING ---
  console.log('[BoxVisualizer] useMemo result:', { bottomPanelData, otherPanels });
  // --- END DEBUGGING ---

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
  // --- DEBUGGING ---
  console.log('[BoxVisualizer Render] Checking joinType:', joinType, `| Should render finger panel?`, joinType === 'finger');
  // --- END DEBUGGING ---

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
          <ambientLight intensity={0.8} /> {/* Slightly decreased ambient intensity */}
          {/* Directional lights for better definition - Adjusted setup */}
          <directionalLight
            position={[0, 10, 10]} // Moved key light more to the front
            intensity={0.9} // Slightly weaker key light
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-bias={-0.001} // Added shadow bias
           />
          <directionalLight
              position={[-5, 5, -5]} // Fill light from opposite side
              intensity={0.4} // Slightly decreased fill light intensity
              castShadow // Allow fill light to cast shadows too if needed
              shadow-mapSize-width={512} // Lower res shadow map for fill
          />
          
          {/* --- Render Box with Finger Joints --- */}
          {joinType === 'finger' && bottomPanelData && (
            <>
              {/* Bottom Panel - Base */}
              <Panel
                position={[0, bottomPanelData.positionY, 0]}
                args={bottomPanelData.args as [number, number, number]}
              />
              
              {/* Bottom Panel - Finger Joints (1/3 width fingers centered on each edge) */}
              <Panel
                position={[0, bottomPanelData.positionY, bottomPanelData.args[2]/2 + bottomPanelData.fingerSize/2]}
                args={[bottomPanelData.args[0]/3, bottomPanelData.args[1], bottomPanelData.fingerSize]}
              />
              
              <Panel
                position={[0, bottomPanelData.positionY, -bottomPanelData.args[2]/2 - bottomPanelData.fingerSize/2]}
                args={[bottomPanelData.args[0]/3, bottomPanelData.args[1], bottomPanelData.fingerSize]}
              />
              
              <Panel
                position={[-bottomPanelData.args[0]/2 - bottomPanelData.fingerSize/2, bottomPanelData.positionY, 0]}
                args={[bottomPanelData.fingerSize, bottomPanelData.args[1], bottomPanelData.args[2]/3]}
              />
              
              <Panel
                position={[bottomPanelData.args[0]/2 + bottomPanelData.fingerSize/2, bottomPanelData.positionY, 0]}
                args={[bottomPanelData.fingerSize, bottomPanelData.args[1], bottomPanelData.args[2]/3]}
              />
              
              {/* Front Panel - Base */}
              <Panel 
                position={[0, 0, otherPanels[0].position[2] as number]} 
                args={otherPanels[0].args as [number, number, number]}
              />
              
              {/* Front Panel - Finger Joints */}
              <Panel
                position={[-(otherPanels[0].args as [number, number, number])[0]/3, (otherPanels[0].args as [number, number, number])[1]/2 + bottomPanelData.fingerSize/2, otherPanels[0].position[2] as number]}
                args={[(otherPanels[0].args as [number, number, number])[0]/3, bottomPanelData.fingerSize, (otherPanels[0].args as [number, number, number])[2]]}
              />
              
              {/* Back Panel - Base */}
              <Panel 
                position={[0, 0, otherPanels[1].position[2] as number]} 
                args={otherPanels[1].args as [number, number, number]}
              />
              
              {/* Back Panel - Finger Joints */}
              <Panel
                position={[(otherPanels[1].args as [number, number, number])[0]/3, (otherPanels[1].args as [number, number, number])[1]/2 + bottomPanelData.fingerSize/2, otherPanels[1].position[2] as number]}
                args={[(otherPanels[1].args as [number, number, number])[0]/3, bottomPanelData.fingerSize, (otherPanels[1].args as [number, number, number])[2]]}
              />
              
              {/* Left Panel - Base */}
              <Panel 
                position={[otherPanels[2].position[0] as number, 0, 0]} 
                args={otherPanels[2].args as [number, number, number]}
              />
              
              {/* Left Panel - Finger Joints */}
              <Panel
                position={[otherPanels[2].position[0] as number, (otherPanels[2].args as [number, number, number])[1]/2 + bottomPanelData.fingerSize/2, (otherPanels[2].args as [number, number, number])[2]/3]}
                args={[(otherPanels[2].args as [number, number, number])[0], bottomPanelData.fingerSize, (otherPanels[2].args as [number, number, number])[2]/3]}
              />
              
              {/* Right Panel - Base */}
              <Panel 
                position={[otherPanels[3].position[0] as number, 0, 0]} 
                args={otherPanels[3].args as [number, number, number]}
              />
              
              {/* Right Panel - Finger Joints */}
              <Panel
                position={[otherPanels[3].position[0] as number, (otherPanels[3].args as [number, number, number])[1]/2 + bottomPanelData.fingerSize/2, -(otherPanels[3].args as [number, number, number])[2]/3]}
                args={[(otherPanels[3].args as [number, number, number])[0], bottomPanelData.fingerSize, (otherPanels[3].args as [number, number, number])[2]/3]}
              />
              
              {/* Top Panel if it exists */}
              {otherPanels.length > 4 && (
                <>
                  <Panel 
                    position={[0, otherPanels[4].position[1] as number, 0]} 
                    args={otherPanels[4].args as [number, number, number]}
                  />
                
                  {/* Top Panel Fingers */}
                  <Panel
                    position={[0, otherPanels[4].position[1] as number, (otherPanels[4].args as [number, number, number])[2]/2 + bottomPanelData.fingerSize/2]}
                    args={[(otherPanels[4].args as [number, number, number])[0]/3, (otherPanels[4].args as [number, number, number])[1], bottomPanelData.fingerSize]}
                  />
                </>
              )}
            </>
          )}
          
          {/* --- Render Box with Butt Joints --- */}
          {joinType !== 'finger' && (
            <>
              {bottomPanelData && (
                <Panel
                   position={[0, bottomPanelData.positionY, 0]}
                   args={bottomPanelData.args as [number, number, number]}
                />
              )}
              {otherPanels.map((panelProps, index) => (
                <Panel key={index} position={panelProps.position as [number, number, number]} args={panelProps.args as [number, number, number]} />
              ))}
            </>
          )}
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