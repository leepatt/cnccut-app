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

// Custom perforated panel component
const PerforatedPanel: React.FC<{
  width: number;
  height: number;
  thickness: number;
  pattern: 'grid' | 'diagonal' | 'radial';
  holeSize: number;
  spacing: number;
}> = ({ width, height, thickness, pattern, holeSize, spacing }) => {
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
    const holeRadius = holeSize / 2;

    // Different hole patterns
    if (pattern === 'grid') {
      // Grid pattern
      for (let x = -width / 2 + spacing; x < width / 2 - spacing; x += spacing + holeSize) {
        for (let y = -height / 2 + spacing; y < height / 2 - spacing; y += spacing + holeSize) {
          const holePath = new THREE.Path();
          holePath.absarc(x, y, holeRadius, 0, Math.PI * 2, true);
          holes.push(holePath);
        }
      }
    } else if (pattern === 'diagonal') {
      // Diagonal pattern
      let row = 0;
      for (let y = -height / 2 + spacing; y < height / 2 - spacing; y += spacing + holeSize) {
        const offset = row % 2 === 0 ? 0 : (spacing + holeSize) / 2;
        for (let x = -width / 2 + spacing + offset; x < width / 2 - spacing; x += spacing + holeSize) {
          const holePath = new THREE.Path();
          holePath.absarc(x, y, holeRadius, 0, Math.PI * 2, true);
          holes.push(holePath);
        }
        row++;
      }
    } else if (pattern === 'radial') {
      // Radial pattern
      const centerX = 0;
      const centerY = 0;
      const maxRadius = Math.min(width, height) / 2 - spacing;
      
      for (let r = spacing + holeSize; r <= maxRadius; r += spacing + holeSize) {
        const circumference = 2 * Math.PI * r;
        const numHoles = Math.floor(circumference / (holeSize + spacing));
        const angleStep = (2 * Math.PI) / numHoles;
        
        for (let i = 0; i < numHoles; i++) {
          const angle = i * angleStep;
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          
          const holePath = new THREE.Path();
          holePath.absarc(x, y, holeRadius, 0, Math.PI * 2, true);
          holes.push(holePath);
        }
      }
      
      // Add center hole
      const centerHole = new THREE.Path();
      centerHole.absarc(centerX, centerY, holeRadius, 0, Math.PI * 2, true);
      holes.push(centerHole);
    }

    // Add holes to the shape
    shape.holes = holes;
    
    // Extrude the shape
    const extrudeSettings = {
      steps: 1,
      depth: thickness,
      bevelEnabled: false,
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [width, height, thickness, pattern, holeSize, spacing]);

  // Create edges for visualization
  const edges = useMemo(() => new THREE.EdgesGeometry(panelGeometry), [panelGeometry]);

  return (
    <group>
      <mesh geometry={panelGeometry} castShadow receiveShadow>
        <meshStandardMaterial color="#D2B48C" side={THREE.DoubleSide} flatShading={false} />
      </mesh>
      <lineSegments geometry={edges} renderOrder={1}>
        <lineBasicMaterial color="#654321" linewidth={2.0} />
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
  materialThickness = 18
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  
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
      
      {/* View Controls UI */}
      <ViewControls
        resetCamera={resetCamera}
        setTopView={setTopView}
        setFrontView={setFrontView}
        setSideView={setSideView}
      />
    </>
  );
};

export default PerfVisualizer; 