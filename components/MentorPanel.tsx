
import React, { useState, useRef, useEffect } from 'react';
import { 
  getBrandMentorAdvice, 
  getProfileNarrative, 
  getInitialCalibrationNarrative,
  playCalmNarration 
} from '../services/geminiService';
import { UserProfile } from '../types';

interface MentorPanelProps {
  profile: UserProfile;
  autoTrigger?: boolean;
}

type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused';

const MentorPanel: React.FC<MentorPanelProps> = ({ profile, autoTrigger }) => {
  const [content, setContent] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [activeType, setActiveType] = useState<'advice' | 'narrative' | 'initial' | null>(null);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const audioRef = useRef<{ source: AudioBufferSourceNode, context: AudioContext } | null>(null);

  // Trigger initial calibration automatically if requested
  useEffect(() => {
    if (autoTrigger && playbackState === 'idle' && !content) {
      handleAction('initial');
    }
  }, [autoTrigger]);

  const stopNarration = () => {
    if (audioRef.current) {
      try { audioRef.current.source.stop(); } catch (e) {}
      if (audioRef.current.context.state === 'suspended') {
        audioRef.current.context.resume();
      }
      audioRef.current = null;
    }
    setPlaybackState('idle');
  };

  const togglePause = async () => {
    if (!audioRef.current) return;
    const { context } = audioRef.current;
    if (context.state === 'running') {
      await context.suspend();
      setPlaybackState('paused');
    } else {
      await context.resume();
      setPlaybackState('playing');
    }
  };

  const handleAction = async (type: 'advice' | 'narrative' | 'initial') => {
    if (playbackState !== 'idle' && activeType === type) return;
    stopNarration();
    setPlaybackState('loading');
    setActiveType(type);
    setShowEmailCapture(false);
    
    try {
      let text = "";
      if (type === 'initial') {
        text = await getInitialCalibrationNarrative(profile);
      } else if (type === 'narrative') {
        text = await getProfileNarrative(profile);
      } else {
        text = await getBrandMentorAdvice(profile.name, `LP: ${profile.lifePathNumber}, DS: ${profile.destinyNumber}`);
      }
      
      setContent(text);
      const playback = await playCalmNarration(text);
      if (playback) {
        audioRef.current = playback;
        setPlaybackState('playing');
        playback.source.onended = () => {
           setPlaybackState('idle');
           if (type === 'initial') {
             setShowEmailCapture(true);
           }
        };
      } else {
        setPlaybackState('idle');
      }
    } catch (e) {
      setPlaybackState('idle');
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call to capture lead
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => setShowEmailCapture(false), 3000);
    }, 1500);
  };

  const isAudioActive = playbackState === 'playing' || playbackState === 'paused';

  return (
    <div className="blur-reveal rounded-[2rem] p-8 shadow-2xl transition-all duration-700 hover:scale-[1.01] group border border-white/10">
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className={`w-12 h-12 rounded-full border border-amber-200/20 flex items-center justify-center transition-all ${playbackState === 'playing' ? 'bg-amber-200/10 scale-110' : 'bg-white/5'}`}>
            {playbackState === 'loading' ? (
               <div className="w-5 h-5 border border-amber-200/20 border-t-amber-200 rounded-full animate-spin"></div>
            ) : (
              <svg className={`w-6 h-6 ${playbackState === 'playing' ? 'text-amber-200' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </div>
          <div className="space-y-0.5">
            <h3 className="text-lg font-serif text-white/90 tracking-wide italic">Executive Mentor</h3>
            <p className="text-[8px] text-amber-500/50 uppercase tracking-[0.6em] font-bold">Calibration Interface</p>
          </div>
        </div>

        <div className="min-h-[180px] w-full flex flex-col items-center justify-center border-y border-white/5 py-6 space-y-4">
          {content ? (
            <div className="animate-fade-in text-center space-y-4 w-full">
              <div className="max-h-[250px] overflow-y-auto custom-scrollbar px-4">
                <p className="text-gray-300 leading-relaxed font-light italic text-xs md:text-[13px]">
                  "{content}"
                </p>
              </div>
              {isAudioActive && (
                <div className="flex items-center justify-center gap-4 py-2 bg-white/5 rounded-full px-6 border border-white/5">
                  <button onClick={stopNarration} className="text-gray-500 hover:text-red-400 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><rect x="5" y="5" width="10" height="10" /></svg>
                  </button>
                  <button onClick={togglePause} className="w-8 h-8 rounded-full bg-amber-200/10 flex items-center justify-center text-amber-200 hover:bg-amber-200/20 transition-all">
                    {playbackState === 'paused' ? (
                      <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M4.5 2.691l12 7.309-12 7.309V2.691z" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" /></svg>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 opacity-50">
              <p className="text-gray-500 italic text-[10px] font-light tracking-wide">
                Calibrating your business trajectory...
              </p>
              <div className="flex justify-center gap-1">
                <div className="w-1 h-1 bg-amber-500/20 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-amber-500/20 rounded-full animate-pulse delay-75"></div>
                <div className="w-1 h-1 bg-amber-500/20 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          )}
        </div>

        {showEmailCapture && (
          <div className="w-full animate-fade-in bg-amber-200/5 border border-amber-200/10 rounded-2xl p-6 space-y-4">
            <div className="space-y-1">
              <h4 className="text-[10px] text-amber-200 uppercase tracking-widest font-black">Unlock Premium Reading</h4>
              <p className="text-[9px] text-gray-500 leading-tight">Get your 50-page bespoke executive blueprint delivered instantly.</p>
            </div>
            {isSubmitted ? (
              <div className="py-2 text-[10px] text-amber-200 font-bold uppercase tracking-widest animate-pulse">
                Blueprint Sent to Cloud
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-2">
                <input 
                  required
                  type="email" 
                  placeholder="executive@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[11px] text-white focus:outline-none focus:border-amber-200/50"
                />
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-amber-200 text-black text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Authenticating...' : 'Purchase Premium Blueprint'}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="w-full space-y-3">
          <button
            onClick={() => handleAction('narrative')}
            disabled={playbackState === 'loading'}
            className="w-full py-4 rounded-xl text-[9px] uppercase tracking-[0.3em] bg-white text-black font-bold transition-all hover:bg-amber-100 disabled:opacity-50 shadow-xl"
          >
            Refresh Profile Narrative
          </button>
          <button
            onClick={() => handleAction('advice')}
            disabled={playbackState === 'loading'}
            className="w-full py-2 rounded-xl text-[8px] uppercase tracking-[0.2em] text-amber-200/60 hover:text-amber-200 transition-colors"
          >
            Strategic Directive
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorPanel;
