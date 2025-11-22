import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment, ContactShadows, OrbitControls } from '@react-three/drei';
import { Floor } from './Floor';
import { Rabbit } from './Rabbit';
import { Carrot } from './Carrot';
import { useGameStore } from '../store';
import * as THREE from 'three';

export const GameScene: React.FC = () => {
  const [rabbitRef, setRabbitRef] = useState<THREE.Group | null>(null);
  const carrots = useGameStore((state) => state.carrots);

  return (
    <Canvas shadows dpr={[1, 2]}>
      {/* Camera moved back to keep everything in view, with optimized near/far for mobile depth precision */}
      <PerspectiveCamera makeDefault position={[0, 18, 18]} fov={40} near={5} far={60} />
      <OrbitControls 
        enableRotate={false} 
        enableZoom={false} 
        target={[0, 0, 0]}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 3}
      />

      {/* Lighting - Adjusted for visibility */}
      <ambientLight intensity={0.8} />
      <directionalLight 
        position={[10, 20, 5]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[1024, 1024]} 
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <Environment preset="city" />

      {/* Game Objects */}
      <Rabbit setRef={(ref) => setRabbitRef(ref)} />
      
      {/* Pass rabbit ref to floor so it knows where to clean */}
      {rabbitRef && <Floor rabbitRef={{ current: rabbitRef }} />}

      {/* Render spawned carrots */}
      {carrots.map((carrot) => (
        <Carrot key={carrot.id} item={carrot} />
      ))}

      {/* FX - Lifted slightly to avoid Z-fighting with floor */}
      <ContactShadows position={[0, 0.02, 0]} resolution={512} scale={30} blur={2} opacity={0.25} far={10} color="#000000" />
      
      {/* Background/Fog - Adjusted to [15, 50] to be visible but not overwhelming */}
      <color attach="background" args={['#1a1a1a']} />
      <fog attach="fog" args={['#1a1a1a', 15, 50]} />
    </Canvas>
  );
};