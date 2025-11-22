import { ThreeElements } from '@react-three/fiber';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface CarrotItem {
  id: string;
  position: [number, number, number];
}

export interface InputVector {
  x: number;
  z: number;
}

export const GAME_SETTINGS = {
  FLOOR_SIZE: 16,
  TEXTURE_SIZE: 512,
  CLEANING_RADIUS: 25, // in texture pixels
  PLAYER_SPEED: 5,
};

export interface GameState {
  cleanedPercentage: number;
  setCleanedPercentage: (val: number) => void;
  isVacuuming: boolean;
  setIsVacuuming: (val: boolean) => void;
}

// Fix for R3F types not automatically extending JSX.IntrinsicElements in the current environment
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      [elemName: string]: any;
    }
  }
}