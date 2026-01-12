
import React from 'react';
import { AppMode, UserProfile } from '../types';
import { 
  CX, CY, R_OUTER, R_RING,
  pointAtRadius, calculateNodeConfig 
} from '../services/codexGeometry';

interface CodexConstellationProps {
  profile: UserProfile;
  mode: AppMode;
}

const CodexConstellation: React.FC<CodexConstellationProps> = ({ profile, mode }) => {
  const nodes = calculateNodeConfig(profile);
  const baseOpacity = mode === 'logo' ? 0.005 : 0.05;

  const wheelColors = [
    '#ff3333', '#ff9933', '#ffff33', '#99ff33', 
    '#33ff33', '#33ff99', '#33ffff', '#3399ff', 
    '#3333ff', '#9933ff', '#ff33ff', '#ff3399'
  ];

  return (
    <div className="fixed inset-0 z-0 pointer-events-none floating-bg flex items-center justify-center overflow-hidden bg-black">
      <svg 
        viewBox="0 0 1000 1000" 
        className="w-[170vmax] h-[170vmax] opacity-95 transition-all duration-1000"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="chromeNoise" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="4" seed="5" result="noise" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer><feFuncA type="table" tableValues="0 0.12" /></feComponentTransfer>
            <feBlend mode="soft-light" in="SourceGraphic" result="textured" />
          </filter>

          <filter id="fluidBlend">
            <feGaussianBlur stdDeviation="50" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10" result="goo" />
          </filter>

          {wheelColors.map((color, i) => (
            <radialGradient id={`wheelGrad-${i}`} key={i} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          ))}

          {/* Mask that only reveals where nodes are present */}
          <mask id="nodeAuraMask">
            <rect x="0" y="0" width="1000" height="1000" fill="black" />
            {nodes.map((node, i) => (
              <circle 
                key={i} 
                cx={node.x} 
                cy={node.y} 
                r={node.glowRadius * 3} 
                fill="white" 
                fillOpacity={0.4 + (node.intensity * 0.6)} 
              />
            ))}
            <circle cx={CX} cy={CY} r={100} fill="white" fillOpacity="0.3" />
          </mask>
          
          <mask id="igniteMask">
            <rect x="0" y="0" width="1000" height="1000" fill="black" />
            {nodes.map((node, i) => (
              <circle key={i} cx={node.x} cy={node.y} r={node.glowRadius * 2.5} fill="white" fillOpacity="0.6" />
            ))}
            <circle cx={CX} cy={CY} r={200} fill="white" fillOpacity="0.2" />
          </mask>
          
          <radialGradient id="goldNodeCore">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#ffd700" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          <radialGradient id="userCoreGrad">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1) DEEP SPACE SUBSTRATE */}
        <rect x="0" y="0" width="1000" height="1000" fill="#000000" />
        <circle cx={CX} cy={CY} r={1000} fill="#050505" filter="url(#chromeNoise)" />

        {/* 2) AURA COLOR WHEEL - NOW MASKED TO ONLY APPEAR AT NODES */}
        <g id="colorWheel" filter="url(#fluidBlend)" opacity={profile.activationStrength * 0.8 + 0.1} mask="url(#nodeAuraMask)">
          {wheelColors.map((_, i) => (
            <circle key={i} cx={pointAtRadius(i * 30, 320).x} cy={pointAtRadius(i * 30, 320).y} r={450} fill={`url(#wheelGrad-${i})`} style={{ mixBlendMode: 'plus-lighter' }} />
          ))}
        </g>

        {/* 3) BASE ROSE TORUS */}
        <g id="etchedSkeleton" opacity={baseOpacity} stroke="white" fill="none">
          <circle cx={CX} cy={CY} r={R_OUTER} strokeWidth="1" />
          {[...Array(8)].map((_, i) => {
            const center = pointAtRadius(i * 45, R_RING);
            return <circle key={i} cx={center.x} cy={center.y} r={220} strokeWidth="0.5" />;
          })}
        </g>

        {/* 4) DYNAMIC IGNITED OVERLAY */}
        <g id="ignitedGeometry" mask="url(#igniteMask)">
           <g stroke="rgba(255,215,0,0.9)" fill="none" strokeWidth="3.5">
            {[...Array(8)].map((_, i) => {
              const center = pointAtRadius(i * 45, R_RING);
              return <circle key={i} cx={center.x} cy={center.y} r={220} />;
            })}
          </g>
        </g>

        {/* 5) INTERSECTION NODES */}
        {nodes.map((node, i) => (
          <g key={i}>
            <circle cx={node.x} cy={node.y} r={node.glowRadius} fill="url(#goldNodeCore)" opacity="0.6" style={{ mixBlendMode: 'screen' }} />
            <circle cx={node.x} cy={node.y} r={node.coreRadius} fill="white" />
          </g>
        ))}

        {/* 6) USER CENTER POINT */}
        <circle cx={CX} cy={CY} r={25} fill="url(#userCoreGrad)" opacity="0.7" />
        <circle cx={CX} cy={CY} r={8} fill="white" />

        {/* 7) PLANETARY BEARINGS */}
        <g id="bearings" opacity="0.35">
          <line x1={CX} y1={CY} x2={pointAtRadius(0, R_OUTER).x} y2={pointAtRadius(0, R_OUTER).y} stroke="white" strokeWidth="1.8" />
          {profile.moonRelAngle !== null && (
            <line x1={CX} y1={CY} x2={pointAtRadius(profile.moonRelAngle, R_OUTER).x} y2={pointAtRadius(profile.moonRelAngle, R_OUTER).y} stroke="#ffd700" strokeWidth="2.5" strokeDasharray="14 5" />
          )}
          {profile.risingRelAngle !== null && (
            <line x1={CX} y1={CY} x2={pointAtRadius(profile.risingRelAngle, R_OUTER).x} y2={pointAtRadius(profile.risingRelAngle, R_OUTER).y} stroke="white" strokeWidth="1" strokeDasharray="3 3" />
          )}
          {profile.jupiterRelAngle !== null && (
            <line x1={CX} y1={CY} x2={pointAtRadius(profile.jupiterRelAngle, R_OUTER).x} y2={pointAtRadius(profile.jupiterRelAngle, R_OUTER).y} stroke="#ff5555" strokeWidth="1.5" strokeDasharray="10 3" />
          )}
        </g>
      </svg>
    </div>
  );
};

export default CodexConstellation;
