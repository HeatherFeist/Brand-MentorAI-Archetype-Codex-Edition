
import { NodeConfig, UserProfile, OnboardingData } from '../types';

export const CX = 500;
export const CY = 500;
export const R_OUTER = 460;
export const R_RING = 220; // Radius where rose circle centers sit
export const R_ROSE = 220; // Radius of each of the 8 rose circles

export const pointAtRadius = (angle: number, r: number) => {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: CX + r * Math.cos(rad),
    y: CY + r * Math.sin(rad)
  };
};

/**
 * Numerology: Strict logic
 * Life Path: (Month + Day) + (Reduced Year)
 */
export const calculateLifePath = (dob: string): number => {
  const parts = dob.split('-'); 
  if (parts.length < 3) return 0;
  
  const yearStr = parts[0];
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);

  // 1. Month + Day
  const monthDaySum = month + day;
  
  // 2. Year reduced (e.g. 1982 -> 20 -> 2)
  let yearSum = yearStr.split('').reduce((acc, d) => acc + parseInt(d), 0);
  while (yearSum > 9) {
    yearSum = yearSum.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
  }

  // 3. Final Master Sum (do not reduce if 11, 22, 33, 44, or simply keep total)
  return monthDaySum + yearSum; 
};

/**
 * Destiny: Alphabetical sum, preserving Master Numbers strictly.
 */
export const calculateDestiny = (name: string): number => {
  const map: Record<string, number> = {
    a: 1, j: 1, s: 1, b: 2, k: 2, t: 2, c: 3, l: 3, u: 3,
    d: 4, m: 4, v: 4, e: 5, n: 5, w: 5, f: 6, o: 6, x: 6,
    g: 7, p: 7, y: 7, h: 8, q: 8, z: 8, i: 9, r: 9
  };
  const sum = name.toLowerCase().split('').reduce((acc, char) => acc + (map[char] || 0), 0);
  
  let res = sum;
  // Preservation logic for 11, 22, 33, 44
  while (res > 9 && ![11, 22, 33, 44].includes(res)) {
    res = res.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
  }
  return res;
};

export const getSunSign = (dob: string) => {
  const date = new Date(dob);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { sign: "Aries", angle: 0 };
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { sign: "Taurus", angle: 30 };
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return { sign: "Gemini", angle: 60 };
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return { sign: "Cancer", angle: 90 };
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { sign: "Leo", angle: 120 };
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { sign: "Virgo", angle: 150 };
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { sign: "Libra", angle: 180 };
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { sign: "Scorpio", angle: 210 };
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { sign: "Sagittarius", angle: 240 };
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { sign: "Capricorn", angle: 270 };
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { sign: "Aquarius", angle: 300 };
  return { sign: "Pisces", angle: 330 };
};

export const deriveProfileFromOnboarding = (data: OnboardingData): UserProfile => {
  const lifePath = calculateLifePath(data.dob);
  const destiny = calculateDestiny(data.fullName);
  const sun = getSunSign(data.dob);
  
  const businessCodexValue = lifePath + destiny;
  const timeOffset = parseInt(data.tob.split(':')[0]) || 0;

  // The User Sun is always the 0 point (Center of Reference)
  const moonAngle = (destiny * 33 + timeOffset * 10) % 360;
  const risingAngle = (lifePath * 11 + timeOffset * 5) % 360;
  const jupiterAngle = (businessCodexValue * 7) % 360;

  return {
    name: data.fullName,
    sunRelAngle: 0,
    moonRelAngle: moonAngle,
    risingRelAngle: risingAngle,
    jupiterRelAngle: jupiterAngle,
    circleBand: Math.min(3, Math.floor(lifePath / 11)),
    activationStrength: Math.min(1, businessCodexValue / 44),
    lifePathNumber: lifePath,
    destinyNumber: destiny,
    businessCodexValue,
    sunSign: sun.sign,
    moonSign: "Derived"
  };
};

/**
 * INTERSECTION ENGINE
 * Calculates where 4 planetary bearings intersect the 8 rose circles.
 */
export const calculateNodeConfig = (profile: UserProfile): NodeConfig[] => {
  const nodes: NodeConfig[] = [];
  const bearings = [
    { angle: profile.sunRelAngle, weight: 1.0 },
    { angle: profile.moonRelAngle ?? 0, weight: 0.8 },
    { angle: profile.risingRelAngle ?? 0, weight: 0.7 },
    { angle: profile.jupiterRelAngle ?? 0, weight: 0.9 }
  ];

  const roseAngles = [...Array(8)].map((_, i) => i * 45);

  bearings.forEach(bearing => {
    roseAngles.forEach(alpha => {
      // Intersection of line r(theta) = bearing.angle and circle centered at P(alpha, R_ring) with radius R_rose
      // Math: r^2 - 2*r*R_ring*cos(theta - alpha) + (R_ring^2 - R_rose^2) = 0
      const thetaRad = (bearing.angle - 90) * (Math.PI / 180);
      const alphaRad = (alpha - 90) * (Math.PI / 180);
      
      const B = -2 * R_RING * Math.cos(thetaRad - alphaRad);
      const C = Math.pow(R_RING, 2) - Math.pow(R_ROSE, 2);
      
      const D = B * B - 4 * C;
      if (D >= 0) {
        const r1 = (-B + Math.sqrt(D)) / 2;
        const r2 = (-B - Math.sqrt(D)) / 2;

        [r1, r2].forEach(r => {
          if (r > 10 && r < R_OUTER) {
            const pos = pointAtRadius(bearing.angle, r);
            
            // Check if multiple bearings pass near here (Intersection density)
            let density = 0;
            bearings.forEach(b2 => {
              if (Math.abs(b2.angle - bearing.angle) < 5) density++;
            });

            nodes.push({
              x: pos.x,
              y: pos.y,
              intensity: Math.min(1, (density / 4) + (profile.activationStrength * 0.3)),
              glowRadius: 25 + density * 15,
              coreRadius: 4 + density * 2
            });
          }
        });
      }
    });
  });

  return nodes;
};
