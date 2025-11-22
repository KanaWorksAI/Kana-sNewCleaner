import React, { useEffect, useState, useCallback } from 'react';
import { GameScene } from './components/GameScene';
import { useGameStore } from './store';
import { generateMissionBrief } from './services/geminiService';
import { BackgroundMusic } from './components/BackgroundMusic';
import { Joystick } from './components/Joystick';

// UI Icons
const VacuumIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const CarrotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-orange-500">
    <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v1.575l-.75-.75a6.75 6.75 0 00-9.54 9.54l.375.375a.75.75 0 001.06 0l3-3a.75.75 0 000-1.06l-.75-.75a4.5 4.5 0 016.36-6.36l1.25 1.25v-1.875c0-1.035.84-1.875 1.875-1.875s1.875.84 1.875 1.875V4.5l.75-.75a2.25 2.25 0 10-3.18-3.18l-.75.75V4.125c0-1.035-.84-1.875-1.875-1.875z" />
    <path d="M9.53 16.124a.75.75 0 00-1.06 1.06l.92.92c1.609 1.609 4.154 1.745 5.87.405a.75.75 0 00-.936-1.187 2.438 2.438 0 01-3.87-.242l-.924-.956z" />
    <path d="M6.355 12.95a.75.75 0 00-1.063.068l-1.17 1.365a2.625 2.625 0 103.938 3.45l1.364-1.17a.75.75 0 10-1.004-1.138l-1.363 1.17a1.125 1.125 0 01-1.688-1.48l1.168-1.364a.75.75 0 00.06-1.064.75.75 0 00-.242-.836z" />
  </svg>
);

const App: React.FC = () => {
  const cleanedPercentage = useGameStore((state) => state.cleanedPercentage);
  const carrotsCollected = useGameStore((state) => state.carrotsCollected);
  const [missionText, setMissionText] = useState("Initializing KANA System...");
  const [loading, setLoading] = useState(false);

  const fetchBrief = useCallback(async (score: number) => {
    setLoading(true);
    const text = await generateMissionBrief(score);
    setMissionText(text);
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    fetchBrief(0);
  }, [fetchBrief]);

  // Trigger Gemini comment on milestones
  useEffect(() => {
    if (cleanedPercentage > 0 && cleanedPercentage < 100 && cleanedPercentage % 25 === 0) {
      fetchBrief(cleanedPercentage);
    }
  }, [cleanedPercentage, fetchBrief]);

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden font-mono select-none">
      {/* Audio Controller */}
      <BackgroundMusic />

      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <GameScene />
      </div>

      {/* Joystick Layer - Covers entire screen for touch input */}
      <Joystick />

      {/* HUD Layer - Pointer events none ensures clicks pass through to joystick if needed, 
          but specific interactive elements have pointer-events-auto */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Top Bar: Mission Brief */}
        <div className="flex justify-between items-start pointer-events-auto">
           <div className="bg-black/80 backdrop-blur-md border border-yellow-500 p-4 rounded-lg max-w-md shadow-[0_0_15px_rgba(234,179,8,0.3)] transform transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                 <h2 className="text-yellow-500 font-bold text-sm tracking-widest uppercase">Incoming Transmission</h2>
              </div>
              <p className={`text-white text-lg leading-snug ${loading ? 'animate-pulse opacity-50' : ''}`}>
                "{missionText}"
              </p>
           </div>

           {/* Controls Hint */}
           <div className="bg-black/50 text-white/70 p-3 rounded text-xs border border-white/10 mt-12 hidden md:block">
              <p>WASD / ARROWS to Move</p>
              <p>Vacuum is AUTO-ENGAGED</p>
           </div>
        </div>

        {/* Bottom Bar: Stats */}
        <div className="flex items-end gap-4 pointer-events-auto">
           {/* Progress Circle */}
           <div className="relative w-24 h-24 md:w-32 md:h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-800"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] transition-all duration-500 ease-out"
                  strokeDasharray={`${cleanedPercentage}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                 <span className="text-2xl md:text-3xl font-bold">{cleanedPercentage}%</span>
                 <span className="text-[10px] md:text-xs text-gray-400 uppercase">Cleaned</span>
              </div>
           </div>
           
           {/* Carrot Counter */}
           <div className="bg-black/80 border border-orange-500/50 px-4 py-3 rounded-lg font-bold flex items-center gap-3 shadow-lg mb-2">
             <CarrotIcon />
             <div className="flex flex-col">
                <span className="text-2xl text-orange-400 leading-none">{carrotsCollected}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Carrots</span>
             </div>
           </div>

           {/* Character Tag */}
           <div className="hidden md:flex bg-yellow-500 text-black px-6 py-2 rounded-tr-xl rounded-bl-xl font-bold items-center gap-2 shadow-lg mb-2">
             <VacuumIcon />
             <span>UNIT: KANA-01</span>
           </div>
        </div>
      </div>

      {/* Victory Modal */}
      {cleanedPercentage === 100 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500 pointer-events-auto">
          <div className="bg-gray-900 border-2 border-yellow-500 p-8 rounded-lg text-center shadow-[0_0_50px_rgba(234,179,8,0.5)] max-w-md mx-4 relative overflow-hidden">
             {/* Shine effect */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-[shimmer_2s_infinite]"></div>
             
             <div className="text-6xl mb-4 animate-bounce">✨🐇✨</div>
             <h1 className="text-4xl font-bold text-yellow-400 mb-2 tracking-tighter">MISSION COMPLETE</h1>
             <div className="h-1 w-16 mx-auto bg-yellow-500 mb-6"></div>
             
             <p className="text-gray-300 text-lg mb-6">The area has been fully sanitized.</p>
             <p className="text-orange-400 text-lg font-bold mb-6">Carrots Collected: {carrotsCollected}</p>
             
             <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded mb-8">
               <p className="text-yellow-300 font-bold text-lg italic">
                 "That vacuum cleaner quality is absolutely top-tier!"
               </p>
             </div>
             
             <button
               onClick={() => window.location.reload()}
               className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded transition-all transform hover:scale-105 hover:shadow-lg active:scale-95"
             >
               NEXT ZONE
             </button>
          </div>
        </div>
      )}
      
      {/* Vignette Overlay for atmosphere */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]"></div>
      
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[5] bg-[length:100%_4px,3px_100%] opacity-20"></div>
    </div>
  );
};

export default App;