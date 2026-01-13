
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

          <filter id="bloomNode">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {wheelColors.map((color, i) => (
            <radialGradient id={`wheelGrad-${i}`} key={i} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.6" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          ))}

          {/* Mask for the color wheel: Only allows colors to show through node "light sources" */}
          <mask id="nodeAuraMask">
            <rect x="0" y="0" width="1000" height="1000" fill="black" />
            {nodes.map((node, i) => (
              <radialGradient id={`maskGrad-${i}`} key={`mg-${i}`}>
                <stop offset="0%" stopColor="white" stopOpacity={0.1 + node.intensity * 0.7} />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
            ))}
            {nodes.map((node, i) => (
              <circle 
                key={i} 
                cx={node.x} 
                cy={node.y} 
                r={node.glowRadius * 6} 
                fill={`url(#maskGrad-${i})`}
              />
            ))}
            {/* Subtle glow for the center user point */}
            <circle cx={CX} cy={CY} r={150} fill="white" fillOpacity="0.15" filter="blur(40px)" />
          </mask>
          
          <mask id="igniteMask">
            <rect x="0" y="0" width="1000" height="1000" fill="black" />
            {nodes.map((node, i) => (
              <circle key={i} cx={node.x} cy={node.y} r={node.glowRadius * 3} fill="white" fillOpacity="0.3" filter="blur(20px)" />
            ))}
          </mask>
          
          {/* Reusable light source gradient with realistic falloff */}
          <radialGradient id="photorealisticLight">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="15%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#ffd700" stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="userCoreGrad">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1) DEEP SPACE SUBSTRATE */}
        <rect x="0" y="0" width="1000" height="1000" fill="#000000" />
        <circle cx={CX} cy={CY} r={1000} fill="#050505" filter="url(#chromeNoise)" />

        {/* 2) AURA COLOR WHEEL - MASKED TO NODES */}
        <g id="colorWheel" opacity={profile.activationStrength * 0.9 + 0.1} mask="url(#nodeAuraMask)">
          {wheelColors.map((_, i) => (
            <circle 
              key={i} 
              cx={pointAtRadius(i * 30, 320).x} 
              cy={pointAtRadius(i * 30, 320).y} 
              r={450} 
              fill={`url(#wheelGrad-${i})`} 
              style={{ mixBlendMode: 'plus-lighter' }} 
            />
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
           <g stroke="rgba(255,215,0,0.6)" fill="none" strokeWidth="4">
            {[...Array(8)].map((_, i) => {
              const center = pointAtRadius(i * 45, R_RING);
              return <circle key={i} cx={center.x} cy={center.y} r={220} />;
            })}
          </g>
        </g>

        {/* 5) LIGHT SOURCE NODES */}
        {nodes.map((node, i) => (
          <g key={i} filter="url(#bloomNode)">
            {/* The outer radial glow - larger nodes have larger/brighter glow */}
            <circle 
              cx={node.x} 
              cy={node.y} 
              r={node.glowRadius * 2.5} 
              fill="url(#photorealisticLight)" 
              opacity={0.3 + (node.intensity * 0.6)}
              style={{ mixBlendMode: 'screen' }}
            />
            {/* The hot center core */}
            <circle 
              cx={node.x} 
              cy={node.y} 
              r={node.coreRadius * 1.8} 
              fill="white" 
              opacity={0.8 + (node.intensity * 0.2)}
            />
          </g>
        ))}

        {/* 6) USER CENTER POINT */}
        <g>
          <circle cx={CX} cy={CY} r={80} fill="url(#userCoreGrad)" opacity="0.4" filter="blur(15px)" />
          <circle cx={CX} cy={CY} r={10} fill="white" />
        </g>

        {/* 7) PLANETARY BEARINGS */}
        <g id="bearings" opacity="0.2">
          <line x1={CX} y1={CY} x2={pointAtRadius(0, R_OUTER).x} y2={pointAtRadius(0, R_OUTER).y} stroke="white" strokeWidth="1" />
          {profile.moonRelAngle !== null && (
            <line x1={CX} y1={CY} x2={pointAtRadius(profile.moonRelAngle, R_OUTER).x} y2={pointAtRadius(profile.moonRelAngle, R_OUTER).y} stroke="#ffd700" strokeWidth="1.5" strokeDasharray="10 5" />
          )}
          {profile.risingRelAngle !== null && (
            <line x1={CX} y1={CY} x2={pointAtRadius(profile.risingRelAngle, R_OUTER).x} y2={pointAtRadius(profile.risingRelAngle, R_OUTER).y} stroke="white" strokeWidth="1" strokeDasharray="3 3" />
          )}
          {profile.jupiterRelAngle !== null && (
            <line x1={CX} y1={CY} x2={pointAtRadius(profile.jupiterRelAngle, R_OUTER).x} y2={pointAtRadius(profile.jupiterRelAngle, R_OUTER).y} stroke="#ff5555" strokeWidth="1" strokeDasharray="8 3" />
          )}
        </g>
      </svg>
    </div>
  );
};

export default CodexConstellation;
