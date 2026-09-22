/**
 * KalaSetu AI — Multi-Model AI Engine Configuration
 * 1. Groq: qwen/qwen3.8-27b (Ultra-fast multilingual LPU reasoning)
 * 2. Google Gemini: gemini-3.6-flash (Multimodal document OCR & craft vision)
 * 3. Gnani.ai: Vachana STT v3 (Sovereign Indian regional speech recognition)
 *
 * Keys can be loaded from:
 * - aiConfig.local.js (Gitignored, local development)
 * - localStorage ('kalasetu_ai_keys')
 * - Direct UI input in Settings / Developer Mode
 */

let localFileConfig = {};
try {
  const localModule = await import('./aiConfig.local.js');
  if (localModule && localModule.LOCAL_AI_CONFIG) {
    localFileConfig = localModule.LOCAL_AI_CONFIG;
  }
} catch (e) {
  // aiConfig.local.js is gitignored for public repositories
}

export const AI_CONFIG = {
  // 1. Groq Cloud (Ultra-Fast LPU Brain)
  groq: {
    enabled: true,
    apiKey: (localFileConfig.groq && localFileConfig.groq.apiKey) || '',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'qwen/qwen3.8-27b', // Top multilingual model on Groq for Indian regional reasoning
    temperature: 0.2
  },

  // 2. Google Gemini API (Multimodal Document OCR & Craft Vision)
  gemini: {
    enabled: true,
    apiKey: (localFileConfig.gemini && localFileConfig.gemini.apiKey) || '',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    model: 'gemini-3.6-flash', // Google's latest stable multimodal production model
    temperature: 0.1
  },

  // 3. Gnani.ai (Indian Regional Speech Engine)
  gnani: {
    enabled: true,
    apiKey: (localFileConfig.gnani && localFileConfig.gnani.apiKey) || '',
    sttEndpoint: 'https://api.vachana.ai/stt/v3',
    ttsEndpoint: 'https://api.vachana.ai/tts/v3'
  }
};

/**
 * Helper to get active keys with fallback to localStorage and local file
 */
export function getAIConfig() {
  const localSaved = (typeof localStorage !== 'undefined' && JSON.parse(localStorage.getItem('kalasetu_ai_keys') || 'null')) || {};
  return {
    groq: {
      ...AI_CONFIG.groq,
      apiKey: localSaved.groqApiKey || (localFileConfig.groq && localFileConfig.groq.apiKey) || AI_CONFIG.groq.apiKey,
      model: localSaved.groqModel || AI_CONFIG.groq.model
    },
    gemini: {
      ...AI_CONFIG.gemini,
      apiKey: localSaved.geminiApiKey || (localFileConfig.gemini && localFileConfig.gemini.apiKey) || AI_CONFIG.gemini.apiKey,
      model: localSaved.geminiModel || AI_CONFIG.gemini.model
    },
    gnani: {
      ...AI_CONFIG.gnani,
      apiKey: localSaved.gnaniApiKey || (localFileConfig.gnani && localFileConfig.gnani.apiKey) || AI_CONFIG.gnani.apiKey
    }
  };
}

/**
 * Quick helper for developer console or quick key updates
 */
export function setLocalAIKeys({ groqApiKey, geminiApiKey, gnaniApiKey }) {
  if (typeof localStorage === 'undefined') return;
  const current = JSON.parse(localStorage.getItem('kalasetu_ai_keys') || '{}');
  if (groqApiKey !== undefined) current.groqApiKey = groqApiKey;
  if (geminiApiKey !== undefined) current.geminiApiKey = geminiApiKey;
  if (gnaniApiKey !== undefined) current.gnaniApiKey = gnaniApiKey;
  localStorage.setItem('kalasetu_ai_keys', JSON.stringify(current));
}
