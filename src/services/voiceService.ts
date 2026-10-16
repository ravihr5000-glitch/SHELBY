// Low-CPU Web Audio DSP & High-Reliability Speech & Voice Engine for SHELBY
import { LanguageMode, VadStatus, VoiceMetrics } from '../types';

export type VoiceState = 'standby' | 'listening' | 'processing' | 'speaking' | 'muted' | 'unsupported';

export interface VoiceCallbacks {
  onStateChange: (state: VoiceState) => void;
  onWakeWordDetected: (instantCommand?: string) => void;
  onLiveTranscript: (text: string, isFinal: boolean, confidence?: number) => void;
  onAudioLevel?: (level: number) => void;
  onMetrics?: (metrics: VoiceMetrics) => void;
  onError?: (err: string) => void;
}

export interface VoiceEngineConfig {
  wakeWordEnabled: boolean;
  micSensitivity: 'low' | 'medium' | 'high';
  wakeWordSensitivity: 'low' | 'medium' | 'high';
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  silenceTimeoutMs: number;
  language: LanguageMode;
  voiceAccent: string;
  ttsVolume: number;
}

// Broad phonetic & multilingual wake patterns for Indian English, Hindi, and Hinglish
const WAKE_PATTERNS = [
  /\b(?:hey|hay|hi|hello|ok|okay|oye|arrey|arre|are|sun|suno|haanji|haan|bolo)\s+(?:shelby|shelbi|selby|shelly|shelley|shilby|shall\s*we|shall\s*be|chelsea|sheldon|shilbi|silvia|shel)\b/i,
  /\b(?:shelby|shelbi|selby|shelly|shelley|shilby|chelsea|sholby)\b/i,
  /\b(?:हे|सुनो|अरे|नमस्ते|ओए|हाँजी|हाँ)?\s*(?:शेल्बी|शैलबी|शेलबी|सेल्बी|शिल्पी)\b/u,
  /\b(?:shelby|shelbi|selby)\s+(?:suno|sun|bolo|batao|kya\s+hai)\b/i,
];

export class VoiceService {
  private recognition: any = null;
  private isMuted: boolean = false;
  private isRunning: boolean = false;
  private isListeningForWakeWord: boolean = true;
  private isSpeakingTTS: boolean = false;
  private callbacks: VoiceCallbacks | null = null;

  // Configuration
  private config: VoiceEngineConfig = {
    wakeWordEnabled: true,
    micSensitivity: 'medium',
    wakeWordSensitivity: 'medium',
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    silenceTimeoutMs: 1200,
    language: 'English',
    voiceAccent: 'Indian English',
    ttsVolume: 0.9,
  };

  // Web Audio DSP chain
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private highpassFilter: BiquadFilterNode | null = null;
  private lowpassFilter: BiquadFilterNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private gainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  // VAD & Silence tracking
  private noiseFloor: number = 0.05;
  private currentVadStatus: VadStatus = 'silence';
  private silenceTimer: any = null;
  private currentConfidence: number = 0.85;

  // Watchdog & Resilience
  private restartTimeout: any = null;
  private heartbeatInterval: any = null;
  private recoveryCount: number = 0;
  private consecutiveErrors: number = 0;
  private lastErrorTime: number = 0;
  private permissionDenied: boolean = false;
  private activeInputLang: string = 'en-IN';

  constructor() {
    this.setupRecognition();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Warm up voices
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  /**
   * Initializes Speech Recognition instance with multilingual continuous listening
   */
  private setupRecognition() {
    if (!this.isSupported()) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3;
      this.updateLanguage();

      this.recognition.onstart = () => {
        this.isRunning = true;
        this.permissionDenied = false;
        this.consecutiveErrors = 0;
        if (!this.isMuted) {
          this.callbacks?.onStateChange(this.isListeningForWakeWord ? 'standby' : 'listening');
        }
        this.emitMetrics();
      };

      this.recognition.onresult = (event: any) => {
        if (this.isMuted || this.isSpeakingTTS) return;

        let interimTranscript = '';
        let finalTranscript = '';
        let maxConfidence = 0.85;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item[0]?.confidence && item[0].confidence > 0) {
            maxConfidence = item[0].confidence;
          }
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const candidateText = (finalTranscript || interimTranscript).trim();
        if (!candidateText) return;

        this.currentConfidence = Math.round(maxConfidence * 100) / 100;

        // Check if wake word mode is active AND enabled
        if (this.isListeningForWakeWord && this.config.wakeWordEnabled) {
          let matchedPattern: RegExp | undefined;
          let matchedText = '';

          for (const pattern of WAKE_PATTERNS) {
            if (pattern.test(candidateText)) {
              matchedPattern = pattern;
              matchedText = candidateText;
              break;
            }
          }

          if (matchedPattern) {
            const commandAfterWake = matchedText
              .replace(matchedPattern, '')
              .replace(/^[,.\s]+/, '')
              .trim();

            this.isListeningForWakeWord = false;
            this.callbacks?.onStateChange('listening');
            this.callbacks?.onWakeWordDetected(commandAfterWake.length > 0 ? commandAfterWake : undefined);

            if (commandAfterWake.length > 0) {
              this.callbacks?.onLiveTranscript(commandAfterWake, Boolean(finalTranscript), this.currentConfidence);
            }
            return;
          }

          // Even in wake-word standby, if user speaks a direct sentence or command, listen and process it!
          // This ensures SHELBY NEVER fails to listen
          if (candidateText.length > 0) {
            this.callbacks?.onLiveTranscript(candidateText, Boolean(finalTranscript), this.currentConfidence);
            if (finalTranscript) {
              if (this.silenceTimer) clearTimeout(this.silenceTimer);
              this.silenceTimer = setTimeout(() => {
                this.callbacks?.onLiveTranscript(finalTranscript.trim(), true, this.currentConfidence);
              }, 400);
            }
          }
        } else {
          // Direct command listening mode
          this.callbacks?.onLiveTranscript(candidateText, Boolean(finalTranscript), this.currentConfidence);

          if (this.silenceTimer) clearTimeout(this.silenceTimer);

          if (finalTranscript) {
            this.silenceTimer = setTimeout(() => {
              this.callbacks?.onLiveTranscript(finalTranscript.trim(), true, this.currentConfidence);
            }, 350);
          } else if (interimTranscript.length > 0) {
            this.silenceTimer = setTimeout(() => {
              this.callbacks?.onLiveTranscript(interimTranscript.trim(), true, this.currentConfidence);
            }, this.config.silenceTimeoutMs);
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        const error = event.error;
        if (error === 'no-speech') {
          return;
        }

        if (error === 'not-allowed' || error === 'service-not-allowed') {
          console.warn('Microphone permission blocked or not allowed:', error);
          this.permissionDenied = true;
          this.callbacks?.onStateChange('standby');
          return;
        }

        const now = Date.now();
        if (now - this.lastErrorTime < 1000) {
          this.consecutiveErrors++;
        } else {
          this.consecutiveErrors = 1;
        }
        this.lastErrorTime = now;

        if (!this.isMuted && !this.permissionDenied && !this.isSpeakingTTS) {
          const delay = Math.min(2000, 80 * Math.pow(2, Math.min(this.consecutiveErrors, 4)));
          this.restartRecognition(delay);
        }
      };

      this.recognition.onend = () => {
        this.isRunning = false;
        if (!this.isMuted && !this.permissionDenied && !this.isSpeakingTTS) {
          this.restartRecognition(60);
        }
      };
    } catch (e) {
      console.warn('SpeechRecognition setup error:', e);
    }

    // Secondary Heartbeat Watchdog
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (!this.isMuted && !this.permissionDenied && !this.isRunning && !this.isSpeakingTTS) {
        this.restartRecognition(30);
      }
    }, 2000);
  }

  /**
   * Safe restart handler
   */
  private restartRecognition(delayMs: number = 60) {
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    this.restartTimeout = setTimeout(() => {
      if (
        !this.isMuted &&
        !this.permissionDenied &&
        !this.isRunning &&
        !this.isSpeakingTTS &&
        this.recognition
      ) {
        try {
          this.recognition.start();
          this.recoveryCount++;
          this.emitMetrics();
        } catch {
          // Already running
        }
      }
    }, delayMs);
  }

  public setCallbacks(callbacks: VoiceCallbacks) {
    this.callbacks = callbacks;
  }

  public updateConfig(newConfig: Partial<VoiceEngineConfig>) {
    const prevLang = this.config.language;
    const prevAccent = this.config.voiceAccent;

    this.config = { ...this.config, ...newConfig };

    if (newConfig.ttsVolume !== undefined) {
      this.config.ttsVolume = Math.max(0, Math.min(1, newConfig.ttsVolume));
    }

    if (
      newConfig.language !== undefined &&
      (newConfig.language !== prevLang || newConfig.voiceAccent !== prevAccent)
    ) {
      this.updateLanguage();
    }

    this.emitMetrics();
  }

  public setLanguage(lang: LanguageMode) {
    this.updateConfig({ language: lang });
  }

  public setAccent(accent: string) {
    this.updateConfig({ voiceAccent: accent });
  }

  public setVolume(vol: number) {
    this.updateConfig({ ttsVolume: vol });
  }

  private updateLanguage() {
    if (!this.recognition) return;

    let targetLang = 'en-IN';
    if (this.config.language === 'Hindi' || this.config.voiceAccent === 'Hindi Native') {
      targetLang = 'hi-IN';
    } else {
      targetLang = 'en-IN';
    }

    this.activeInputLang = targetLang;

    if (this.recognition.lang !== targetLang) {
      this.recognition.lang = targetLang;
      if (this.isRunning) {
        try {
          this.recognition.stop();
        } catch {}
      }
    }
  }

  public async checkPermission(): Promise<'prompt' | 'granted' | 'denied' | 'unsupported'> {
    if (!this.isSupported()) return 'unsupported';
    if (this.permissionDenied) return 'denied';

    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      try {
        const status = await navigator.permissions.query({ name: 'microphone' as any });
        return status.state;
      } catch {}
    }
    return 'prompt';
  }

  /**
   * Activates listening immediately
   */
  public async activateHandsFree(): Promise<boolean> {
    if (!this.isSupported()) {
      this.callbacks?.onStateChange('unsupported');
      return false;
    }

    this.isMuted = false;
    this.permissionDenied = false;

    // Start recognition first so user speech is captured right away
    if (this.recognition && !this.isRunning) {
      try {
        this.recognition.start();
        this.isRunning = true;
      } catch {}
    }

    // Try setting up Web Audio for waveform meter (non-fatal if blocked)
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        if (!this.mediaStream) {
          this.mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: this.config.echoCancellation,
              noiseSuppression: this.config.noiseSuppression,
              autoGainControl: this.config.autoGainControl,
            },
          });
        }

        if (!this.audioContext && typeof window !== 'undefined') {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            this.audioContext = new AudioCtx({ latencyHint: 'interactive' });
          }
        }

        if (this.audioContext && this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        if (this.audioContext && this.mediaStream && !this.analyser) {
          this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
          this.highpassFilter = this.audioContext.createBiquadFilter();
          this.highpassFilter.type = 'highpass';
          this.highpassFilter.frequency.value = 85;

          this.lowpassFilter = this.audioContext.createBiquadFilter();
          this.lowpassFilter.type = 'lowpass';
          this.lowpassFilter.frequency.value = 7200;

          this.compressorNode = this.audioContext.createDynamicsCompressor();
          this.gainNode = this.audioContext.createGain();
          this.gainNode.gain.value = 1.1;

          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 64;

          this.sourceNode.connect(this.highpassFilter);
          this.highpassFilter.connect(this.lowpassFilter);
          this.lowpassFilter.connect(this.compressorNode);
          this.compressorNode.connect(this.gainNode);
          this.gainNode.connect(this.analyser);

          this.startAudioProcessingLoop();
        }
      }
    } catch (err: any) {
      console.warn('Web Audio DSP notice (native speech recognition remains active):', err?.message || err);
    }

    this.callbacks?.onStateChange(this.isListeningForWakeWord ? 'standby' : 'listening');
    this.emitMetrics();
    return true;
  }

  private startAudioProcessingLoop() {
    if (!this.analyser) return;
    const binCount = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(binCount);

    const update = () => {
      if (this.analyser && !this.isMuted) {
        this.analyser.getByteFrequencyData(dataArray);

        let totalSum = 0;
        let voiceBandSum = 0;
        for (let i = 0; i < binCount; i++) {
          totalSum += dataArray[i];
          if (i >= 2 && i <= 14) {
            voiceBandSum += dataArray[i];
          }
        }

        const avgLevel = totalSum / binCount / 255;
        const voiceRatio = totalSum > 0 ? voiceBandSum / totalSum : 0;

        if (avgLevel < this.noiseFloor) {
          this.noiseFloor = this.noiseFloor * 0.95 + avgLevel * 0.05;
        } else {
          this.noiseFloor = this.noiseFloor * 0.998 + avgLevel * 0.002;
        }
        this.noiseFloor = Math.max(0.01, Math.min(0.25, this.noiseFloor));

        let newVadStatus: VadStatus = 'silence';
        if (avgLevel > this.noiseFloor + 0.05 && voiceRatio > 0.3) {
          newVadStatus = 'speech';
        } else if (avgLevel > this.noiseFloor + 0.02) {
          newVadStatus = 'noise';
        }

        this.currentVadStatus = newVadStatus;
        this.callbacks?.onAudioLevel?.(avgLevel);

        if (Math.random() < 0.2) {
          this.emitMetrics(avgLevel);
        }
      } else {
        this.callbacks?.onAudioLevel?.(0);
        this.currentVadStatus = 'silence';
      }

      this.animFrameId = requestAnimationFrame(update);
    };

    update();
  }

  private emitMetrics(currentLevel: number = 0) {
    if (this.callbacks?.onMetrics) {
      this.callbacks.onMetrics({
        vadStatus: this.isMuted ? 'silence' : this.currentVadStatus,
        audioLevel: this.isMuted ? 0 : currentLevel,
        noiseFloor: Math.round(this.noiseFloor * 100) / 100,
        speechConfidence: this.currentConfidence,
        noiseSuppressionActive: this.config.noiseSuppression,
        echoCancellationActive: this.config.echoCancellation,
        autoGainControlActive: this.config.autoGainControl,
        activeInputLang: this.activeInputLang,
        recoveryCount: this.recoveryCount,
        isListening: this.isRunning && !this.isMuted && !this.isSpeakingTTS,
        isMuted: this.isMuted,
      });
    }
  }

  public returnToStandby() {
    this.isListeningForWakeWord = true;
    this.isSpeakingTTS = false;
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (!this.isMuted) {
      this.callbacks?.onStateChange('standby');
      this.restartRecognition(60);
    }
    this.emitMetrics();
  }

  public returnToWakeWordStandby() {
    this.returnToStandby();
  }

  public setProcessingState() {
    this.callbacks?.onStateChange('processing');
    this.emitMetrics();
  }

  /**
   * Direct push-to-talk / listen without requiring wake-word
   */
  public startListeningForCommand() {
    this.isMuted = false;
    this.permissionDenied = false;
    this.isListeningForWakeWord = false;
    this.isSpeakingTTS = false;
    if (this.silenceTimer) clearTimeout(this.silenceTimer);

    if (this.recognition && !this.isRunning) {
      try {
        this.recognition.start();
        this.isRunning = true;
      } catch {}
    } else {
      this.restartRecognition(20);
    }

    this.callbacks?.onStateChange('listening');
    this.emitMetrics();
  }

  public triggerWakeManually() {
    this.startListeningForCommand();
    this.callbacks?.onWakeWordDetected(undefined);
  }

  public muteMicrophone() {
    this.isMuted = true;
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    try {
      this.recognition?.stop();
    } catch {}
    this.callbacks?.onStateChange('muted');
    this.emitMetrics();
  }

  public unmuteMicrophone() {
    this.isMuted = false;
    this.permissionDenied = false;
    this.isListeningForWakeWord = true;
    this.restartRecognition(40);
    this.callbacks?.onStateChange('standby');
    this.emitMetrics();
  }

  public isMicrophoneMuted(): boolean {
    return this.isMuted;
  }

  public stopSpeaking(): void {
    this.isSpeakingTTS = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Vocalizes text aloud with clean speech synthesis and speech interruption safety
   */
  public speak(
    text: string,
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (e: any) => void;
    }
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        options?.onEnd?.();
        resolve();
        return;
      }

      this.stopSpeaking();

      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
        .replace(/#+\s/g, '')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/[•\-\*]\s/g, ', ')
        .trim();

      if (!cleanText) {
        options?.onEnd?.();
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.volume = this.config.ttsVolume;
      utterance.rate = 1.02;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      let chosenVoice: SpeechSynthesisVoice | null = null;

      if (this.config.language === 'Hindi' || this.config.voiceAccent === 'Hindi Native') {
        chosenVoice = voices.find((v) => v.lang.startsWith('hi')) || null;
      }

      if (!chosenVoice) {
        chosenVoice =
          voices.find(
            (v) =>
              v.lang === 'en-IN' ||
              v.name.toLowerCase().includes('india') ||
              v.name.toLowerCase().includes('hindi')
          ) || null;
      }

      if (!chosenVoice) {
        chosenVoice =
          voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Siri'))
          ) || voices.find((v) => v.lang.startsWith('en')) || null;
      }

      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      let safetyTimeout: any = null;

      utterance.onstart = () => {
        this.isSpeakingTTS = true;
        this.callbacks?.onStateChange('speaking');
        this.emitMetrics();
        options?.onStart?.();
      };

      const finishSpeaking = () => {
        if (safetyTimeout) clearTimeout(safetyTimeout);
        this.isSpeakingTTS = false;
        this.emitMetrics();
        options?.onEnd?.();
        resolve();
      };

      utterance.onend = finishSpeaking;
      utterance.onerror = (e) => {
        console.warn('Speech synthesis notice:', e);
        finishSpeaking();
      };

      if (window.speechSynthesis.paused) {
        try {
          window.speechSynthesis.resume();
        } catch {}
      }

      // Safety timeout: max 8 seconds or 60ms per char
      const timeoutMs = Math.min(10000, Math.max(3000, cleanText.length * 65));
      safetyTimeout = setTimeout(() => {
        if (this.isSpeakingTTS) {
          finishSpeaking();
        }
      }, timeoutMs);

      window.speechSynthesis.speak(utterance);
    });
  }

  public dispose() {
    this.stopSpeaking();
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }
}

export const voiceService = new VoiceService();
