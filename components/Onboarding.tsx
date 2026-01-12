
import React, { useState } from 'react';
import { OnboardingData } from '../types';

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState<OnboardingData>({
    fullName: '',
    dob: '',
    tob: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.fullName && formData.dob && formData.tob) {
      onComplete(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <form 
        onSubmit={handleSubmit}
        className="w-full max-w-lg blur-reveal rounded-[2.5rem] p-10 md:p-14 space-y-10 border border-white/10 shadow-[0_0_100px_rgba(255,215,0,0.1)]"
      >
        <div className="text-center space-y-3">
          <h2 className="text-4xl font-serif text-white/90 italic tracking-tight">Codexed Onboarding</h2>
          <p className="text-[10px] text-amber-500/50 uppercase tracking-[0.5em] font-bold">Initiating Personal Business Blueprint</p>
        </div>

        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-[9px] text-gray-400 uppercase tracking-widest pl-1">Full Legal Name</label>
            <input 
              required
              type="text"
              placeholder="For Destiny Calculation"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-amber-200/50 transition-all placeholder:text-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] text-gray-400 uppercase tracking-widest pl-1">Date of Birth</label>
              <input 
                required
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({...formData, dob: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-amber-200/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-gray-400 uppercase tracking-widest pl-1">Time of Birth</label>
              <input 
                required
                type="time"
                value={formData.tob}
                onChange={(e) => setFormData({...formData, tob: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-amber-200/50 transition-all"
              />
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full py-5 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-[0.4em] hover:bg-amber-100 transition-all shadow-xl shadow-white/5"
        >
          Generate Business Codex
        </button>

        <p className="text-center text-[8px] text-gray-600 uppercase tracking-widest leading-relaxed">
          Your data is used solely to calculate the geometric <br/> and numerological offsets of your executive profile.
        </p>
      </form>
    </div>
  );
};

export default Onboarding;
