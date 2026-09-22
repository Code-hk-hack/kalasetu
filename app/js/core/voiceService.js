/**
 * KalaSetu AI — Universal Voice Engine (STT & TTS)
 * Supports custom Indian Language STT/TTS API credits + native browser fallback.
 */

import { appState } from './appState.js';
import { getAIConfig } from './aiConfig.js';
import { aiService } from './aiService.js';

class VoiceService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recognition = null;
    this.synth = window.speechSynthesis;

    this.setupBrowserRecognition();
  }

  setupBrowserRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    }
  }

  /**
   * Start listening for voice input
   * @param {Object} options - { onInterim, onFinal, onError }
   */
  async startRecording(options = {}) {
    this.audioChunks = [];
    this.isRecording = true;

    const langMap = {
      hi: 'hi-IN', en: 'en-IN', mr: 'mr-IN', bn: 'bn-IN',
      ta: 'ta-IN', te: 'te-IN', gu: 'gu-IN', kn: 'kn-IN', or: 'or-IN'
    };
    const lang = langMap[appState.get('language')] || 'hi-IN';
    const speechConfig = appState.get('speechConfig');
    const aiCfg = getAIConfig();
    const hasGnani = (aiCfg.gnani.apiKey || aiCfg.gnani.token) && aiCfg.gnani.enabled;

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
            appState.showToast('Voice API fallback to browser', 'warning');
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
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  /**
   * Pluggable API call for Boss's Indian Language STT credits
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

  /**
   * Text to Speech (TTS) — Speak instructions out loud for low-literacy artisans
   * @param {string} text - text to speak
   * @param {string} customLang - optional language code
   */
  speak(text, customLang = null) {
    if (!this.synth) return;
    this.synth.cancel(); // Stop any currently playing audio

    const langMap = {
      hi: 'hi-IN', en: 'en-IN', mr: 'mr-IN', bn: 'bn-IN',
      ta: 'ta-IN', te: 'te-IN', gu: 'gu-IN', kn: 'kn-IN', or: 'or-IN'
    };
    const lang = customLang || langMap[appState.get('language')] || 'hi-IN';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95; // Slightly slower for clear regional comprehension
    utterance.pitch = 1.0;

    // Pick appropriate regional voice if available
    const voices = this.synth.getVoices();
    const voice = voices.find(v => v.lang.startsWith(lang.substring(0, 2)));
    if (voice) utterance.voice = voice;

    this.synth.speak(utterance);
  }
}

export const voiceService = new VoiceService();
