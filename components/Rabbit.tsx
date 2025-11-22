import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { GAME_SETTINGS } from '../types';
import { useGameStore } from '../store';

interface RabbitProps {
  setRef: (ref: THREE.Group) => void;
}

export const Rabbit: React.FC<RabbitProps> = ({ setRef }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const [direction, setDirection] = useState(1); // 1 = right, -1 = left
  const isVacuuming = useGameStore((state) => state.isVacuuming);
  
  // Controls state
  const keys = useRef<{ [key: string]: boolean }>({});

  React.useEffect(() => {
    if (groupRef.current) setRef(groupRef.current);
    
    const onKeyDown = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const onKeyUp = (e: KeyboardEvent) => (keys.current[e.code] = false);
    
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [setRef]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const speed = GAME_SETTINGS.PLAYER_SPEED * delta;
    let moved = false;
    const pos = groupRef.current.position;
    const bound = GAME_SETTINGS.FLOOR_SIZE / 2 - 0.5;

    // Get Inputs
    const inputVector = useGameStore.getState().inputVector;
    
    let vx = 0;
    let vz = 0;

    // Keyboard Input
    if (keys.current['ArrowUp'] || keys.current['KeyW']) vz -= 1;
    if (keys.current['ArrowDown'] || keys.current['KeyS']) vz += 1;
    if (keys.current['ArrowLeft'] || keys.current['KeyA']) vx -= 1;
    if (keys.current['ArrowRight'] || keys.current['KeyD']) vx += 1;

    // Joystick Input (Additive or Override)
    // If joystick is active, it usually overrides or adds to keyboard
    if (Math.abs(inputVector.x) > 0.1 || Math.abs(inputVector.z) > 0.1) {
        vx = inputVector.x;
        vz = inputVector.z;
    }

    // Normalize keyboard input if diagonal and no joystick
    if ((Math.abs(vx) > 0 || Math.abs(vz) > 0) && inputVector.x === 0 && inputVector.z === 0) {
        const length = Math.sqrt(vx*vx + vz*vz);
        if (length > 1) {
            vx /= length;
            vz /= length;
        }
    }

    // Apply Movement
    if (Math.abs(vx) > 0.01 || Math.abs(vz) > 0.01) {
        pos.x = Math.min(Math.max(pos.x + vx * speed, -bound), bound);
        pos.z = Math.min(Math.max(pos.z + vz * speed, -bound), bound);
        moved = true;

        // Update direction sprite facing
        if (vx > 0.1) setDirection(1);
        if (vx < -0.1) setDirection(-1);
    }

    // "Bobbing" animation for walking
    if (moved) {
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 15) * 0.1 + 0.6; // Base height 0.6
    } else {
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05 + 0.6; // Idle breathe
    }

    // Carrot Collection Collision Logic
    const carrots = useGameStore.getState().carrots;
    if (carrots.length > 0) {
        const removeCarrot = useGameStore.getState().removeCarrot;
        carrots.forEach(carrot => {
            const dx = pos.x - carrot.position[0];
            const dz = pos.z - carrot.position[2];
            if (dx * dx + dz * dz < 1.44) { 
                removeCarrot(carrot.id);
            }
        });
    }
  });

  // Optimize sprite texture creation
  const spriteCanvas = useMemo(() => createKanaSprite(direction), [direction]);
  const spriteTexture = useMemo(() => {
      const tex = new THREE.CanvasTexture(spriteCanvas);
      tex.minFilter = THREE.NearestFilter; // Pixel art style
      tex.magFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
  }, [spriteCanvas]);

  return (
    <group ref={groupRef} position={[0, 0.6, 0]}>
      {/* Sprite Character */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh scale={[1.2, 1.2, 1]} position={[0, 0, 0]}>
           <planeGeometry />
           <meshStandardMaterial 
             transparent 
             map={spriteTexture} 
             depthWrite={true} 
             alphaTest={0.5}
           />
        </mesh>
      </Billboard>

      {/* Vacuum Cleaner Model (Simple shapes) */}
      <group position={[direction * 0.4, -0.3, 0.2]} rotation={[0, direction === 1 ? -0.5 : 0.5, 0]}>
         {/* Handle */}
         <mesh position={[0, 0.4, 0]} rotation={[0, 0, direction * -0.5]}>
            <cylinderGeometry args={[0.03, 0.03, 0.8]} />
            <meshStandardMaterial color="#333" />
         </mesh>
         {/* Head */}
         <mesh position={[direction * 0.2, 0, 0]}>
            <boxGeometry args={[0.4, 0.15, 0.3]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.5} />
         </mesh>
         {/* Nozzle/Intake */}
         <mesh position={[direction * 0.2, -0.08, 0]}>
            <planeGeometry args={[0.3, 0.2]} />
            <meshBasicMaterial color="#000" />
         </mesh>
         
         {/* Particle Effects when vacuuming */}
         {isVacuuming && (
             <Sparkles 
                count={10} 
                scale={1} 
                size={2} 
                speed={0.4} 
                opacity={0.5} 
                color="#888" 
                position={[direction * 0.2, 0, 0]}
             />
         )}
      </group>

      {/* Shadow */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.55, 0]}>
          <circleGeometry args={[0.4, 32]} />
          {/* Shadow needs depthWrite=false to act as a decal */}
          <meshBasicMaterial color="black" transparent opacity={0.3} depthWrite={false} />
      </mesh>
    </group>
  );
};

// Helper to generate a sprite on the fly
function createKanaSprite(direction: number) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.clearRect(0, 0, 256, 256);

    ctx.save();
    if (direction === -1) {
        ctx.translate(256, 0);
        ctx.scale(-1, 1);
    }

    // Draw Ears
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(80, 60, 20, 50, -0.2, 0, Math.PI * 2);
    ctx.ellipse(176, 60, 20, 50, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(80, 60, 10, 30, -0.2, 0, Math.PI * 2);
    ctx.ellipse(176, 60, 10, 30, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Head
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(128, 120, 60, 0, Math.PI * 2);
    ctx.fill();

    // Eye (Right - Normal)
    ctx.fillStyle = '#0066cc';
    ctx.beginPath();
    ctx.arc(150, 115, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(154, 112, 4, 0, Math.PI * 2);
    ctx.fill();

    // Eye (Left - Cybernetic Red)
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(106, 115, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(106, 115, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Jacket (Yellow)
    ctx.fillStyle = '#fbbf24'; 
    ctx.beginPath();
    ctx.roundRect(68, 160, 120, 90, 20);
    ctx.fill();

    // Zipper
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(128, 160);
    ctx.lineTo(128, 250);
    ctx.stroke();

    // "KANA" text
    ctx.fillStyle = '#111';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('KANA', 140, 190);

    ctx.restore();
    return canvas;
}