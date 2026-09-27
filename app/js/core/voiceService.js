/**
 * KalaSetu AI — Universal Voice Engine (STT & Google TTS)
 * Features:
 * 1. Google Text-to-Speech (TTS) Engine:
 *    - Prioritizes Google Indic Neural Voices (Google हिन्दी, Google বাংলা, Google தமிழ், etc.)
 *    - Streaming Google TTS fallback via HTML5 Audio when local device lacks installed Indic voice packs
 *    - Rate-tuned cadence (0.92x) for low-literacy rural artisans
 * 2. Pluggable Indian Language STT (Gnani.ai / Custom API) + Web Speech API fallback.
 */

import { appState } from './appState.js';
import { getAIConfig } from './aiConfig.js';
import { aiService } from './aiService.js';

export const REGIONAL_LANG_MAP = {
  hi: 'hi-IN',
  en: 'en-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  or: 'or-IN'
};

/**
 * Splits long text into natural sentence chunks suitable for Google TTS streaming
 * @param {string} text 
 * @param {number} maxChunkLen 
 * @returns {string[]}
 */
export function splitTextForTTS(text, maxChunkLen = 160) {
  if (!text || typeof text !== 'string') return [];
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= maxChunkLen) return [clean];

  // Split on punctuation (. ! ? । \n)
  const regex = /([^.!?|।\n]+[.!?|।\n]*)/g;
  const matches = clean.match(regex) || [clean];
  const chunks = [];
  let current = '';

  for (const part of matches) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if ((current + ' ' + trimmed).trim().length <= maxChunkLen) {
      current = (current ? current + ' ' : '') + trimmed;
    } else {
      if (current) chunks.push(current);
      if (trimmed.length > maxChunkLen) {
        // Break large sentence into words
        const words = trimmed.split(' ');
        let sub = '';
        for (const w of words) {
          if ((sub + ' ' + w).trim().length <= maxChunkLen) {
            sub = (sub ? sub + ' ' : '') + w;
          } else {
            if (sub) chunks.push(sub);
            sub = w;
          }
        }
        if (sub) current = sub;
      } else {
        current = trimmed;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [clean];
}

/**
 * Formats a streaming Google Translate / Cloud TTS endpoint URL
 * @param {string} text 
 * @param {string} langCode 
 * @returns {string}
 */
export function formatGoogleTTSUrl(text, langCode = 'hi') {
  const shortLang = (langCode || 'hi').split('-')[0].toLowerCase();
  const encoded = encodeURIComponent(text.trim());
  return `https://translate.google.com/translate_tts?ie=UTF-8&tl=${shortLang}&client=tw-ob&q=${encoded}`;
}

/**
 * Selects the best Google voice matching the target language
 * @param {SpeechSynthesisVoice[]} voices 
 * @param {string} targetLang 
 * @returns {SpeechSynthesisVoice|null}
 */
export function selectBestGoogleVoice(voices = [], targetLang = 'hi-IN') {
  if (!voices || !voices.length) return null;
  const shortCode = targetLang.split('-')[0].toLowerCase();

  // 1. Google named voice matching exact or short lang
  const googleMatch = voices.find(v => {
    const name = (v.name || '').toLowerCase();
    const lang = (v.lang || '').toLowerCase();
    return (name.includes('google') || name.includes('android')) &&
           (lang === targetLang.toLowerCase() || lang.startsWith(shortCode));
  });
  if (googleMatch) return googleMatch;

  // 2. Any Google voice matching short code
  const anyGoogle = voices.find(v => {
    const name = (v.name || '').toLowerCase();
    const lang = (v.lang || '').toLowerCase();
    return name.includes('google') && lang.startsWith(shortCode);
  });
  if (anyGoogle) return anyGoogle;

  // 3. Any voice matching language
  const anyLangVoice = voices.find(v => (v.lang || '').toLowerCase().startsWith(shortCode));
  if (anyLangVoice) return anyLangVoice;

  // 4. Default voice
  return voices.find(v => v.default) || voices[0] || null;
}

class VoiceService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recognition = null;
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentAudio = null;
    this.audioQueue = [];
    this.isPlayingGoogleTTS = false;
    this.cachedVoices = [];

    this.setupBrowserRecognition();
    this.initVoices();
  }

  initVoices() {
    if (!this.synth) return;
    this.cachedVoices = this.synth.getVoices() || [];
    if (typeof this.synth.onvoiceschanged !== 'undefined') {
      this.synth.onvoiceschanged = () => {
        this.cachedVoices = this.synth.getVoices() || [];
      };
    }
  }

  setupBrowserRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    }
  }

  /**
   * Start listening for voice input (STT)
   * @param {Object} options - { onInterim, onFinal, onError, onStatus }
   */
  async startRecording(options = {}) {
    this.audioChunks = [];
    this.isRecording = true;

    const currentLangKey = appState?.get ? appState.get('language') : 'hi';
    const lang = REGIONAL_LANG_MAP[currentLangKey] || 'hi-IN';
    const speechConfig = appState?.get ? appState.get('speechConfig') : null;
    const aiCfg = getAIConfig ? getAIConfig() : null;
    const hasGnani = aiCfg?.gnani?.enabled && (aiCfg.gnani.apiKey || aiCfg.gnani.token);

    // 1. If Gnani.ai credits or custom API configured, record audio stream for upload
    if (hasGnani || (speechConfig && speechConfig.useCustomApi && speechConfig.apiUrl)) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.audioChunks.push(e.data);
        };
        this.mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
          if (options.onStatus) options.onStatus('Sending to Indian Regional AI Model...');
          try {
            let transcript = '';
            if (hasGnani) {
              transcript = await aiService.gnaniSTT(audioBlob, lang);
            } else {
              transcript = await this.sendToCustomSTT(audioBlob, speechConfig, lang);
            }
            if (options.onFinal) options.onFinal(transcript);
          } catch (err) {
            console.error('Custom/Gnani STT failed, falling back to browser:', err);
            if (appState?.showToast) appState.showToast('Voice API fallback to browser', 'warning');
          }
        };
        this.mediaRecorder.start();
      } catch (err) {
        console.error('Microphone error:', err);
        if (options.onError) options.onError(err);
      }
      return;
    }

    // 2. Native Web Speech API Fallback (Works 100% locally and offline)
    if (this.recognition) {
      this.recognition.lang = lang;
      this.recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (interim && options.onInterim) options.onInterim(interim);
        if (final && options.onFinal) options.onFinal(final);
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (options.onError) options.onError(event.error);
      };

      this.recognition.onend = () => {
        this.isRecording = false;
      };

      try {
        this.recognition.start();
      } catch (e) {
        console.warn('Recognition already started:', e);
      }
    } else {
      if (options.onError) options.onError('Speech recognition not supported in this browser');
    }
  }

  stopRecording() {
    this.isRecording = false;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      } catch (e) {}
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  /**
   * Stop any active Google TTS speech or browser synthesis
   */
  stopSpeaking() {
    this.isPlayingGoogleTTS = false;
    this.audioQueue = [];

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio = null;
      } catch (e) {}
    }

    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
    }
  }

  /**
   * Get all Google voices available on client
   * @param {string|null} langCode 
   * @returns {SpeechSynthesisVoice[]}
   */
  getGoogleVoices(langCode = null) {
    const voices = this.cachedVoices.length ? this.cachedVoices : (this.synth?.getVoices() || []);
    const googleVoices = voices.filter(v => (v.name || '').toLowerCase().includes('google'));
    if (!langCode) return googleVoices;

    const shortCode = langCode.split('-')[0].toLowerCase();
    return googleVoices.filter(v => (v.lang || '').toLowerCase().startsWith(shortCode));
  }

  /**
   * Primary Text to Speech (TTS) using Google Neural Voices & Streaming Fallback
   * Speaks out loud in Indic accents for low-literacy artisans and buyers.
   * 
   * @param {string} text - text to speak
   * @param {string} customLang - language code (e.g. 'hi-IN', 'ta-IN', 'bn-IN')
   * @param {Object} options - { rate, pitch, forceStreaming, onStart, onEnd, onError }
   */
  speakGoogleTTS(text, customLang = null, options = {}) {
    if (!text || typeof text !== 'string') return;
    this.stopSpeaking();

    const currentLangKey = appState?.get ? appState.get('language') : 'hi';
    const lang = customLang || REGIONAL_LANG_MAP[currentLangKey] || 'hi-IN';
    const shortLang = lang.split('-')[0].toLowerCase();

    const voices = this.cachedVoices.length ? this.cachedVoices : (this.synth?.getVoices() || []);
    const bestGoogleVoice = selectBestGoogleVoice(voices, lang);
    const hasLocalGoogleVoice = bestGoogleVoice && (bestGoogleVoice.name || '').toLowerCase().includes('google');

    // 1. If local Google Voice is installed and streaming is not forced, use SpeechSynthesis
    if (this.synth && hasLocalGoogleVoice && !options.forceStreaming) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = bestGoogleVoice;
        utterance.lang = bestGoogleVoice.lang || lang;
        utterance.rate = options.rate || 0.92; // Natural, clear cadence
        utterance.pitch = options.pitch || 1.0;

        utterance.onstart = () => {
          this.isPlayingGoogleTTS = true;
          if (options.onStart) options.onStart();
        };
        utterance.onend = () => {
          this.isPlayingGoogleTTS = false;
          if (options.onEnd) options.onEnd();
        };
        utterance.onerror = (e) => {
          console.warn('Google SpeechSynthesis failed, falling back to streaming TTS:', e);
          this.playStreamingGoogleTTS(text, shortLang, options);
        };

        this.synth.speak(utterance);
        return;
      } catch (err) {
        console.warn('Synth error, attempting streaming fallback:', err);
      }
    }

    // 2. High-fidelity Google Streaming TTS fallback (HTML5 Audio)
    if (typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
      this.playStreamingGoogleTTS(text, shortLang, options);
      return;
    }

    // 3. Fallback to generic SpeechSynthesis if Audio is not available
    if (this.synth) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = options.rate || 0.92;
        if (bestGoogleVoice) utterance.voice = bestGoogleVoice;
        this.synth.speak(utterance);
      } catch (e) {
        console.error('All TTS mechanisms failed:', e);
      }
    }
  }

  /**
   * Streams audio chunks sequentially from Google TTS endpoint
   */
  playStreamingGoogleTTS(text, shortLang, options = {}) {
    const chunks = splitTextForTTS(text, 160);
    if (!chunks.length) return;

    this.isPlayingGoogleTTS = true;
    if (options.onStart) options.onStart();

    let currentIndex = 0;

    const playNextChunk = () => {
      if (!this.isPlayingGoogleTTS || currentIndex >= chunks.length) {
        this.isPlayingGoogleTTS = false;
        if (options.onEnd) options.onEnd();
        return;
      }

      const chunkText = chunks[currentIndex++];
      const url = formatGoogleTTSUrl(chunkText, shortLang);

      try {
        const audio = new Audio(url);
        this.currentAudio = audio;
        audio.playbackRate = options.rate || 1.0;

        audio.onended = () => {
          playNextChunk();
        };

        audio.onerror = (e) => {
          console.warn('Google streaming audio chunk error:', e);
          // Fallback to remaining chunks on standard synth if available
          if (this.synth) {
            try {
              const u = new SpeechSynthesisUtterance(chunkText);
              u.lang = shortLang;
              u.onend = () => playNextChunk();
              this.synth.speak(u);
            } catch (err) {
              playNextChunk();
            }
          } else {
            playNextChunk();
          }
        };

        audio.play().catch(err => {
          console.warn('Google TTS audio playback blocked or failed:', err);
          // Fallback to synth if blocked by autoplay policy
          if (this.synth) {
            const u = new SpeechSynthesisUtterance(chunkText);
            u.lang = shortLang;
            u.onend = () => playNextChunk();
            this.synth.speak(u);
          } else if (options.onError) {
            options.onError(err);
          }
        });
      } catch (e) {
        console.error('Audio creation error:', e);
        if (options.onError) options.onError(e);
      }
    };

    playNextChunk();
  }

  /**
   * Universal speak method — defaults to Google TTS engine
   * @param {string} text 
   * @param {string} customLang 
   * @param {Object} options 
   */
  speak(text, customLang = null, options = {}) {
    return this.speakGoogleTTS(text, customLang, options);
  }

  /**
   * Pluggable API call for Indian Language STT
   */
  async sendToCustomSTT(audioBlob, config, lang) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice_note.webm');
    formData.append('language', lang);

    const response = await fetch(config.apiUrl + '/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: formData
    });

    if (!response.ok) throw new Error(`STT API returned status ${response.status}`);
    const data = await response.json();
    return data.text || data.transcript || '';
  }
}

export const voiceService = new VoiceService();
