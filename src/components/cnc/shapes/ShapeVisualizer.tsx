import React, { useMemo, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Orbit, Square, RectangleHorizontal, RectangleVertical } from 'lucide-react';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface ShapeVisualizerProps {
  shapeType?: 'rectangle' | 'circle' | 'triangle' | 'hexagon';
  width?: number;
  height?: number; // Used for rectangle and triangle
  diameter?: number; // Used for circle and hexagon
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

// Custom shape component
const ShapeRenderer: React.FC<{
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'hexagon';
  width: number;
  height: number;
  diameter: number;
  thickness: number;
}> = ({ shapeType, width, height, diameter, thickness }) => {
  // Create shape geometry
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    
    if (shapeType === 'rectangle') {
      // Create rectangle shape
      shape.moveTo(-width / 2, -height / 2);
      shape.lineTo(width / 2, -height / 2);
      shape.lineTo(width / 2, height / 2);
      shape.lineTo(-width / 2, height / 2);
      shape.closePath();
    }
    else if (shapeType === 'circle') {
      // Create circle shape
      const radius = diameter / 2;
      shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    }
    else if (shapeType === 'triangle') {
      // Create triangle shape (equilateral if width not specified)
      const baseWidth = width > 0 ? width : diameter;
      const triangleHeight = height > 0 ? height : (Math.sqrt(3) / 2) * baseWidth;
      
      shape.moveTo(-baseWidth / 2, -triangleHeight / 2);
      shape.lineTo(baseWidth / 2, -triangleHeight / 2);
      shape.lineTo(0, triangleHeight / 2);
      shape.closePath();
    }
    else if (shapeType === 'hexagon') {
      // Create hexagon shape
      const radius = diameter / 2;
      const angleStep = Math.PI / 3;
      
      for (let i = 0; i < 6; i++) {
        const angle = i * angleStep;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        
        if (i === 0) {
          shape.moveTo(x, y);
        } else {
          shape.lineTo(x, y);
        }
      }
      shape.closePath();
    }
    
    // Extrude the shape
    const extrudeSettings = {
      steps: 1,
      depth: thickness,
      bevelEnabled: false,
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [shapeType, width, height, diameter, thickness]);

  // Create edges for visualization
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color="#D2B48C" side={THREE.DoubleSide} flatShading={false} />
      </mesh>
      <lineSegments geometry={edges} renderOrder={1}>
        <lineBasicMaterial color="#654321" linewidth={2.0} />
      </lineSegments>
    </group>
  );
};

const ShapeVisualizer: React.FC<ShapeVisualizerProps> = ({
  shapeType = 'rectangle',
  width = 600,
  height = 400,
  diameter = 500,
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
  const scaledDiameter = diameter / scaleFactor;
  const scaledThickness = materialThickness / scaleFactor;

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
        
        {/* Shape */}
        <ShapeRenderer
          shapeType={shapeType}
          width={scaledWidth}
          height={scaledHeight}
          diameter={scaledDiameter}
          thickness={scaledThickness}
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

export default ShapeVisualizer; 