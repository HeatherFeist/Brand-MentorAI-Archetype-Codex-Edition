
import React from 'react';
import { AppMode, UserProfile } from '../types';
import { 
  CX, CY, R_OUTER, R_HOUSE, 
  pointAtRadius, calculateNodeConfig 
} from '../services/codexGeometry';

interface CodexConstellationProps {
  profile: UserProfile;
  mode: AppMode;
}

const CodexConstellation: React.FC<CodexConstellationProps> = ({ profile, mode }) => {
  const nodes = calculateNodeConfig(profile);
  const baseOpacity = mode === 'logo' ? 0.005 : 0.03;

  const wheelColors = [
    '#ff0000', '#ff7f00', '#ffff00', '#80ff00', 
    '#00ff00', '#00ff80', '#00ffff', '#0080ff', 
    '#0000ff', '#7f00ff', '#ff00ff', '#ff007f'
  ];

  return (
    <div className="fixed inset-0 z-0 pointer-events-none floating-bg flex items-center justify-center overflow-hidden">
      <svg 
        viewBox="0 0 1000 1000" 
        className="w-[160vmax] h-[160vmax] opacity-95 transition-all duration-1000"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="chromeNoise" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="2" result="noise" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer><feFuncA type="table" tableValues="0 0.08" /></feComponentTransfer>
            <feBlend mode="soft-light" in="SourceGraphic" result="textured" />
          </filter>

          <filter id="fluidBlend">
            <feGaussianBlur stdDeviation="40" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          </filter>

          {wheelColors.map((color, i) => (
            <radialGradient id={`wheelGrad-${i}`} key={i} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          ))}

          <mask id="igniteMask">
            <rect x="0" y="0" width="1000" height="1000" fill="black" />
            {nodes.map((node, i) => (
              <circle key={i} cx={node.x} cy={node.y} r={node.glowRadius * 3} fill="white" fillOpacity="0.4" />
            ))}
            <circle cx={CX} cy={CY} r={150} fill="white" fillOpacity="0.1" />
          </mask>
          
          <radialGradient id="goldNodeCore">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#ffd700" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          <radialGradient id="userCoreGrad">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1) SUBSTRATE */}
        <circle cx={CX} cy={CY} r={1000} fill="#050505" filter="url(#chromeNoise)" />

        {/* 2) RADIATING COLOR WHEEL */}
        <g id="colorWheel" filter="url(#fluidBlend)" opacity={profile.activationStrength * 0.4 + 0.1}>
          {wheelColors.map((_, i) => (
            <circle key={i} cx={pointAtRadius(i * 30, 280).x} cy={pointAtRadius(i * 30, 280).y} r={400} fill={`url(#wheelGrad-${i})`} style={{ mixBlendMode: 'screen' }} />
          ))}
        </g>

        {/* 3) GEOMETRY BASE */}
        <g id="etchedSkeleton" opacity={baseOpacity} stroke="white" fill="none">
          <circle cx={CX} cy={CY} r={R_OUTER} strokeWidth="0.8" />
          {[...Array(8)].map((_, i) => {
            const center = pointAtRadius(i * 45, 220);
            return <circle key={i} cx={center.x} cy={center.y} r={220} strokeWidth="0.5" />;
          })}
        </g>

        {/* 4) IGNITED TORUS - ONLY AT INTERSECTIONS */}
        <g id="ignitedGeometry" mask="url(#igniteMask)">
           <g stroke="rgba(255,215,0,0.8)" fill="none" strokeWidth="2.5">
            {[...Array(8)].map((_, i) => {
              const center = pointAtRadius(i * 45, 220);
              return <circle key={i} cx={center.x} cy={center.y} r={220} />;
            })}
          </g>
        </g>

        {/* 5) DYNAMIC NODES - The Result of Intersections */}
        {nodes.map((node, i) => (
          <g key={i}>
            <circle cx={node.x} cy={node.y} r={node.glowRadius} fill="url(#goldNodeCore)" opacity="0.4" style={{ mixBlendMode: 'plus-lighter' }} />
            <circle cx={node.x} cy={node.y} r={node.coreRadius} fill="white" />
          </g>
        ))}

        {/* 6) USER CENTER POINT (The Core reference) */}
        <circle cx={CX} cy={CY} r={15} fill="url(#userCoreGrad)" opacity="0.8" />
        <circle cx={CX} cy={CY} r={6} fill="white" />

        {/* 7) THE FOUR BEARINGS */}
        <g id="bearings" opacity="0.2">
          {/* Sun - 0° */}
          <line x1={CX} y1={CY} x2={pointAtRadius(0, R_OUTER).x} y2={pointAtRadius(0, R_OUTER).y} stroke="white" strokeWidth="1" />
          {/* Moon */}
          {profile.moonRelAngle !== null && (
            <line x1={CX} y1={CY} x2={pointAtRadius(profile.moonRelAngle, R_OUTER).x} y2={pointAtRadius(profile.moonRelAngle, R_OUTER).y} stroke="#ffd700" strokeWidth="1.5" strokeDasharray="10 5" />
          )}
          {/* Rising */}
          {profile.risingRelAngle !== null && (
            <line x1={CX} y1={CY} x2={pointAtRadius(profile.risingRelAngle, R_OUTER).x} y2={pointAtRadius(profile.risingRelAngle, R_OUTER).y} stroke="white" strokeWidth="0.5" strokeDasharray="2 2" />
          )}
          {/* Jupiter */}
          {profile.jupiterRelAngle !== null && (
            <line x1={CX} y1={CY} x2={pointAtRadius(profile.jupiterRelAngle, R_OUTER).x} y2={pointAtRadius(profile.jupiterRelAngle, R_OUTER).y} stroke="#ff6b6b" strokeWidth="1" strokeDasharray="5 5" />
          )}
        </g>
      </svg>
    </div>
  );
};

export default CodexConstellation;
