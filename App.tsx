
import React, { useState } from 'react';
import CodexConstellation from './components/CodexConstellation';
import MentorPanel from './components/MentorPanel';
import Onboarding from './components/Onboarding';
import { AppMode, UserProfile, OnboardingData } from './types';
import { deriveProfileFromOnboarding } from './services/codexGeometry';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('aura');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isNewUser, setIsNewUser] = useState(true);

  const handleOnboarding = (data: OnboardingData) => {
    const derived = deriveProfileFromOnboarding(data);
    setProfile(derived);
    setIsNewUser(false);
  };

  if (isNewUser || !profile) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-black flex items-center justify-center">
        {/* Added missing jupiterRelAngle property to match UserProfile definition */}
        <CodexConstellation 
          profile={{ 
            name: '...', 
            sunRelAngle: 0, 
            moonRelAngle: null, 
            risingRelAngle: null, 
            jupiterRelAngle: null,
            circleBand: 0, 
            activationStrength: 0,
            lifePathNumber: 0,
            destinyNumber: 0,
            businessCodexValue: 0,
            sunSign: '',
            moonSign: ''
          }} 
          mode="logo" 
        />
        <Onboarding onComplete={handleOnboarding} />
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden text-white font-sans selection:bg-amber-500/30 bg-black">
      
      {/* BACKGROUND LAYER */}
      <CodexConstellation profile={profile} mode={mode} />

      {/* UI OVERLAY LAYER */}
      <div className="relative z-10 w-full h-full flex flex-col pointer-events-none">
        
        {/* TOP: Header & Nav */}
        <header className="p-10 md:p-14 flex flex-col md:flex-row justify-between items-start md:items-center pointer-events-auto">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-6xl font-serif tracking-tighter text-white/95 uppercase">
              CODED <span className="text-amber-200/90 italic">IDENTITY</span>
            </h1>
            <p className="text-[9px] text-amber-500/50 uppercase tracking-[0.6em] font-bold pl-1">
              Geometric Business Archetypes
            </p>
          </div>

          <nav className="mt-8 md:mt-0 flex flex-col items-end gap-3">
            <div className="flex gap-2 p-1.5 bg-white/5 backdrop-blur-3xl rounded-full border border-white/5 shadow-2xl">
              <button
                onClick={() => setIsNewUser(true)}
                className="px-8 py-2.5 rounded-full text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-all"
              >
                Reset Calibration
              </button>
              <div className="px-8 py-2.5 rounded-full text-[10px] uppercase tracking-widest bg-white text-black font-black">
                {profile.name}
              </div>
            </div>
            <div className="flex gap-6 pr-6 items-center">
              <div className="flex flex-col items-end">
                <span className="text-[7px] text-amber-500/50 uppercase tracking-widest font-bold">Codex Identity</span>
                <span className="text-xl font-serif italic text-amber-200">{profile.businessCodexValue}</span>
              </div>
              <div className="h-8 w-px bg-white/10"></div>
              <div className="flex flex-col items-start gap-1">
                <span className="text-[8px] text-gray-500 uppercase tracking-widest">Life Path: <b className="text-white">{profile.lifePathNumber}</b></span>
                <span className="text-[8px] text-gray-500 uppercase tracking-widest">Destiny: <b className="text-white">{profile.destinyNumber}</b></span>
              </div>
            </div>
          </nav>
        </header>

        {/* MIDDLE: Main Layout Content */}
        <div className="flex-1 px-10 md:px-14 flex items-center justify-end">
          {/* Floating Mentor Panel */}
          <div className="pointer-events-auto w-full max-w-sm">
            <MentorPanel profile={profile} />
          </div>
        </div>

        {/* BOTTOM: Controls & Metadata */}
        <footer className="p-10 md:p-14 flex flex-col md:flex-row justify-between items-end gap-10 pointer-events-auto">
          <div className="blur-reveal p-8 rounded-[2rem] max-w-xs space-y-6 border border-white/5 shadow-2xl">
             <div className="space-y-2">
               <h4 className="text-[10px] text-amber-500/60 uppercase tracking-widest font-black">Geometric Aura</h4>
               <div className="flex gap-2">
                 {['logo', 'aura', 'explain'].map(m => (
                    <button 
                      key={m} 
                      onClick={() => setMode(m as AppMode)}
                      className={`text-[9px] uppercase tracking-tighter px-3 py-1.5 rounded-full border transition-all ${mode === m ? 'border-amber-200 text-amber-200 bg-amber-200/5' : 'border-white/10 text-gray-600 hover:text-gray-300'}`}
                    >
                      {m}
                    </button>
                 ))}
               </div>
             </div>
             
             <div className="space-y-5 pt-2 animate-fade-in">
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] text-gray-500 uppercase tracking-widest">
                    <span>Executive Alignment</span>
                    <span className="text-amber-200">{profile.moonRelAngle?.toFixed(1)}°</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-lg relative overflow-hidden">
                    <div 
                      className="absolute h-full bg-amber-200 transition-all duration-1000 shadow-[0_0_10px_rgba(251,191,36,0.5)]" 
                      style={{ width: `${((profile.moonRelAngle ?? 0) / 360) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] text-gray-500 uppercase tracking-widest">
                    <span>Business Ignition</span>
                    <span className="text-amber-200">{Math.round(profile.activationStrength * 100)}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-lg relative overflow-hidden">
                    <div 
                      className="absolute h-full bg-white transition-all duration-1000" 
                      style={{ width: `${profile.activationStrength * 100}%` }}
                    />
                  </div>
                </div>
             </div>
          </div>

          <div className="text-right space-y-2 opacity-50 transition-opacity hover:opacity-100 duration-1000">
            <p className="text-[10px] uppercase tracking-[0.5em] font-black text-white">Codex Identity v6.0</p>
            <p className="text-[9px] text-gray-500 max-w-[240px] leading-relaxed font-medium">
              A premium synthesis of master numerology and holographic geometry. Optimized for high-potential market leaders.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
