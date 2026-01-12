
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
 * Generates the multi-phase "Initial Calibration" narrative.
 */
export const getInitialCalibrationNarrative = async (profile: UserProfile) => {
  const archetype = getBusinessArchetype(profile);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a world-class Executive Business Mentor. 
      Deliver a comprehensive "Initial Business Calibration Reading" for ${profile.name}.
      
      Mathematical Profile:
      - Sun Sign: ${profile.sunSign}
      - Life Path: ${profile.lifePathNumber}
      - Destiny: ${profile.destinyNumber}
      - Codexed Identity Value: ${profile.businessCodexValue}
      - Core Archetype: ${archetype}
      
      Narrative Structure:
      1. THE RUNDOWN: Begin with a brief, sophisticated rundown of what they are about to discover about their hidden business architecture.
      2. ARCHETYPAL PILLARS: Break down the components. Explain the archetypal meaning of their Sun Sign (e.g., Libra represents balance and harmony) and their specific Numerology. Highlight Master Numbers (11, 22, 33) as the "Master Teacher" or "Illuminator" frequencies if they appear.
      3. FULL SYNTHESIS: Synthesize these parts into a unified "Business Identity". How do their zodiacal traits and numeric frequencies work together to create ${archetype}?
      4. THE UPGRADE: End by inviting them to go deeper. State that if they provide their executive email, they can unlock a bespoke Premium Reading that maps their legacy trajectory.
      
      Tone: Professional, calm, high-end executive coach, visionary. Use roughly 200-250 words.`,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text;
  } catch (error) {
    return `Welcome, ${profile.name}. Your Codexed Identity ${profile.businessCodexValue} is now calibrated. As a ${profile.sunSign} with Master frequency, you operate with high strategic impact. Provide your email below to receive your full blueprint.`;
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
        responseModalalities: [Modality.AUDIO],
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
