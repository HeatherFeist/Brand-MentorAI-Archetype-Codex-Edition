
import { NodeConfig, UserProfile, OnboardingData } from '../types';

export const CX = 500;
export const CY = 500;
export const R_OUTER = 460;
export const R_INNER = 420;
export const R_HOUSE = 460;
export const R_NODE = 280; // Distance where bearings typically intersect rose circles
export const R_ROSE_RING = 220; // Radius of rose circle centers
export const R_ROSE_RADIUS = 220; // Radius of individual rose circles

export const pointAtRadius = (angle: number, r: number) => {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: CX + r * Math.cos(rad),
    y: CY + r * Math.sin(rad)
  };
};

/**
 * Numerology: Strict logic as requested.
 * Life Path: (Month + Day) + (Reduced Year)
 */
export const calculateLifePath = (dob: string): number => {
  const parts = dob.split('-'); 
  if (parts.length < 3) return 0;
  
  const year = parts[0];
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);

  // 1. Month + Day
  const monthDaySum = month + day;
  
  // 2. Year reduced (e.g. 1982 -> 20 -> 2)
  let yearSum = year.split('').reduce((acc, d) => acc + parseInt(d), 0);
  while (yearSum > 9) {
    yearSum = yearSum.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
  }

  // 3. Final Master Sum (e.g. 31 + 2 = 33)
  // We do not reduce 11, 22, 33, 44 at the final stage
  const final = monthDaySum + yearSum;
  return final; 
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
  
  // Custom reduction: only reduce if NOT 11, 22, 33, 44
  let res = sum;
  while (res > 9 && ![11, 22, 33, 44].includes(res)) {
    res = res.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
  }
  return res;
};

/**
 * Simplified Zodiac logic including Jupiter
 */
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

  // Use the re-based center point logic: Sun is at 0
  const moonAngle = (destiny * 33 + timeOffset * 10) % 360;
  const risingAngle = (lifePath * 11 + timeOffset * 5) % 360;
  const jupiterAngle = ((lifePath + destiny) * 7) % 360;

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
 * Calculates intersections between bearings and the 8-circle torus.
 */
export const calculateNodeConfig = (profile: UserProfile): NodeConfig[] => {
  const nodes: NodeConfig[] = [];
  const bearings = [
    { angle: profile.sunRelAngle, type: 'sun' },
    { angle: profile.moonRelAngle ?? 0, type: 'moon' },
    { angle: profile.risingRelAngle ?? 0, type: 'rising' },
    { angle: profile.jupiterRelAngle ?? 0, type: 'jupiter' }
  ];

  // The 8 Rose Circle centers
  const roseCenters = [...Array(8)].map((_, i) => pointAtRadius(i * 45, R_ROSE_RING));

  bearings.forEach(bearing => {
    // We check points along the bearing line to find "geometric heat"
    // For this visual engine, we place a node at the point where the bearing 
    // crosses the R_NODE (280) ring.
    const pos = pointAtRadius(bearing.angle, R_NODE);
    
    // Count how many rose circles are near this point
    let overlapCount = 0;
    roseCenters.forEach(center => {
      const dist = Math.sqrt(Math.pow(pos.x - center.x, 2) + Math.pow(pos.y - center.y, 2));
      // If the point is within or near the edge of a rose circle
      if (dist < R_ROSE_RADIUS + 20) {
        overlapCount++;
      }
    });

    // The intensity of the glow is driven by the overlapCount
    const intensity = Math.min(1, (overlapCount / 4) + (profile.activationStrength * 0.5));
    
    nodes.push({
      ...pos,
      intensity,
      coreRadius: 6 + 4 * overlapCount,
      glowRadius: 40 + 30 * overlapCount
    });
  });

  return nodes;
};
