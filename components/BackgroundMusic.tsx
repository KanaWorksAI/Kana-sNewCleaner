import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store';

// Frequencies for notes
const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00,
  X: 0 // Rest
};

// A relaxing, slow lo-fi progression (Cmaj7 - Fmaj7 vibe)
const MELODY_SEQUENCE = [
  'E4', 'X', 'G4', 'X', 'B4', 'X', 'G4', 'X',
  'C5', 'X', 'B4', 'X', 'G4', 'X', 'E4', 'X',
  'A4', 'X', 'C5', 'X', 'E5', 'X', 'C5', 'X',
  'F5', 'X', 'E5', 'X', 'C5', 'X', 'A4', 'X',
];

const BASS_SEQUENCE = [
  'C3', 'X', 'X', 'X', 'X', 'X', 'X', 'X',
  'G3', 'X', 'X', 'X', 'X', 'X', 'X', 'X',
  'F3', 'X', 'X', 'X', 'X', 'X', 'X', 'X',
  'F3', 'X', 'X', 'X', 'A3', 'X', 'X', 'X',
];

export const BackgroundMusic: React.FC = () => {
  const isMuted = useGameStore((state) => state.isMuted);
  const toggleMute = useGameStore((state) => state.toggleMute);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const stepRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Much slower tempo for relaxing vibe
  const TEMPO = 90; 
  const LOOKAHEAD = 25.0; 
  const SCHEDULE_AHEAD_TIME = 0.1; 

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    
    setHasInteracted(true);
    if (!isMuted) {
      play();
    }
  };

  const playNote = (freq: number, time: number, type: 'sine' | 'triangle', duration: number, vol: number) => {
    if (!audioCtxRef.current || isMuted) return;
    const ctx = audioCtxRef.current;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    
    // Softer Envelope (ADSR)
    // Attack: fade in gently over 0.05s
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.05);
    // Release: fade out slowly
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration + 0.5);

    osc.stop(time + duration + 0.6); // Stop after the release tail
  };

  // Removed the noisy hi-hat, replaced with a very soft "tick"
  const playSoftClick = (time: number) => {
    if (!audioCtxRef.current || isMuted) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.frequency.setValueAtTime(200, time);
    osc.frequency.exponentialRampToValueAtTime(1, time + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(time);
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.stop(time + 0.05);
  }

  const scheduler = () => {
    if (!audioCtxRef.current) return;
    
    while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + SCHEDULE_AHEAD_TIME) {
      scheduleNote(stepRef.current, nextNoteTimeRef.current);
      nextStep();
    }
    timerIDRef.current = window.setTimeout(scheduler, LOOKAHEAD);
  };

  const scheduleNote = (stepIndex: number, time: number) => {
    if (isMuted) return;

    // Melody - Sine wave for pure, flute-like sound
    const melodyNoteName = MELODY_SEQUENCE[stepIndex % MELODY_SEQUENCE.length] as keyof typeof NOTES;
    const melodyFreq = NOTES[melodyNoteName];
    if (melodyFreq > 0) {
        playNote(melodyFreq, time, 'sine', 0.4, 0.1);
    }

    // Bass - Triangle wave for soft depth
    const bassNoteName = BASS_SEQUENCE[stepIndex % BASS_SEQUENCE.length] as keyof typeof NOTES;
    const bassFreq = NOTES[bassNoteName];
    if (bassFreq > 0) {
        playNote(bassFreq, time, 'triangle', 0.8, 0.15);
    }

    // Minimalist rhythm
    if (stepIndex % 8 === 0) {
        playSoftClick(time);
    }
  };

  const nextStep = () => {
    const secondsPerBeat = 60.0 / TEMPO;
    nextNoteTimeRef.current += 0.25 * secondsPerBeat; 
    stepRef.current++;
  };

  const play = () => {
    if (!audioCtxRef.current) return;
    nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.1;
    if (timerIDRef.current) clearTimeout(timerIDRef.current);
    scheduler();
  };

  const stop = () => {
      if (timerIDRef.current) {
          clearTimeout(timerIDRef.current);
          timerIDRef.current = null;
      }
  };

  useEffect(() => {
    if (hasInteracted) {
        if (isMuted) {
            stop();
        } else {
            play();
        }
    }
    return () => stop();
  }, [isMuted, hasInteracted]);

  return (
    <div className="fixed top-6 right-6 z-50">
       {!hasInteracted ? (
         <button 
            onClick={initAudio}
            className="bg-yellow-500 text-black px-4 py-2 rounded font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all"
         >
            ♫ RELAX MODE
         </button>
       ) : (
         <button 
            onClick={toggleMute}
            className={`p-3 rounded-full border-2 border-white/20 backdrop-blur-sm transition-all ${isMuted ? 'bg-black/50 text-gray-400' : 'bg-yellow-500/20 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]'}`}
         >
            {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
            )}
         </button>
       )}
    </div>
  );
};