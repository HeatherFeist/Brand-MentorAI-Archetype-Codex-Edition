
import { GoogleGenAI, Modality } from "@google/genai";
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
 * Generates the specific "Initial Calibration" narrative requested by the user.
 */
export const getInitialCalibrationNarrative = async (profile: UserProfile) => {
  const archetype = getBusinessArchetype(profile);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a world-class Executive Business Mentor. 
      Deliver an "Initial Business Calibration Reading" for ${profile.name}.
      
      Mathematical Profile:
      - Life Path: ${profile.lifePathNumber} (Logic: (M+D) + Reduced Year)
      - Destiny: ${profile.destinyNumber} (Strictly preserving Master Numbers)
      - Codexed 3rd Identity: ${profile.businessCodexValue}
      
      Required Structure:
      1. THE GEOMETRIC NODES: Explain that their personal bearings (Sun, Moon, Rising, Jupiter) have intersected the Torus to ignite "Golden Nodes". Describe what this means for their energetic presence in business.
      2. EXECUTIVE STRENGTHS: Based on their value of ${profile.businessCodexValue} and archetype "${archetype}", what are their 2 greatest business assets?
      3. IMPROVEMENTS: Identify one specific "alignment challenge" or area for growth in their current business path.
      
      Tone: Professional, calm, futuristic, highly articulate. Use roughly 150-180 words.`,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text;
  } catch (error) {
    return `Welcome, ${profile.name}. Your Codexed Identity ${profile.businessCodexValue} is now calibrated. You operate as ${archetype}, a frequency of high strategic impact.`;
  }
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

export const getBrandMentorAdvice = async (userName: string, profileSummary: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Professional Business Mentor advice for ${userName}: ${profileSummary}. 20 words max executive directive.`,
    config: { thinkingConfig: { thinkingBudget: 0 } }
  });
  return response.text;
};

export const playCalmNarration = async (text: string, audioContext?: AudioContext) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `In a calm, professional, and slightly futuristic executive voice, read the following calibration: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
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
