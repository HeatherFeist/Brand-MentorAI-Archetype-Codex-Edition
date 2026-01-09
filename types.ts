
export type AppMode = 'logo' | 'aura' | 'explain';

export interface UserProfile {
  name: string;
  sunRelAngle: number;
  moonRelAngle: number | null;
  risingRelAngle: number | null;
  jupiterRelAngle: number | null;
  circleBand: number; 
  activationStrength: number;
  lifePathNumber: number;
  destinyNumber: number;
  businessCodexValue: number;
  sunSign: string;
  moonSign: string;
}

export interface OnboardingData {
  fullName: string;
  dob: string;
  tob: string;
}

export interface NodeConfig {
  x: number;
  y: number;
  intensity: number;
  glowRadius: number;
  coreRadius: number;
}
