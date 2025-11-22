import React, { useRef, useState, useEffect } from 'react';
import { useGameStore } from '../store';

export const Joystick: React.FC = () => {
  const setInputVector = useGameStore((state) => state.setInputVector);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [active, setActive] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [current, setCurrent] = useState({ x: 0, y: 0 });
  
  // Joystick configuration
  const MAX_RADIUS = 50;

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only enable for primary touch or left mouse
    if (!e.isPrimary) return;

    const clientX = e.clientX;
    const clientY = e.clientY;

    setActive(true);
    setOrigin({ x: clientX, y: clientY });
    setCurrent({ x: clientX, y: clientY });
    setInputVector({ x: 0, z: 0 });
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!active) return;

    const dx = e.clientX - origin.x;
    const dy = e.clientY - origin.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate clamped position for visual stick
    let clampedDistance = distance;
    let normalX = 0;
    let normalY = 0;

    if (distance > 0) {
        if (distance > MAX_RADIUS) {
            clampedDistance = MAX_RADIUS;
        }
        normalX = dx / distance;
        normalY = dy / distance;
    }

    const stickX = origin.x + normalX * clampedDistance;
    const stickY = origin.y + normalY * clampedDistance;

    setCurrent({ x: stickX, y: stickY });

    // Update store with normalized vector (-1 to 1)
    // We map screen Y to game Z
    setInputVector({ 
        x: normalX * (clampedDistance / MAX_RADIUS), 
        z: normalY * (clampedDistance / MAX_RADIUS) 
    });
  };

  const handlePointerUp = () => {
    setActive(false);
    setInputVector({ x: 0, z: 0 });
  };

  useEffect(() => {
    // Attach global listeners for move/up to handle dragging outside container
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [active, origin]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-40 touch-none"
      onPointerDown={handlePointerDown}
    >
      {active && (
        <>
          {/* Joystick Base */}
          <div 
            className="absolute w-24 h-24 rounded-full border-2 border-white/20 bg-black/30 backdrop-blur-sm transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: origin.x, top: origin.y }}
          />
          {/* Joystick Stick */}
          <div 
            className="absolute w-12 h-12 rounded-full bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: current.x, top: current.y }}
          />
        </>
      )}
      
      {/* Hint for user if not active */}
      {!active && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/30 text-sm pointer-events-none animate-pulse">
           TOUCH & DRAG TO MOVE
        </div>
      )}
    </div>
  );
};