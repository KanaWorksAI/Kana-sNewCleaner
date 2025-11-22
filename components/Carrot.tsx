import React, { useMemo } from 'react';
import { Float } from '@react-three/drei';
import { CarrotItem } from '../types';

export const Carrot: React.FC<{ item: CarrotItem }> = ({ item }) => {
  // Randomize initial rotation slightly for variety
  const rotation = useMemo(() => Math.random() * Math.PI, []);

  return (
    <group position={item.position}>
      <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5}>
        <group rotation={[0, rotation, 0]} scale={0.8}>
           {/* Body */}
           <mesh position={[0, 0.25, 0]} rotation={[Math.PI, 0, 0]}>
             <coneGeometry args={[0.2, 0.8, 8]} />
             <meshStandardMaterial color="#f97316" roughness={0.3} /> {/* Orange-500 */}
           </mesh>
           {/* Leaves */}
           <mesh position={[0, 0.65, 0]}>
             <cylinderGeometry args={[0.02, 0.08, 0.3]} />
             <meshStandardMaterial color="#22c55e" /> {/* Green-500 */}
           </mesh>
           <mesh position={[0.1, 0.75, 0]} rotation={[0, 0, -0.5]}>
             <cylinderGeometry args={[0.01, 0.04, 0.25]} />
             <meshStandardMaterial color="#22c55e" />
           </mesh>
           <mesh position={[-0.1, 0.75, 0]} rotation={[0, 0, 0.5]}>
             <cylinderGeometry args={[0.01, 0.04, 0.25]} />
             <meshStandardMaterial color="#22c55e" />
           </mesh>
           
           {/* Glow effect ground decal */}
           <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.5, 0]}>
              <circleGeometry args={[0.3, 16]} />
              <meshBasicMaterial color="#f97316" transparent opacity={0.3} depthWrite={false} />
           </mesh>
        </group>
      </Float>
    </group>
  );
};