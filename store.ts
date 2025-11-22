import { create } from 'zustand';
import { GameState, CarrotItem, InputVector } from './types';

interface GameStore extends GameState {
  isMuted: boolean;
  toggleMute: () => void;
  carrots: CarrotItem[];
  carrotsCollected: number;
  addCarrot: (carrot: CarrotItem) => void;
  removeCarrot: (id: string) => void;
  inputVector: InputVector;
  setInputVector: (vector: InputVector) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  cleanedPercentage: 0,
  setCleanedPercentage: (val) => set({ cleanedPercentage: val }),
  isVacuuming: false,
  setIsVacuuming: (val) => set({ isVacuuming: val }),
  isMuted: false,
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  carrots: [],
  carrotsCollected: 0,
  addCarrot: (carrot) => set((state) => {
    // Prevent duplicates or too many items if needed, though logic is mainly in Floor
    return { carrots: [...state.carrots, carrot] };
  }),
  removeCarrot: (id) => set((state) => {
    if (state.carrots.find((c) => c.id === id)) {
      return {
        carrots: state.carrots.filter((c) => c.id !== id),
        carrotsCollected: state.carrotsCollected + 1,
      };
    }
    return {};
  }),
  inputVector: { x: 0, z: 0 },
  setInputVector: (vector) => set({ inputVector: vector }),
}));