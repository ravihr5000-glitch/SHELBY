// High-Sensitivity Hands-Free Speech Engine & Web Audio Analyser for SHELBY
import { LanguageMode } from '../types';

export type VoiceState = 'standby' | 'listening' | 'processing' | 'speaking' | 'muted' | 'unsupported';
export type SpeechRecognitionStatus = VoiceState;

interface VoiceCallbacks {
  onStateChange: (state: VoiceState) => void;
  onWakeWordDetected: (instantCommand?: string) => void;
  onLiveTranscript: (text: string, isFinal: boolean) => void;
  onAudioLevel?: (level: number) => void;
  onError?: (err: string) => void;
}

// Broad phonetic patterns for "Shelby" / "Hey Shelby" matching across accents and transcription quirks
const WAKE_PATTERNS = [
  // Full conversational prefixes
  /\b(?:hey|hay|hi|hello|ok|okay|oye|arrey|arre|are|sun|suno)\s+(?:shelby|shelbi|selby|shelly|shelley|shilby|shall\s*we|shall\s*be|chelsea|sheldon|shilbi)\b/i,
  // Standalone name variants (STT often renders "Shelby" as "Shelby", "Shelly", "Selby", "Shall we", etc.)
  /\b(?:shelby|shelbi|selby|shelly|shelley|shilby|chelsea)\b/i,
  // Common multi-word misheard phrases when saying "Shelby"
  /\bshall\s+we\b/i,
  /\bshall\s+be\b/i,
  // Devanagari Hindi variations
  /\b(?:हे|सुनो|अरे|नमस्ते|ओए)?\s*(?:शेल्बी|शैलबी|शेलबी|सेल्बी)\b/u,
];

export class VoiceService {
  private recognition: any = null;
  private isMuted: boolean = false;
  private isRunning: boolean = false;
  private isListeningForWakeWord: boolean = true;
  private isSpeakingTTS: boolean = false;
  private volume: number = 0.95;
  private speechRate: number = 1.0;
  private speechPitch: number = 1.0;
  private preferredAccent: string = 'Indian English';
  private currentLanguage: LanguageMode = 'English';
  private callbacks: VoiceCallbacks | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private restartTimeout: any = null;
  private heartbeatInterval: any = null;
  private silenceTimer: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private permissionDenied: boolean = false;

  constructor() {
    this.setupRecognition();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Cached browser voices populated
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

  private setupRecognition() {
    if (!this.isSupported()) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3; // Get alternate hypotheses for high detection sensitivity
      this.updateLanguage();

      this.recognition.onstart = () => {
        this.isRunning = true;
        this.permissionDenied = false;
        if (!this.isMuted) {
          this.callbacks?.onStateChange(this.isListeningForWakeWord ? 'standby' : 'listening');
        }
      };

      this.recognition.onresult = (event: any) => {
        // Discard recognition while assistant is vocalizing response aloud
        if (this.isMuted || this.isSpeakingTTS) return;

        let interimTranscript = '';
        let finalTranscript = '';
        let fullAccumulated = '';

        for (let i = 0; i < event.results.length; i++) {
          fullAccumulated += event.results[i][0].transcript + ' ';
        }

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const candidateText = (finalTranscript || interimTranscript || fullAccumulated).trim();
        if (!candidateText) return;

        // 1. Hands-Free Wake-Word Detection Mode ("Shelby" / "Hey Shelby")
        if (this.isListeningForWakeWord) {
          // Check primary transcript and all alternative hypotheses
          let matchedPattern: RegExp | undefined;
          let matchedText = '';

          for (const pattern of WAKE_PATTERNS) {
            if (pattern.test(candidateText)) {
              matchedPattern = pattern;
              matchedText = candidateText;
              break;
            }
            if (pattern.test(fullAccumulated)) {
              matchedPattern = pattern;
              matchedText = fullAccumulated;
              break;
            }
          }

          // Also check alternative recognition items if available
          if (!matchedPattern && event.results.length > 0) {
            const lastResult = event.results[event.results.length - 1];
            for (let a = 0; a < lastResult.length; a++) {
              const alt = lastResult[a].transcript;
              for (const pattern of WAKE_PATTERNS) {
                if (pattern.test(alt)) {
                  matchedPattern = pattern;
                  matchedText = alt;
                  break;
                }
              }
              if (matchedPattern) break;
            }
          }

          if (matchedPattern) {
            // Wake word detected! Extract any command spoken immediately after the wake word
            const commandAfterWake = matchedText
              .replace(matchedPattern, '')
              .replace(/^[,.\s]+/, '')
              .trim();

            this.isListeningForWakeWord = false;
            this.callbacks?.onStateChange('listening');
            this.callbacks?.onWakeWordDetected(commandAfterWake.length > 2 ? commandAfterWake : undefined);

            if (commandAfterWake.length > 2) {
              this.callbacks?.onLiveTranscript(commandAfterWake, Boolean(finalTranscript));
            }
          }
        } else {
          // 2. Active Command Listening Mode (User is actively speaking to SHELBY)
          const textToReport = (finalTranscript || interimTranscript).trim();
          if (textToReport) {
            this.callbacks?.onLiveTranscript(textToReport, Boolean(finalTranscript));
          }

          if (this.silenceTimer) clearTimeout(this.silenceTimer);

          if (finalTranscript.trim().length > 1) {
            // User finished speaking a final sentence segment
            this.silenceTimer = setTimeout(() => {
              this.callbacks?.onLiveTranscript(finalTranscript.trim(), true);
            }, 550);
          } else if (interimTranscript.trim().length > 2) {
            // Natural pause in speech after user pauses for 1.6s
            this.silenceTimer = setTimeout(() => {
              this.callbacks?.onLiveTranscript(interimTranscript.trim(), true);
            }, 1600);
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Silence is normal; keep listening
          return;
        }

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.permissionDenied = true;
          this.isMuted = true;
          this.callbacks?.onStateChange('muted');
          this.callbacks?.onError?.('Microphone permission blocked. Please allow microphone in browser.');
          return;
        }

        // For transient errors like network or aborted, auto-restart quickly
        if (!this.isMuted && !this.permissionDenied) {
          this.restartRecognition(100);
        }
      };

      this.recognition.onend = () => {
        this.isRunning = false;
        // Keep-alive: immediately restart recognition to prevent dropped listening
        if (!this.isMuted && !this.permissionDenied && !this.isSpeakingTTS) {
          this.restartRecognition(50);
        }
      };
    } catch (e) {
      console.warn('SpeechRecognition setup notice:', e);
    }

    // Start background watchdog heartbeat to ensure recognition never silently dies
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (!this.isMuted && !this.permissionDenied && !this.isRunning && !this.isSpeakingTTS) {
        try {
          this.recognition?.start();
        } catch {}
      }
    }, 4000);
  }

  private restartRecognition(delayMs: number = 50) {
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    this.restartTimeout = setTimeout(() => {
      if (!this.isMuted && !this.permissionDenied && !this.isRunning && !this.isSpeakingTTS && this.recognition) {
        try {
          this.recognition.start();
        } catch {
          // Ignore if already active
        }
      }
    }, delayMs);
  }

  public setCallbacks(callbacks: VoiceCallbacks) {
    this.callbacks = callbacks;
  }

  public async checkPermission(): Promise<'prompt' | 'granted' | 'denied' | 'unsupported'> {
    if (!this.isSupported()) return 'unsupported';
    if (this.permissionDenied) return 'denied';

    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      try {
        const status = await navigator.permissions.query({ name: 'microphone' as any });
        return status.state;
      } catch {
        // Permissions query not supported for mic in some browsers
      }
    }
    return 'prompt';
  }

  /**
   * Request microphone stream and start hands-free listening
   */
  public async activateHandsFree(): Promise<boolean> {
    if (!this.isSupported()) {
      this.callbacks?.onStateChange('unsupported');
      return false;
    }

    this.isMuted = false;
    this.isListeningForWakeWord = true;
    this.permissionDenied = false;

    // 1. Capture real audio stream via getUserMedia for live FFT
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        if (!this.mediaStream) {
          this.mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              channelCount: 1,
            },
          });
        }

        if (!this.audioContext && typeof window !== 'undefined') {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) this.audioContext = new AudioCtx();
        }

        if (this.audioContext && this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        if (this.audioContext && this.mediaStream && !this.analyser) {
          const source = this.audioContext.createMediaStreamSource(this.mediaStream);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 64;
          source.connect(this.analyser);
          this.startAudioVisualizerLoop();
        }
      }
    } catch (err: any) {
      console.warn('Mic permission error:', err);
      this.permissionDenied = true;
      this.isMuted = true;
      this.callbacks?.onStateChange('muted');
      this.callbacks?.onError?.('Microphone access denied. Please click the lock icon in the URL bar to allow microphone.');
      return false;
    }

    // 2. Start speech recognition for wake phrase
    if (this.recognition && !this.isRunning) {
      try {
        this.recognition.start();
      } catch {
        // Already running
      }
    }

    this.callbacks?.onStateChange('standby');
    return true;
  }

  private startAudioVisualizerLoop() {
    if (!this.analyser) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const update = () => {
      if (this.analyser && !this.isMuted) {
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length / 255;
        this.callbacks?.onAudioLevel?.(avg);
      } else {
        this.callbacks?.onAudioLevel?.(0);
      }
      this.animFrameId = requestAnimationFrame(update);
    };

    update();
  }

  public returnToStandby() {
    this.isListeningForWakeWord = true;
    this.isSpeakingTTS = false;
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (!this.isMuted) {
      this.callbacks?.onStateChange('standby');
      this.restartRecognition(50);
    }
  }

  public returnToWakeWordStandby() {
    this.returnToStandby();
  }

  public setProcessingState() {
    this.callbacks?.onStateChange('processing');
  }

  /**
   * Opens active listening window for Rajveer's command
   */
  public startListeningForCommand() {
    this.isListeningForWakeWord = false;
    this.isSpeakingTTS = false;
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    this.callbacks?.onStateChange('listening');
    this.restartRecognition(30);
  }

  /**
   * Triggers wake detection directly (e.g. user taps core or button)
   */
  public triggerWakeManually() {
    this.isListeningForWakeWord = false;
    this.callbacks?.onStateChange('listening');
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
  }

  public unmuteMicrophone() {
    this.isMuted = false;
    this.isListeningForWakeWord = true;
    this.permissionDenied = false;
    this.restartRecognition(50);
    this.callbacks?.onStateChange('standby');
  }

  public isMicrophoneMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public setAccent(accent: string) {
    this.preferredAccent = accent;
    this.updateLanguage();
  }

  public setLanguage(lang: LanguageMode) {
    this.currentLanguage = lang;
    this.updateLanguage();
  }

  private updateLanguage() {
    if (!this.recognition) return;
    let targetLang = 'en-IN';

    if (this.currentLanguage === 'Hindi' || this.preferredAccent === 'Hindi Native') {
      targetLang = 'hi-IN';
    } else {
      // Indian English handles both English and Hinglish smoothly
      targetLang = 'en-IN';
    }

    if (this.recognition.lang !== targetLang) {
      this.recognition.lang = targetLang;
      if (this.isRunning) {
        try {
          this.recognition.stop();
        } catch {}
      }
    }
  }

  public stopSpeaking(): void {
    this.isSpeakingTTS = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Vocalizes text aloud with clean TTS and interruption safety
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
      utterance.volume = this.volume;
      utterance.rate = this.speechRate;
      utterance.pitch = this.speechPitch;

      const voices = window.speechSynthesis.getVoices();
      let chosenVoice: SpeechSynthesisVoice | null = null;

      if (this.currentLanguage === 'Hindi' || this.preferredAccent === 'Hindi Native') {
        chosenVoice = voices.find((v) => v.lang.startsWith('hi')) || null;
      }

      if (!chosenVoice) {
        // Preferred Indian English accent
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

      utterance.onstart = () => {
        this.isSpeakingTTS = true;
        this.currentUtterance = utterance;
        this.callbacks?.onStateChange('speaking');
        options?.onStart?.();
      };

      utterance.onend = () => {
        this.isSpeakingTTS = false;
        this.currentUtterance = null;
        options?.onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        this.isSpeakingTTS = false;
        this.currentUtterance = null;
        options?.onError?.(e);
        resolve();
      };

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
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }
}

export const voiceService = new VoiceService();
