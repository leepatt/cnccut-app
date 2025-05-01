import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Orbit, Square } from 'lucide-react';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface CurvesVisualizerProps {
  radius?: number;
  width?: number;
  angle?: number;
  materialThickness?: number;
  arcLength?: number;
  chordLength?: number;
  showDimensions?: boolean;
  isTooLarge?: boolean;
  numSplits?: number;
  splitLinesHovered?: boolean;
}

// View Controls Component
interface ViewControlsProps {
  setTopView: () => void;
  resetCamera: () => void;
  is3DView: boolean;
}

const ViewControls: React.FC<ViewControlsProps> = ({ setTopView, resetCamera, is3DView }) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-1 bg-card p-1 rounded-lg shadow-md border border-border">
        <Button variant={is3DView ? "default" : "ghost"} size="icon" onClick={resetCamera} title="3D View (Orbit)">
          <Orbit className="h-5 w-5" />
        </Button>
        <Button variant={!is3DView ? "default" : "ghost"} size="icon" onClick={setTopView} title="Plan View (Top)">
          <Square className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

// DimensionLabel component for annotations with hover
interface DimensionLabelProps {
  position: [number, number, number];
  text: string;
  color?: string;
  details?: string;
  onPointerOver?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerOut?: (event: React.PointerEvent<HTMLDivElement>) => void;
}

const DimensionLabel: React.FC<DimensionLabelProps> = ({ 
  position, 
  text, 
  color = "#000000", 
  details, 
  onPointerOver, 
  onPointerOut 
}) => {
  const [hovered, setHovered] = useState(false);
  const showDetails = hovered && details;
  
  const handlePointerOver = (event: React.PointerEvent<HTMLDivElement>) => {
    setHovered(true);
    onPointerOver?.(event);
  };

  const handlePointerOut = (event: React.PointerEvent<HTMLDivElement>) => {
    setHovered(false);
    onPointerOut?.(event);
  };
  
  return (
    <Html position={position} center>
      <div 
        style={{ 
          backgroundColor: hovered ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)', 
          padding: '2px 4px', 
          borderRadius: '3px',
          fontSize: hovered ? '14px' : '12px',
          fontWeight: 'bold',
          color,
          border: hovered ? `1px solid ${color}` : 'none',
          cursor: 'pointer',
          boxShadow: hovered ? '0 2px 5px rgba(0,0,0,0.2)' : 'none',
          transition: 'all 0.2s ease'
        }}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {text}
        {showDetails && (
          <div style={{ 
            fontSize: '12px', 
            marginTop: '3px', 
            fontWeight: 'normal', 
            color: '#555', 
            maxWidth: '150px'
          }}>
            {details}
          </div>
        )}
      </div>
    </Html>
  );
};

// Interactive line component with hover effect
interface InteractiveLineProps {
  points: THREE.Vector3[];
  color: string;
  lineWidth: number;
  dashed?: boolean;
  dashSize?: number;
  dashScale?: number;
  gapSize?: number;
  onHover: (hovered: boolean) => void;
  isHovered: boolean;
}

const DEFAULT_LINE_COLOR = '#888888';

const InteractiveLine: React.FC<InteractiveLineProps> = ({ 
  points, 
  color,
  lineWidth, 
  dashed = false, 
  dashSize = 0, 
  gapSize = 0, 
  dashScale = 1, 
  onHover, 
  isHovered 
}) => {
  const currentLineColor = isHovered ? color : DEFAULT_LINE_COLOR;
  const currentLineWidth = isHovered ? lineWidth * 1.5 : lineWidth;

  return (
    <Line
      points={points}
      color={currentLineColor}
      lineWidth={currentLineWidth}
      dashed={dashed}
      dashSize={dashSize}
      dashScale={dashScale}
      gapSize={gapSize}
      onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
      onPointerOut={(e) => { e.stopPropagation(); onHover(false); }}
    />
  );
};

// Custom curved panel component - flat on ground plane
const CurvedPanel: React.FC<{ 
  radius: number, 
  width: number, 
  angle: number, 
  thickness: number,
  arcLength?: number,
  chordLength?: number,
  showDimensions?: boolean,
  scaleFactor: number,
  isTooLarge?: boolean,
  numSplits?: number,
  splitLinesHovered?: boolean
}> = ({ 
  radius, 
  width, 
  angle, 
  thickness, 
  arcLength, 
  chordLength, 
  showDimensions, 
  scaleFactor, 
  isTooLarge, 
  numSplits, 
  splitLinesHovered
}) => {
  // States for hover effects
  const [radiusHovered, setRadiusHovered] = useState(false);
  const [widthHovered, setWidthHovered] = useState(false);
  const [angleHovered, setAngleHovered] = useState(false);
  const [arcLengthHovered, setArcLengthHovered] = useState(false);
  const [chordLengthHovered, setChordLengthHovered] = useState(false);
  
  // Real-world values (without scaling)
  const realRadius = radius * scaleFactor;
  const realWidth = width * scaleFactor;
  const realArcLength = arcLength ? arcLength : 0;
  const realChordLength = chordLength ? chordLength : 0;
  
  // Create a flat curved shape
  const shape = useMemo(() => {
    const curveShape = new THREE.Shape();
    const innerRadius = radius;
    const outerRadius = radius + width; // Width is the thickness of the curve (radial direction)
    
    // Start at inner radius point
    curveShape.moveTo(innerRadius, 0);
    
    // Draw outer arc (using absarc for absolute coordinates)
    curveShape.absarc(0, 0, outerRadius, 0, angle * Math.PI / 180, false);
    
    // Draw line to inner radius at angle
    curveShape.lineTo(innerRadius * Math.cos(angle * Math.PI / 180), innerRadius * Math.sin(angle * Math.PI / 180));
    
    // Draw inner arc back to start
    curveShape.absarc(0, 0, innerRadius, angle * Math.PI / 180, 0, true);
    
    // Close the shape
    curveShape.closePath();
    
    return curveShape;
  }, [radius, width, angle]);

  // Extrude settings for the flat shape
  const extrudeSettings = useMemo(() => ({
    steps: 1,
    depth: thickness, // Material thickness is the extrusion depth
    bevelEnabled: false,
  }), [thickness]);

  // FIRST_EDIT: recenter geometry and capture centerOffset
  const { geometry, centerOffset } = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.computeBoundingBox();
    const bbox = geo.boundingBox!;
    // compute X/Y center of shape
    const offsetX = (bbox.min.x + bbox.max.x) / 2;
    const offsetY = (bbox.min.y + bbox.max.y) / 2;
    // translate geometry to center at origin in shape plane
    geo.translate(-offsetX, -offsetY, 0);
    return {
      geometry: geo,
      centerOffset: new THREE.Vector3(-offsetX, -offsetY, 0)
    };
  }, [shape, extrudeSettings]);

  // Create edges geometry for outline
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  // Calculate dimension points
  const angleInRad = angle * Math.PI / 180;
  const outerR = radius + width;
  
  // Define desired height for dimension lines in mm
  const DIMENSION_LINE_HEIGHT_MM = 20;
  // Calculate scaled Z coordinate based on the scale factor
  const DIMENSION_LINE_Z = DIMENSION_LINE_HEIGHT_MM / scaleFactor;

  // Calculate dimension points 
  const radiusLine = [
    [centerOffset.x, centerOffset.y, 0], // Keep radius lines on the base plane (Z=0)
    [radius + centerOffset.x, centerOffset.y, 0]
  ];
  const radiusLineEnd = [
      [centerOffset.x, centerOffset.y, 0],
      [radius * Math.cos(angleInRad) + centerOffset.x, radius * Math.sin(angleInRad) + centerOffset.y, 0]
  ];
  // Apply fixed height to width line
  const widthLine = [
    [radius + centerOffset.x, centerOffset.y, DIMENSION_LINE_Z], 
    [radius + width + centerOffset.x, centerOffset.y, DIMENSION_LINE_Z]
  ];
  
  // Points for angle indicator (keep on base plane Z=0)
  const angleArc = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 20;
    const smallRadius = radius * 0.15; // Smaller radius for angle indicator
    
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * angleInRad;
      // add centerOffset to each point
      points.push(new THREE.Vector3(
        smallRadius * Math.cos(theta) + centerOffset.x,
        smallRadius * Math.sin(theta) + centerOffset.y,
        0
      ));
    }
    
    return points;
  }, [radius, angleInRad, centerOffset]);

  // Chord points with fixed height
  const chordPoints = [
    new THREE.Vector3(outerR + centerOffset.x, centerOffset.y, DIMENSION_LINE_Z), 
    new THREE.Vector3(outerR * Math.cos(angleInRad) + centerOffset.x, outerR * Math.sin(angleInRad) + centerOffset.y, DIMENSION_LINE_Z)
  ];

  // Outer arc line with fixed height
  const outerArcPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = Math.max(30, Math.ceil(angle / 6)); 
    
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * angleInRad;
      points.push(new THREE.Vector3(
        outerR * Math.cos(theta) + centerOffset.x,
        outerR * Math.sin(theta) + centerOffset.y,
        DIMENSION_LINE_Z // Use fixed Z height
      ));
    }
    
    return points;
  }, [angleInRad, angle, centerOffset, DIMENSION_LINE_Z, outerR]); // Removed radius, width dependencies

  // Create material with hover effect and increased roughness
  const [hovered, setHovered] = useState(false);
  const material = useMemo(() => (
    <meshStandardMaterial 
      color={hovered ? "#E8D0AA" : "#D2B48C"} 
      side={THREE.DoubleSide} 
      flatShading={false}
      roughness={0.75} // Increase roughness slightly (default is 1, 0 is smooth)
      metalness={0.1} // Keep it mostly non-metallic
    />
  ), [hovered]);

  return (
    <group rotation={[-Math.PI/2, 0, 0]}> {/* Rotate to lay flat with radius pointing right */}
      {/* Curved Panel */}
      <mesh 
        geometry={geometry} 
        castShadow 
        receiveShadow 
        position={[0, 0, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {material}
      </mesh>
      <lineSegments geometry={edges} renderOrder={1}>
        <lineBasicMaterial color="#654321" linewidth={2.0} />
      </lineSegments>

      {/* Dimension Lines and Labels */}
      {showDimensions && (
        <>
          {/* Radius Lines (Z=0) */}
          <InteractiveLine
            points={radiusLine.map(p => new THREE.Vector3(p[0], p[1], p[2]))}
            color="blue"
            lineWidth={1}
            onHover={setRadiusHovered}
            isHovered={radiusHovered}
          />
          <InteractiveLine
            points={radiusLineEnd.map(p => new THREE.Vector3(p[0], p[1], p[2]))}
            color="blue"
            lineWidth={1}
            onHover={setRadiusHovered}
            isHovered={radiusHovered}
          />
          <DimensionLabel 
            position={[radius * 0.5 + centerOffset.x, centerOffset.y, 0]} 
            text={`r: ${Math.round(realRadius)}mm`}
            color="blue"
            details={`Internal radius`}
            onPointerOver={() => setRadiusHovered(true)}
            onPointerOut={() => setRadiusHovered(false)}
          />

          {/* Width Line (Z=DIMENSION_LINE_Z) */}
          <InteractiveLine
            points={widthLine.map(p => new THREE.Vector3(p[0], p[1], p[2]))}
            color="green" 
            lineWidth={1}
            onHover={setWidthHovered}
            isHovered={widthHovered}
          />
          <DimensionLabel 
            position={[radius + width * 0.5 + centerOffset.x, centerOffset.y, DIMENSION_LINE_Z]}
            text={`w: ${Math.round(realWidth)}mm`}
            color="green"
            details={`Curve width`}
            onPointerOver={() => setWidthHovered(true)}
            onPointerOut={() => setWidthHovered(false)}
          />
                    
          {/* Angle Arc (Z=0) */}
          <InteractiveLine
            points={angleArc}
            color="red"
            lineWidth={1}
            onHover={setAngleHovered}
            isHovered={angleHovered}
          />
          <DimensionLabel 
            position={[radius * 0.1 + centerOffset.x, radius * 0.1 + centerOffset.y, 0]}
            text={`θ: ${angle}°`}
            color="red"
            details={`Angle`}
            onPointerOver={() => setAngleHovered(true)}
            onPointerOut={() => setAngleHovered(false)}
          />
          
          {/* Arc Length Line (Z=DIMENSION_LINE_Z) */}
          {arcLength && (
            <>
              <InteractiveLine
                points={outerArcPoints}
                color="#8844AA" 
                lineWidth={1}
                onHover={setArcLengthHovered}
                isHovered={arcLengthHovered}
              />
              <DimensionLabel 
                position={[
                  (radius + width) * Math.cos(angleInRad * 0.5) + centerOffset.x, 
                  (radius + width) * Math.sin(angleInRad * 0.5) + centerOffset.y, 
                  DIMENSION_LINE_Z
                ]} 
                text={`L: ${Math.round(realArcLength)}mm`}
                color="#8844AA"
                details={`Arc length`}
                onPointerOver={() => setArcLengthHovered(true)}
                onPointerOut={() => setArcLengthHovered(false)}
              />
            </>
          )}
          
          {/* Chord Line (Z=DIMENSION_LINE_Z) */}
          <InteractiveLine
            points={chordPoints}
            color="orange"
            lineWidth={1}
            dashed
            dashSize={0.05}
            dashScale={1}
            gapSize={0.05}
            onHover={setChordLengthHovered}
            isHovered={chordLengthHovered}
          />
          {chordLength && (
            <DimensionLabel 
              position={[
                (radius + width) * 0.7 * Math.cos(angleInRad * 0.5) + centerOffset.x, 
                (radius + width) * 0.7 * Math.sin(angleInRad * 0.5) + centerOffset.y, 
                DIMENSION_LINE_Z
              ]} 
              text={`c: ${Math.round(realChordLength)}mm`}
              color="orange"
              details={`Chord length`}
              onPointerOver={() => setChordLengthHovered(true)}
              onPointerOut={() => setChordLengthHovered(false)}
            />
          )}
          
          {/* Split Lines - Draw them at Z=DIMENSION_LINE_Z */}
          {isTooLarge && numSplits && numSplits > 1 && (
            <>
              {Array.from({ length: numSplits - 1 }).map((_, i) => {
                const splitAngle = (i + 1) * (angle / numSplits);
                const splitAngleRad = splitAngle * Math.PI / 180;
                const innerPoint = new THREE.Vector3(
                  radius * Math.cos(splitAngleRad) + centerOffset.x,
                  radius * Math.sin(splitAngleRad) + centerOffset.y,
                  DIMENSION_LINE_Z // Raise to fixed Z height
                );
                const outerPoint = new THREE.Vector3(
                  (radius + width) * Math.cos(splitAngleRad) + centerOffset.x,
                  (radius + width) * Math.sin(splitAngleRad) + centerOffset.y,
                  DIMENSION_LINE_Z // Raise to fixed Z height
                );
                // Define hover styles
                const hoverLineWidth = 5;
                const hoverColor = 'orange';
                const defaultLineWidth = 3;
                const defaultColor = 'red';

                return (
                  <Line // Using non-interactive Line for splits
                    key={`split-${i}`}
                    points={[innerPoint, outerPoint]}
                    color={splitLinesHovered ? hoverColor : defaultColor} // Conditional color
                    lineWidth={splitLinesHovered ? hoverLineWidth : defaultLineWidth} // Conditional line width
                  />
                );
              })}
            </>
          )}
        </>
      )}
    </group>
  );
};

const CurvesVisualizer: React.FC<CurvesVisualizerProps> = ({
  radius = 1200,
  width = 100,
  angle = 90,
  materialThickness = 18,
  arcLength,
  chordLength,
  showDimensions = false,
  isTooLarge = false,
  numSplits = 1,
  splitLinesHovered = false
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [is3DView, setIs3DView] = useState(false); // false = top view (default)
  const previousProps = useRef({ radius, width, angle, materialThickness });
  
  // Scale for visualization (scales DOWN by this factor)
  const scaleFactor = 500; // Reduced to make the part appear larger
  const scaledRadius = radius / scaleFactor;
  const scaledWidth = width / scaleFactor;
  const scaledThickness = materialThickness / scaleFactor;

  // Calculate maximum dimension for centering and sizing
  const maxDimension = useMemo(() => {
    // Calculate size based on outer radius and angle
    const outerRadius = radius + width;
    const maxExtent = Math.max(
      outerRadius,
      outerRadius * Math.sin(angle * Math.PI / 180)
    ) / scaleFactor;
    
    // Reduce padding to zoom in and minimize empty margins
    const paddingFactor = angle > 180 ? 1.1 : 1.05;
    return maxExtent * paddingFactor;
  }, [radius, width, angle, scaleFactor]);
  
  // Calculate the initial camera distance factor
  const initialDistanceFactor = useMemo(() => {
    const radiusToWidthRatio = radius / width;
    if (angle < 30) return 1.6;
    if (angle > 180) return 2.0;
    if (radiusToWidthRatio > 20) return 1.8;
    return 1.7;
  }, [radius, width, angle]);
  
  // Return to plan view if any of the inputs changed
  useEffect(() => {
    const hasChanged = 
      previousProps.current.radius !== radius ||
      previousProps.current.width !== width ||
      previousProps.current.angle !== angle ||
      previousProps.current.materialThickness !== materialThickness;
    
    if (hasChanged && !is3DView) {
      // Will update view after setTopView is defined
      previousProps.current = { radius, width, angle, materialThickness };
    }
  }, [radius, width, angle, materialThickness, is3DView]);
  
  // Camera control functions
  const resetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      setIs3DView(true);
    }
  }, []);

  const setTopView = useCallback(() => {
    if (controlsRef.current) {
      // Reset and set to top view
      controlsRef.current.reset();
      controlsRef.current.update();
      
      // Position directly above with no azimuthal rotation
      controlsRef.current.setAzimuthalAngle(0); // Straight alignment, no rotation
      controlsRef.current.setPolarAngle(0);
      
      // Set zoom to fit the part with padding
      const camera = controlsRef.current.object;
      if (camera instanceof THREE.PerspectiveCamera) {
        // Calculate zoom based on part size and angle
        // Use different factors based on part size to ensure visibility
        let distanceFactor;
        
        // For very small angles or large radius differences, adjust zoom accordingly
        const radiusToWidthRatio = radius / width;
        if (angle < 30) {
          // For small angles, zoom in more
          distanceFactor = 1.6;
        } else if (angle > 180) {
          // For large angles, slightly less padding
          distanceFactor = 2.0;
        } else if (radiusToWidthRatio > 20) {
          // For thin bands (large radius, small width)
          distanceFactor = 1.8;
        } else {
          // Default zoom level tightened
          distanceFactor = 1.7;
        }
        
        // Position the camera for best viewing
        camera.position.set(0, maxDimension * distanceFactor, 0);
        camera.updateProjectionMatrix();
      }
      
      controlsRef.current.update();
      setIs3DView(false);
    }
  }, [maxDimension, radius, width, angle]);
  
  // Set to plan view on initial render and when inputs change
  useEffect(() => {
    setTimeout(() => {
      setTopView();
    }, 100); // Small delay to ensure the component is fully mounted
  }, [setTopView]);
  
  // Update view after dimension changes
  useEffect(() => {
    if (!is3DView) {
      setTopView();
    }
  }, [radius, width, angle, setTopView, is3DView]);

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, maxDimension * initialDistanceFactor, 0], fov: 45 }}
        style={{ 
          background: '#ffffff', 
          width: '100%', 
          height: '100%', 
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        }}
      >
        {/* Lights - ADJUSTED */}
        <ambientLight intensity={0.7} /> {/* Increased ambient intensity */}
        <directionalLight // Main light
          position={[8, 12, 8]} // Adjusted position slightly
          intensity={0.9} // Slightly decreased intensity
          castShadow
          shadow-mapSize-width={1024} // Kept resolution for reasonable detail
          shadow-mapSize-height={1024}
          shadow-camera-near={0.1}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-bias={-0.001} // Fine-tune bias if needed
        />
        {/* Add a Fill Light */}
        <directionalLight 
            position={[-5, 5, -5]} 
            intensity={0.3} // Weaker fill light
            // No shadow casting needed for fill light usually
        />
        
        {/* Curved Panel */}
        <CurvedPanel 
          radius={scaledRadius} 
          width={scaledWidth} 
          angle={angle} 
          thickness={scaledThickness}
          arcLength={arcLength}
          chordLength={chordLength}
          showDimensions={showDimensions}
          scaleFactor={scaleFactor}
          isTooLarge={isTooLarge}
          numSplits={numSplits}
          splitLinesHovered={splitLinesHovered}
        />
        
        {/* Controls */}
        <OrbitControls 
          ref={controlsRef}
          enableDamping 
          dampingFactor={0.1}
          minDistance={0.1}
          maxDistance={10}
          target={[0, 0, 0]}
          makeDefault
          enableRotate={is3DView} // Only allow rotation in 3D view
          maxPolarAngle={Math.PI / 2} // Restrict to top hemisphere
        />
      </Canvas>
      
      {/* View Controls UI */}
      <ViewControls
        resetCamera={resetCamera}
        setTopView={setTopView}
        is3DView={is3DView}
      />
    </>
  );
};

export default CurvesVisualizer; 