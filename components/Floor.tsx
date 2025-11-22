import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GAME_SETTINGS } from '../types';
import { useGameStore } from '../store';

interface FloorProps {
  rabbitRef: React.RefObject<THREE.Group>;
}

export const Floor: React.FC<FloorProps> = ({ rabbitRef }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  // Create canvas element only once
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const frameCount = useRef(0);
  
  const setCleanedPercentage = useGameStore((state) => state.setCleanedPercentage);
  const setIsVacuuming = useGameStore((state) => state.setIsVacuuming);
  const addCarrot = useGameStore((state) => state.addCarrot);

  // Use memo to create texture once and keep reference stable
  const dirtTexture = useMemo(() => {
    const tex = new THREE.CanvasTexture(canvasRef.current);
    // Optimize texture updates
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, []);

  // Initialize dirty texture
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = GAME_SETTINGS.TEXTURE_SIZE;
    canvas.height = GAME_SETTINGS.TEXTURE_SIZE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); // Optimize for getImageData
    
    if (ctx) {
      ctxRef.current = ctx;
      // Fill with "dirt" - a noise pattern
      ctx.fillStyle = '#3a3530'; // Dark brown base
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add noise
      for (let i = 0; i < 5000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#292520' : '#4a4030';
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 4 + 1;
        ctx.fillRect(x, y, size, size);
      }
      
      // Add some "stains"
      for (let i = 0; i < 20; i++) {
         ctx.fillStyle = 'rgba(20, 15, 10, 0.5)';
         const x = Math.random() * canvas.width;
         const y = Math.random() * canvas.height;
         const radius = Math.random() * 30 + 10;
         ctx.beginPath();
         ctx.arc(x, y, radius, 0, Math.PI * 2);
         ctx.fill();
      }
      // Initial update
      dirtTexture.needsUpdate = true;
    }
  }, [dirtTexture]);

  // Cleaning logic loop
  useFrame(() => {
    if (!rabbitRef.current || !ctxRef.current) return;

    const rabbitPos = rabbitRef.current.position;
    
    // Map World Position to Texture UV Coordinates
    const halfSize = GAME_SETTINGS.FLOOR_SIZE / 2;
    
    // Normalize x/z to 0..1
    const u = (rabbitPos.x + halfSize) / GAME_SETTINGS.FLOOR_SIZE;
    const v = (rabbitPos.z + halfSize) / GAME_SETTINGS.FLOOR_SIZE;

    // Check bounds
    if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
      const tx = u * GAME_SETTINGS.TEXTURE_SIZE;
      const ty = v * GAME_SETTINGS.TEXTURE_SIZE;

      const ctx = ctxRef.current;
      
      // "Vacuum" effect: erase the dirt
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(tx, ty, GAME_SETTINGS.CLEANING_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';

      // Mark texture for update
      dirtTexture.needsUpdate = true;
      setIsVacuuming(true);
      
      // Spawn Carrot Logic
      // 2% chance per frame while vacuuming to spawn a carrot
      // Limit max carrots on screen to avoid clutter (e.g. 10 max)
      if (Math.random() < 0.02 && useGameStore.getState().carrots.length < 15) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 1.0 + Math.random() * 2.0; // Random distance around rabbit
          const cx = rabbitPos.x + Math.cos(angle) * dist;
          const cz = rabbitPos.z + Math.sin(angle) * dist;
          
          const bound = GAME_SETTINGS.FLOOR_SIZE / 2 - 1;
          if (Math.abs(cx) < bound && Math.abs(cz) < bound) {
             // Convert candidate position to texture space
             const cu = (cx + halfSize) / GAME_SETTINGS.FLOOR_SIZE;
             const cv = (cz + halfSize) / GAME_SETTINGS.FLOOR_SIZE;
             
             const ctxX = Math.floor(cu * GAME_SETTINGS.TEXTURE_SIZE);
             const ctxY = Math.floor(cv * GAME_SETTINGS.TEXTURE_SIZE);
             
             // Check if this spot is actually clean (Alpha should be 0)
             // getting 1x1 pixel data is fast enough for infrequent calls
             const pixel = ctx.getImageData(ctxX, ctxY, 1, 1).data;
             
             // pixel[3] is Alpha. If 0, it's fully transparent (cleaned).
             if (pixel[3] === 0) {
                addCarrot({
                    id: Math.random().toString(36).substr(2, 9),
                    position: [cx, 0.5, cz]
                });
             }
          }
      }

      // Performance optimization: calculate percentage every 30 frames (approx 0.5s)
      frameCount.current++;
      if (frameCount.current % 30 === 0) {
         calculateScore();
      }
    } else {
        setIsVacuuming(false);
    }
  });

  const calculateScore = () => {
      if (!ctxRef.current) return;
      // Get image data (expensive, do sparingly)
      const imageData = ctxRef.current.getImageData(0, 0, GAME_SETTINGS.TEXTURE_SIZE, GAME_SETTINGS.TEXTURE_SIZE);
      const data = imageData.data;
      let transparencyCount = 0;
      // Step by 4 (RGBA) * stepFactor to save time
      const step = 4 * 10; 
      for (let i = 3; i < data.length; i += step) {
          if (data[i] === 0) { // Alpha is 0 (erased)
              transparencyCount++;
          }
      }
      const totalPixels = data.length / step;
      const percentage = Math.min(100, Math.round((transparencyCount / totalPixels) * 100));
      setCleanedPercentage(percentage);
  };

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
       {/* The "Clean" floor underneath */}
       <mesh position={[0, 0, -0.2]}>
          <planeGeometry args={[GAME_SETTINGS.FLOOR_SIZE, GAME_SETTINGS.FLOOR_SIZE]} />
          <meshStandardMaterial color="#f0e6d2" /> 
       </mesh>

       {/* The "Dirty" floor layer on top */}
       <mesh ref={meshRef} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[GAME_SETTINGS.FLOOR_SIZE, GAME_SETTINGS.FLOOR_SIZE]} />
          <meshStandardMaterial 
            transparent 
            opacity={0.95} 
            color="#ffffff" 
            map={dirtTexture} 
            alphaTest={0.01} // Low alpha test to allow smooth edges
          />
       </mesh>
    </group>
  );
};