
import { GoogleGenAI } from "@google/genai";
import { UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const getBusinessArchetype = (profile: UserProfile) => {
  const { businessCodexValue, lifePathNumber, destinyNumber } = profile;
  if (businessCodexValue >= 44) return "The Architect of Destiny (Titan)";
  if (lifePathNumber === 33) return "The Master Influencer (Radiant Leader)";
  if (lifePathNumber === 22 || destinyNumber === 22) return "The Master Builder (Global Architect)";
  if (lifePathNumber === 11 || destinyNumber === 11) return "The Visionary Catalyst (Instinctive Seer)";
  const base = businessCodexValue % 9 || 9;
  const archetypes: Record<number, string> = {
    1: "The Independent Pioneer", 2: "The Strategic Diplomat", 3: "The Creative Evangelist",
    4: "The Systemic Foundation", 5: "The Change Architect", 6: "The Benevolent Executive",
    7: "The Analytical Mystic", 8: "The Sovereign Authority", 9: "The Universal Legacy"
  };
  return archetypes[base] || "The Strategic Catalyst";
};

/**
 * Generates the multi-phase "Initial Calibration" narrative.
 */
export const getInitialCalibrationNarrative = async (profile: UserProfile) => {
  const archetype = getBusinessArchetype(profile);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a world-class Executive Business Mentor. 
      Deliver a comprehensive "Initial Business Calibration Reading" for ${profile.name} following this exact 4-phase structure:
      
      1. THE RUNDOWN: Start with a brief, high-level rundown of the self-discovery process they are about to undergo, mapping their energetic bearings to business outcomes.
      2. DETAILED ARCHETYPAL PILLARS: Explain the individual components. 
         - Describe the Sun Sign's specific business traits (e.g., "Libra represents balance, harmony, and strategic partnership...").
         - Explain the Numerology (Life Path ${profile.lifePathNumber} and Destiny ${profile.destinyNumber}). If 11, 22, 33, or 44 appear, describe them as "Master Teacher," "Global Architect," or "Illuminator." Explain what these specific frequencies mean for their leadership.
      3. THE SYNTHESIS: Synthesize all of this into the final "${archetype}" profile. Explain how the Sun Sign and Numbers merge to create this specific business identity.
      4. THE CLOSING & UPGRADE: Conclude by summarizing their current trajectory and then ask for their executive email to purchase a full Premium Reading/Blueprint that goes 50 pages deeper.
      
      Tone: Sophisticated, calm, visionary, professional. Approx 250 words.`,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text;
  } catch (error) {
    return `Calibration complete. Your Master Identity ${profile.businessCodexValue} is active. As a ${profile.sunSign} with ${profile.lifePathNumber} path, you hold the frequency of ${archetype}. Please provide your email to unlock the premium blueprint.`;
  }
};

/**
 * Generates the full Premium Blueprint Report.
 */
export const generatePremiumBlueprint = async (profile: UserProfile) => {
  const archetype = getBusinessArchetype(profile);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a 5-Chapter Premium Executive Business Blueprint for ${profile.name}.
      Identity: ${archetype} (Value: ${profile.businessCodexValue})
      Data: Sun Sign ${profile.sunSign}, Life Path ${profile.lifePathNumber}, Destiny ${profile.destinyNumber}.

      Chapters:
      1. THE PSYCHOLOGICAL BLUEPRINT: Core motivators and energetic drivers.
      2. STRATEGIC EXECUTION: How this archetype handles high-stakes decisions.
      3. WEALTH ANCHORING: The industries and legacy types most aligned with this frequency.
      4. SHADOW TRAITS: Blindspots and mitigation strategies.
      5. THE 10-YEAR LEGACY ROADMAP: A decade-long trajectory.

      Format: Use Markdown headers for chapters. Long-form, analytical, and executive-ready.`,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text;
  } catch (error) {
    return "Error generating premium blueprint. Please contact executive support.";
  }
};

export const getBrandMentorAdvice = async (userName: string, profileSummary: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Professional Business Mentor advice for ${userName}: ${profileSummary}. 20 words max executive directive.`,
    config: { thinkingConfig: { thinkingBudget: 0 } }
  });
  return response.text;
};

export const getProfileNarrative = async (profile: UserProfile) => {
  const archetype = getBusinessArchetype(profile);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Provide a detailed business analysis for ${profile.name}, who is a ${archetype} (Value: ${profile.businessCodexValue}). Focus on long-term legacy.`,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text;
  } catch (error) {
    return `Your frequency is established at the ${profile.businessCodexValue} level.`;
  }
};

export const playCalmNarration = async (text: string, audioContext?: AudioContext) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `In a calm, professional, and slightly futuristic executive voice, read the following calibration: ${text}` }] }],
      config: {
        responseModalities: ['AUDIO'], // Use string literal to avoid 400 errors
        speechConfig: { 
          voiceConfig: { 
            prebuiltVoiceConfig: { voiceName: 'Zephyr' } 
          } 
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const ctx = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
      return { source, context: ctx };
    }
  } catch (e) {
    console.error("TTS failed:", e);
  }
  return null;
};
