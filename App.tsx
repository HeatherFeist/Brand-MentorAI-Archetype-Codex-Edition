
import React, { useState, useEffect } from 'react';
import CodexConstellation from './components/CodexConstellation';
import MentorPanel from './components/MentorPanel';
import Onboarding from './components/Onboarding';
import { AppMode, UserProfile, OnboardingData } from './types';
import { deriveProfileFromOnboarding } from './services/codexGeometry';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('aura');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isNewUser, setIsNewUser] = useState(true);
  const [animateBars, setAnimateBars] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);

  useEffect(() => {
    if (profile) {
      setAnimateBars(false);
      const timer = setTimeout(() => setAnimateBars(true), 500);
      return () => clearTimeout(timer);
    }
  }, [profile]);

  const handleOnboarding = (data: OnboardingData) => {
    try {
      const derived = deriveProfileFromOnboarding(data);
      setProfile(derived);
      setIsNewUser(false);
      setIsCalibrating(true); // Flag to auto-start the voice intro
    } catch (err) {
      console.error("Calibration failed:", err);
    }
  };

  const placeholderProfile: UserProfile = { 
    name: '...', 
    sunRelAngle: 0, 
    moonRelAngle: 0, 
    risingRelAngle: 0, 
    jupiterRelAngle: 0,
    circleBand: 0, 
    activationStrength: 0.1,
    lifePathNumber: 0,
    destinyNumber: 0,
    businessCodexValue: 0,
    sunSign: '',
    moonSign: ''
  };

  if (isNewUser || !profile) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-black flex items-center justify-center">
        <CodexConstellation 
          profile={placeholderProfile} 
          mode="logo" 
        />
        <Onboarding onComplete={handleOnboarding} />
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden text-white font-sans selection:bg-amber-500/30 bg-black">
      
      {/* BACKGROUND GEOMETRY */}
      <CodexConstellation profile={profile} mode={mode} />

      {/* OVERLAY UI */}
      <div className="relative z-10 w-full h-full flex flex-col pointer-events-none">
        
        {/* HEADER */}
        <header className="p-10 md:p-14 flex flex-col md:flex-row justify-between items-start md:items-center pointer-events-auto">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-6xl font-serif tracking-tighter text-white/95 uppercase transition-colors duration-1000">
              CODEXED <span className="text-amber-200/90 italic">IDENTITY</span>
            </h1>
            <p className="text-[9px] text-amber-500/60 uppercase tracking-[0.6em] font-bold pl-1 animate-pulse">
              Geometric Business Archetypes
            </p>
          </div>

          <nav className="mt-8 md:mt-0 flex flex-col items-end gap-3">
            <div className="flex gap-2 p-1.5 bg-white/5 backdrop-blur-3xl rounded-full border border-white/5 shadow-2xl">
              <button
                onClick={() => setIsNewUser(true)}
                className="px-8 py-2.5 rounded-full text-[10px] uppercase tracking-widest text-gray-400 hover:text-white transition-all"
              >
                Reset Calibration
              </button>
              <div className="px-8 py-2.5 rounded-full text-[10px] uppercase tracking-widest bg-white text-black font-black">
                {profile.name}
              </div>
            </div>
            <div className="flex gap-6 pr-6 items-center">
              <div className="flex flex-col items-end">
                <span className="text-[7px] text-amber-500/50 uppercase tracking-widest font-bold">Codexed Identity</span>
                <span className="text-3xl font-serif italic text-amber-200 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                  {profile.businessCodexValue}
                </span>
              </div>
              <div className="h-8 w-px bg-white/10"></div>
              <div className="flex flex-col items-start gap-1">
                <span className="text-[8px] text-gray-500 uppercase tracking-widest">LP: <b className="text-white">{profile.lifePathNumber}</b></span>
                <span className="text-[8px] text-gray-500 uppercase tracking-widest">DS: <b className="text-white">{profile.destinyNumber}</b></span>
              </div>
            </div>
          </nav>
        </header>

        {/* MENTOR COMPONENT */}
        <div className="flex-1 px-10 md:px-14 flex items-center justify-end">
          <div className="pointer-events-auto w-full max-w-sm">
            <MentorPanel profile={profile} autoTrigger={isCalibrating} />
          </div>
        </div>

        {/* FOOTER METADATA */}
        <footer className="p-10 md:p-14 flex flex-col md:flex-row justify-between items-end gap-10 pointer-events-auto">
          <div className="blur-reveal p-8 rounded-[2.5rem] w-full max-w-xs space-y-8 shadow-2xl">
             <div className="space-y-3">
               <h4 className="text-[10px] text-amber-500/60 uppercase tracking-widest font-black">Aura Configuration</h4>
               <div className="flex gap-2">
                 {['logo', 'aura', 'explain'].map(m => (
                    <button 
                      key={m} 
                      onClick={() => setMode(m as AppMode)}
                      className={`text-[9px] uppercase tracking-tighter px-4 py-2 rounded-full border transition-all ${mode === m ? 'border-amber-200 text-amber-200 bg-amber-200/5 shadow-inner' : 'border-white/10 text-gray-500 hover:text-gray-300'}`}
                    >
                      {m}
                    </button>
                 ))}
               </div>
             </div>
             
             {/* Progress Bars with slide and fade */}
             <div className={`space-y-7 transition-all duration-[1200ms] ease-out ${animateBars ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                <div className="space-y-2 group">
                  <div className="flex justify-between text-[9px] text-gray-500 uppercase tracking-widest transition-colors group-hover:text-amber-200">
                    <span>Executive Alignment</span>
                    <span className="text-amber-200 font-bold">{profile.moonRelAngle?.toFixed(1)}°</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full relative overflow-hidden">
                    <div 
                      className={`absolute h-full bg-amber-200 transition-all duration-[2000ms] ease-in-out ${animateBars ? 'animate-bar-glow' : ''}`} 
                      style={{ width: animateBars ? `${((profile.moonRelAngle ?? 0) / 360) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
                <div className="space-y-2 group">
                  <div className="flex justify-between text-[9px] text-gray-500 uppercase tracking-widest transition-colors group-hover:text-white">
                    <span>Business Ignition</span>
                    <span className="text-white font-bold">{Math.round(profile.activationStrength * 100)}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full relative overflow-hidden">
                    <div 
                      className={`absolute h-full bg-white transition-all duration-[2500ms] ease-in-out shadow-[0_0_10px_white]`} 
                      style={{ width: animateBars ? `${profile.activationStrength * 100}%` : '0%' }}
                    />
                  </div>
                </div>
             </div>
          </div>

          <div className="text-right space-y-2 opacity-50 transition-opacity hover:opacity-100 duration-1000">
            <p className="text-[10px] uppercase tracking-[0.5em] font-black text-white">Codexed Engine v10.0</p>
            <p className="text-[9px] text-gray-600 max-w-[240px] leading-relaxed font-medium">
              Deterministic bearing-ring intersection engine. <br/>
              Master Identity <b>{profile.businessCodexValue}</b> mapped to zodiacal zen.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
