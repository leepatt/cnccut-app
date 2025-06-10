import React, { useMemo, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Orbit, Square, RectangleHorizontal, RectangleVertical } from 'lucide-react';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface PerfVisualizerProps {
  width?: number;
  height?: number;
  pattern?: 'grid' | 'diagonal' | 'radial';
  holeSize?: number;
  spacing?: number;
  materialThickness?: number;
  additionalRows?: number;
  additionalColumns?: number;
  holeType?: 'circle' | 'slot';
  slotLength?: number;
  slotRotation?: 'horizontal' | 'vertical';
}

// View Controls Component
interface ViewControlsProps {
  setTopView: () => void;
  setFrontView: () => void;
  setSideView: () => void;
  resetCamera: () => void;
}

const ViewControls: React.FC<ViewControlsProps> = ({ setTopView, setFrontView, setSideView, resetCamera }) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-1 bg-card p-1 rounded-lg shadow-md border border-border">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={resetCamera} 
          title="3D View (Orbit)"
          aria-label="Reset to 3D View"
        >
          <Orbit className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={setTopView} 
          title="Top View"
          aria-label="Switch to Top View"
        >
          <Square className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={setFrontView} 
          title="Front View"
          aria-label="Switch to Front View"
        >
          <RectangleHorizontal className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={setSideView} 
          title="Side View"
          aria-label="Switch to Side View"
        >
          <RectangleVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

// Custom perforated panel component
const PerforatedPanel: React.FC<{
  width: number;
  height: number;
  thickness: number;
  pattern: 'grid' | 'diagonal' | 'radial';
  holeSize: number;
  spacing: number;
  additionalRows: number;
  additionalColumns: number;
  holeType: 'circle' | 'slot';
  slotLength: number;
  slotRotation: 'horizontal' | 'vertical';
}> = ({ width, height, thickness, pattern, holeSize, spacing, additionalRows, additionalColumns, holeType, slotLength, slotRotation }) => {
  // Create base panel and holes
  const panelGeometry = useMemo(() => {
    // Create the panel shape
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, -height / 2);
    shape.lineTo(width / 2, -height / 2);
    shape.lineTo(width / 2, height / 2);
    shape.lineTo(-width / 2, height / 2);
    shape.closePath();

    // Create holes based on pattern
    const holes: THREE.Path[] = [];
    const holeRadius = holeSize / 2    // Helper function to create a slot path (for grid/diagonal)
    const createSlotPath = (x: number, y: number) => {
      const path = new THREE.Path();
      const radius = holeSize / 2; // This is the radius of the semicircular ends, and half the width of the slot
      
      // Ensure slotLength is at least holeSize (diameter of ends)
      // If slotLength is less than holeSize, it's an invalid slot, treat as circle of holeSize.
      const actualSlotLength = Math.max(slotLength, holeSize);
      const straightSegmentLength = actualSlotLength - holeSize; // Length of the straight parts

      const halfStraightSegment = straightSegmentLength / 2;

      if (slotRotation === 'horizontal') {
        // Slot is centered at (x, y)
        // Center of the left semicircle: (x - halfStraightSegment, y)
        // Center of the right semicircle: (x + halfStraightSegment, y)
        
        // Start path at the top-left point of the rectangle part
        path.moveTo(x - halfStraightSegment, y - radius);
        // Line to top-right
        path.lineTo(x + halfStraightSegment, y - radius);
        // Arc for the right semi-circle end (counter-clockwise)
        // Center of arc: (x + halfStraightSegment, y)
        // Start angle: -PI/2 (270 degrees), End angle: PI/2 (90 degrees)
        path.absarc(x + halfStraightSegment, y, radius, -Math.PI / 2, Math.PI / 2, false);
        // Line to bottom-left (which is the end point of the right semi-circle)
        path.lineTo(x - halfStraightSegment, y + radius);
        // Arc for the left semi-circle end (counter-clockwise)
        // Center of arc: (x - halfStraightSegment, y)
        // Start angle: PI/2 (90 degrees), End angle: -PI/2 (270 degrees or Math.PI * 1.5)
        path.absarc(x - halfStraightSegment, y, radius, Math.PI / 2, -Math.PI / 2, false);

      } else { // vertical
        // Slot is centered at (x, y)
        // Center of the top semicircle: (x, y + halfStraightSegment)
        // Center of the bottom semicircle: (x, y - halfStraightSegment)

        // Start path at the left point of the top semicircle
        path.moveTo(x - radius, y + halfStraightSegment);
        // Draw the top semicircle (clockwise from left to right)
        path.absarc(x, y + halfStraightSegment, radius, Math.PI, 0, true);
        // Line to bottom-right
        path.lineTo(x + radius, y - halfStraightSegment);
        // Draw the bottom semicircle (clockwise from right to left)
        path.absarc(x, y - halfStraightSegment, radius, 0, Math.PI, true);
        // Close back to start
        path.lineTo(x - radius, y + halfStraightSegment);
      }

      path.closePath(); // Ensuring the path is closed.
      return path;
    };//Different hole patterns
    if (pattern === 'grid') {
      console.log('[Grid Pattern] Initial values:', { width, height, holeSize, spacing, slotLength, slotRotation, additionalRows, additionalColumns, holeType });
      const effectiveWidth = width - 2 * spacing;
      const effectiveHeight = height - 2 * spacing;

      let itemWidth = holeSize;
      let itemHeight = holeSize;

      if (holeType === 'slot') {
        if (slotRotation === 'horizontal') {
          itemWidth = slotLength;
          // itemHeight remains holeSize
        } else { // vertical
          itemHeight = slotLength;
          // itemWidth remains holeSize
        }
      }
      
      const baseColumns = Math.floor((effectiveWidth + spacing) / (itemWidth + spacing));
      const baseRows = Math.floor((effectiveHeight + spacing) / (itemHeight + spacing));
      
      // Allow additionalRows/Columns to reduce to 0, but not negative unless explicitly allowed by min
      // Assuming additionalRows/Columns from ProductDefinition are what we want directly here.
      const totalRows = Math.max(1, baseRows + additionalRows);
      const totalColumns = Math.max(1, baseColumns + additionalColumns);
      
      console.log('[Grid Pattern] Item/Base/Total:', { itemWidth, itemHeight, baseColumns, baseRows, totalColumns, totalRows });

      const gridActualWidth = totalColumns * itemWidth + Math.max(0, totalColumns - 1) * spacing;
      const gridActualHeight = totalRows * itemHeight + Math.max(0, totalRows - 1) * spacing;

      const startX = -gridActualWidth / 2 + itemWidth / 2;
      const startY = -gridActualHeight / 2 + itemHeight / 2;
      
      console.log('[Grid Pattern] Grid Actual/Start:', { gridActualWidth, gridActualHeight, startX, startY });

      for (let r_loop = 0; r_loop < totalRows; r_loop++) { 
        for (let c = 0; c < totalColumns; c++) {
          const x = startX + c * (itemWidth + spacing);
          const y = startY + r_loop * (itemHeight + spacing);
          console.log(`[Grid Pattern] Slot [${r_loop}][${c}]: x=${x}, y=${y}`);
          
          let currentOpeningPath: THREE.Path | null = null;

          if (holeType === 'circle') {
            currentOpeningPath = new THREE.Path();
            currentOpeningPath.absarc(x, y, holeRadius, 0, Math.PI * 2, true);
          } else { // slot
            currentOpeningPath = createSlotPath(x, y);
          }

          if (currentOpeningPath) {
            const pathPoints2D = currentOpeningPath.getPoints();
            if (pathPoints2D.length > 0) {
              const pathPoints3D = pathPoints2D.map(p => new THREE.Vector3(p.x, p.y, 0));
              const boundingBox = new THREE.Box3().setFromPoints(pathPoints3D);
              if (boundingBox.min.x >= -width / 2 && boundingBox.max.x <= width / 2 &&
                  boundingBox.min.y >= -height / 2 && boundingBox.max.y <= height / 2) {
                holes.push(currentOpeningPath);
              }
            }
          }
        }
      }
    } else if (pattern === 'diagonal') {
      const baseRows = Math.floor((height - 2 * spacing) / (spacing + holeSize));
      const baseColumns = Math.floor((width - 2 * spacing) / (spacing + holeSize));
      
      const totalRows = Math.max(1, baseRows + (additionalRows * 2));
      const totalColumns = Math.max(1, baseColumns + (additionalColumns * 2));
      
      const centerRow = (totalRows - 1) / 2;
      const centerCol = (totalColumns - 1) / 2;
      
      for (let r_loop = 0; r_loop < totalRows; r_loop++) { // Renamed r to r_loop
        const isOddRow = r_loop % 2 === 1;
        for (let c = 0; c < totalColumns; c++) {
          if (isOddRow && c === totalColumns - 1) continue;
          
          const rowOffset = r_loop - centerRow;
          const colOffset = c - centerCol;
          
          const x = colOffset * (spacing + holeSize) + (isOddRow ? (spacing + holeSize) / 2 : 0);
          const y = rowOffset * (spacing + holeSize) * Math.sqrt(3) / 2;
          
          let currentOpeningPath: THREE.Path | null = null;

          if (holeType === 'circle') {
            currentOpeningPath = new THREE.Path();
            currentOpeningPath.absarc(x, y, holeRadius, 0, Math.PI * 2, true);
          } else { // slot
            currentOpeningPath = createSlotPath(x, y);
          }

          if (currentOpeningPath) {
            const pathPoints2D = currentOpeningPath.getPoints();
            if (pathPoints2D.length > 0) {
              const pathPoints3D = pathPoints2D.map(p => new THREE.Vector3(p.x, p.y, 0));
              const boundingBox = new THREE.Box3().setFromPoints(pathPoints3D);
              if (boundingBox.min.x >= -width / 2 && boundingBox.max.x <= width / 2 &&
                  boundingBox.min.y >= -height / 2 && boundingBox.max.y <= height / 2) {
                holes.push(currentOpeningPath);
              }
            }
          }
        }
      }
    } else if (pattern === 'radial') {
      const centerX = 0;
      const centerY = 0;
      const maxPanelRadius = Math.min(width, height) / 2 - spacing; // Renamed maxRadius to maxPanelRadius
      const baseRings = Math.floor(maxPanelRadius / (spacing + holeSize));
      
      const totalRings = Math.max(1, baseRings + additionalRows);
      
      // Add center hole/slot
      let centerOpeningPath: THREE.Path | null = null;
      if (holeType === 'circle') {
        centerOpeningPath = new THREE.Path();
        centerOpeningPath.absarc(centerX, centerY, holeRadius, 0, Math.PI * 2, true);
      } else { // slot
        // For a center slot, it should be oriented based on slotRotation or a default (e.g. horizontal)
        // createSlotPath will use the global slotRotation if no specific angle is passed.
        centerOpeningPath = createSlotPath(centerX, centerY); 
      }

      if (centerOpeningPath) {
        const centerPathPoints2D = centerOpeningPath.getPoints();
        if (centerPathPoints2D.length > 0) {
          const centerPathPoints3D = centerPathPoints2D.map(p => new THREE.Vector3(p.x, p.y, 0));
          const boundingBox = new THREE.Box3().setFromPoints(centerPathPoints3D);
           if (boundingBox.min.x >= -width / 2 && boundingBox.max.x <= width / 2 &&
               boundingBox.min.y >= -height / 2 && boundingBox.max.y <= height / 2) {
            holes.push(centerOpeningPath);
          }
        }
      }
      
      for (let r_ring = 1; r_ring <= totalRings; r_ring++) { // Renamed r to r_ring
        const currentRadius = r_ring * (spacing + holeSize); // Renamed radius to currentRadius
        if (currentRadius > maxPanelRadius && holeType === 'circle') break; // For circles, if radius is too large, stop
        // For slots, the check is more nuanced and handled by bounding box

        const circumference = 2 * Math.PI * currentRadius;
        const baseHolesInRing = Math.floor(circumference / (spacing + holeSize));
        
        const holesInRing = Math.max(4, baseHolesInRing + additionalColumns * 2);
        const angleStep = (2 * Math.PI) / holesInRing;
        
        for (let i = 0; i < holesInRing; i++) {
          const angle = i * angleStep;
          const x = centerX + currentRadius * Math.cos(angle);
          const y = centerY + currentRadius * Math.sin(angle);
          
          let currentOpeningPath: THREE.Path | null = null;

          if (holeType === 'circle') {
            currentOpeningPath = new THREE.Path();
            currentOpeningPath.absarc(x, y, holeRadius, 0, Math.PI * 2, true);
          } else { // slot - radial orientation
            currentOpeningPath = createSlotPath(x,y);
          }

          if (currentOpeningPath) {
            const pathPoints2D = currentOpeningPath.getPoints();
            if (pathPoints2D.length > 0) {
              const pathPoints3D = pathPoints2D.map(p => new THREE.Vector3(p.x, p.y, 0));
              const boundingBox = new THREE.Box3().setFromPoints(pathPoints3D);
              if (boundingBox.min.x >= -width / 2 && boundingBox.max.x <= width / 2 &&
                  boundingBox.min.y >= -height / 2 && boundingBox.max.y <= height / 2) {
                holes.push(currentOpeningPath);
              }
            }
          }
        }
      }
    }

    // Add holes to the shape
    shape.holes = holes;
    console.log('Total holes/slots created:', holes.length);
    
    // Extrude settings
    const extrudeSettings = {
      steps: 1,
      depth: thickness,
      bevelEnabled: false,
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [width, height, thickness, pattern, holeSize, spacing, additionalRows, additionalColumns, holeType, slotLength, slotRotation]);

  // Create edges for visualization
  const edges = useMemo(() => new THREE.EdgesGeometry(panelGeometry), [panelGeometry]);

  return (
    <group>
      <mesh geometry={panelGeometry} castShadow receiveShadow>
        <meshStandardMaterial 
          color="#D2B48C" 
          side={THREE.DoubleSide} 
          flatShading={true}
          transparent={false}
          opacity={1}
          metalness={0}
          roughness={0.8}
        />
      </mesh>
      <lineSegments geometry={edges} renderOrder={1}>
        <lineBasicMaterial color="#654321" linewidth={1} transparent={true} opacity={0.8} />
      </lineSegments>
    </group>
  );
};

const PerfVisualizer: React.FC<PerfVisualizerProps> = ({
  width = 600,
  height = 400,
  pattern = 'grid',
  holeSize = 20,
  spacing = 25,
  materialThickness = 18,
  additionalRows = 0,
  additionalColumns = 0,
  holeType = 'circle',
  slotLength = 40,
  slotRotation = 'horizontal'
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  
  // Log received props for PerforatedPanel (scaling happens before this component)
  console.log('[PerforatedPanel Props (scaled)]:', {
    width, height, pattern, holeSize, spacing, materialThickness, 
    additionalRows, additionalColumns, holeType, slotLength, slotRotation
  });

  // Camera control functions
  const resetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  const setTopView = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.update();
      controlsRef.current.setAzimuthalAngle(0);
      controlsRef.current.setPolarAngle(0);
    }
  }, []);

  const setFrontView = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.update();
      controlsRef.current.setAzimuthalAngle(0);
      controlsRef.current.setPolarAngle(Math.PI / 2);
    }
  }, []);

  const setSideView = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.update();
      controlsRef.current.setAzimuthalAngle(Math.PI / 2);
      controlsRef.current.setPolarAngle(Math.PI / 2);
    }
  }, []);

  // Scale all dimensions for visualization
  const scaleFactor = 1000;
  const scaledWidth = width / scaleFactor;
  const scaledHeight = height / scaleFactor;
  const scaledThickness = materialThickness / scaleFactor;
  const scaledHoleSize = holeSize / scaleFactor;
  const scaledSpacing = spacing / scaleFactor;
  const scaledSlotLength = slotLength / scaleFactor;

  console.log('[PerfVisualizer] Input Props (original):', {
    width, height, pattern, holeSize, spacing, materialThickness,
    additionalRows, additionalColumns, holeType, slotLength, slotRotation
  });
  console.log('[PerfVisualizer] Scaled Values:', { 
    scaledWidth, scaledHeight, scaledThickness, scaledHoleSize, scaledSpacing, scaledSlotLength 
  });

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 0, 1], fov: 45 }}
        style={{ background: '#f0f0f0', width: '100%', height: '100%', minHeight: '400px' }}
      >
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        {/* Perforated Panel */}
        <PerforatedPanel
          width={scaledWidth}
          height={scaledHeight}
          thickness={scaledThickness}
          pattern={pattern}
          holeSize={scaledHoleSize}
          spacing={scaledSpacing}
          additionalRows={additionalRows}
          additionalColumns={additionalColumns}
          holeType={holeType}
          slotLength={scaledSlotLength}
          slotRotation={slotRotation}
        />
        
        {/* Grid & Axes */}
        <gridHelper args={[2, 10]} position={[0, 0, -0.5]} />
        <axesHelper args={[0.5]} />
        
        {/* Controls */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.1}
          minDistance={0.5}
          maxDistance={5}
        />
      </Canvas>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <ViewControls
          resetCamera={resetCamera}
          setTopView={setTopView}
          setFrontView={setFrontView}
          setSideView={setSideView}
        />
      </div>
    </>
  );
};

export default PerfVisualizer; 