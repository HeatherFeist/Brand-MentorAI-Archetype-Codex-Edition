
import { GoogleGenAI, Modality } from "@google/genai";
import { UserProfile } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Manual base64 decoding implementation per guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Correct raw PCM audio decoding logic for AudioContext
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

export const getProfileNarrative = async (profile: UserProfile) => {
  const archetype = getBusinessArchetype(profile);
  const summary = `
    Archetype: ${archetype}
    Value: ${profile.businessCodexValue}
    Life Path: ${profile.lifePathNumber}
    Destiny: ${profile.destinyNumber}
    Sun: ${profile.sunSign}
    Ignition: ${Math.round(profile.activationStrength * 100)}%
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a world-class Business Mentor. 
      Deliver a "Full Personal Description" for ${profile.name}.
      
      Logic to highlight:
      1. MASTER MATH: Explain how their Life Path of ${profile.lifePathNumber} (from the specific logic (M+D)+Reduced Year) and Destiny of ${profile.destinyNumber} combine to create their "Coded 3rd Identity" value of ${profile.businessCodexValue}.
      2. ARCHETYPE: Define "${archetype}". Explain that they are the center of their own zodiacal wheel.
      3. GEOMETRY: Describe how their Sun, Moon, Rising, and Jupiter bearings intersect the geometric Torus to ignite their personal golden nodes.
      4. STRATEGIC INSIGHT: How should a leader with a value of ${profile.businessCodexValue} operate in this market?
      
      Tone: Professional, calm, executive assistant voice. ~200 words.`,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    // Accessing the text property directly per guidelines
    return response.text;
  } catch (error) {
    return `Your Coded Identity, ${archetype} (${profile.businessCodexValue}), is ignited at the master frequency.`;
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
      contents: [{ parts: [{ text: `Professional, soft executive voice: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const ctx = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      // Following guideline-compliant raw PCM audio decoding
      const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
      return { source, context: ctx };
    }
  } catch (e) {}
  return null;
};
