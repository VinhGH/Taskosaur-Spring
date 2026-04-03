/**
 * VoiceController - Wraps the Web Speech Recognition API for voice input.
 *
 * Accumulates the full transcript internally while listening.
 * When stopListening() is called, emits the complete transcript via onTranscriptReady.
 */

export interface VoiceControllerState {
  isListening: boolean;
  isSupported: boolean;
  interimTranscript: string;
  error: string | null;
}

export interface VoiceControllerCallbacks {
  onStateChange?: (state: VoiceControllerState) => void;
  /** Called once when stopListening() is called, with the full accumulated transcript. */
  onTranscriptReady?: (fullTranscript: string) => void;
  onError?: (error: string) => void;
}

interface VoiceControllerOptions {
  callbacks?: VoiceControllerCallbacks;
  /** Delay in ms after stopping before emitting the final transcript.
   *  Gives the API time to finalize confidence-based corrections. Default: 300ms. */
  finalizationDelay?: number;
  /** Milliseconds of silence before auto-stopping. Default: 2500ms. */
  silenceTimeout?: number;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone access denied. Please allow microphone permission in your browser.",
  "no-speech": "No speech detected. Please try again.",
  "audio-capture": "No microphone found. Please ensure a microphone is connected.",
  network: "Network error. Please check your connection and try again.",
  aborted: "Speech recognition was aborted.",
  "language-not-supported": "The selected language is not supported.",
};

export class VoiceController {
  private recognition: SpeechRecognition | null = null;
  private state: VoiceControllerState;
  private callbacks: VoiceControllerCallbacks;
  private shouldKeepListening = false;
  /** Delay before emitting transcript to let API finalize corrections. */
  private finalizationDelay: number;
  /** Milliseconds of silence before auto-stopping. */
  private silenceTimeout: number;
  /** Internal accumulator for the full transcript across all speech segments. */
  private fullTranscript = "";
  /** Timer for the finalization delay. */
  private emitTimer: ReturnType<typeof setTimeout> | null = null;
  /** Timestamp of the last detected speech (for silence detection). */
  private lastSpeechTimestamp = 0;

  constructor(options: VoiceControllerOptions = {}) {
    this.callbacks = options.callbacks ?? {};
    this.finalizationDelay = options.finalizationDelay ?? 300;
    this.silenceTimeout = options.silenceTimeout ?? 2500;
    this.state = {
      isListening: false,
      isSupported: this.checkSupport(),
      interimTranscript: "",
      error: null,
    };
  }

  /** Check if Speech Recognition is available in this browser. */
  private checkSupport(): boolean {
    if (typeof window === "undefined") return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /** Get the SpeechRecognition constructor (normalized across browsers). */
  private getSpeechRecognitionClass(): typeof SpeechRecognition | null {
    if (typeof window === "undefined") return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  /** Get current state (read-only copy). */
  getState(): VoiceControllerState {
    return { ...this.state };
  }

  /** Update internal state and notify callback. */
  private setState(partial: Partial<VoiceControllerState>): void {
    this.state = { ...this.state, ...partial };
    this.callbacks.onStateChange?.(this.getState());
  }

  /** Start listening for speech. */
  startListening(): void {
    if (!this.state.isSupported) {
      const error = "Speech recognition is not supported in this browser.";
      this.setState({ error });
      this.callbacks.onError?.(error);
      return;
    }

    // Reset everything
    this.fullTranscript = "";
    this.lastSpeechTimestamp = 0;
    this.setState({
      isListening: true,
      interimTranscript: "",
      error: null,
    });

    this.shouldKeepListening = true;

    try {
      const SpeechRecognitionClass = this.getSpeechRecognitionClass();
      if (!SpeechRecognitionClass) {
        throw new Error("SpeechRecognition not available");
      }

      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";

      this.recognition.onstart = () => {
        this.setState({ isListening: true, error: null });
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let rebuiltFinal = "";
        let hasSpeech = false;

        // Rebuild the full transcript from scratch on every event.
        // This catches confidence-based corrections where the API
        // revises earlier words in a later onresult event.
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            rebuiltFinal += result[0].transcript;
            if (result[0].transcript.trim()) hasSpeech = true;
          } else {
            interimTranscript += result[0].transcript;
            if (result[0].transcript.trim()) hasSpeech = true;
          }
        }

        // Replace (don't append) — picks up any corrections
        this.fullTranscript = rebuiltFinal;

        // Update the last speech timestamp for silence detection
        if (hasSpeech) {
          this.lastSpeechTimestamp = Date.now();
        }

        // Update interim for live display
        if (interimTranscript) {
          this.setState({ interimTranscript });
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorMessage = ERROR_MESSAGES[event.error] || `Speech error: ${event.error}`;

        // "no-speech" is recoverable — don't treat as fatal error
        if (event.error === "no-speech") {
          this.setState({ interimTranscript: "" });
          return;
        }

        this.setState({
          error: errorMessage,
          isListening: false,
          interimTranscript: "",
        });
        this.callbacks.onError?.(errorMessage);
        this.shouldKeepListening = false;
      };

      this.recognition.onend = () => {
        if (!this.shouldKeepListening) {
          this.setState({ isListening: false });
          return;
        }

        // Check how long it's been since the last speech was detected
        const silenceDuration = Date.now() - this.lastSpeechTimestamp;
        const hasAnySpeech = this.lastSpeechTimestamp > 0;

        // Auto-stop if: no speech was ever detected, OR silence exceeded
        if (!hasAnySpeech || silenceDuration >= this.silenceTimeout) {
          this.shouldKeepListening = false;
          this.setState({ isListening: false, interimTranscript: "" });

          // Clear any pending emit timer
          if (this.emitTimer) {
            clearTimeout(this.emitTimer);
          }

          this.emitTimer = setTimeout(() => {
            const transcript = this.fullTranscript.trim();
            this.emitTimer = null;
            if (transcript) {
              this.callbacks.onTranscriptReady?.(transcript);
            }
          }, this.finalizationDelay);
        } else {
          // Had speech recently, still within window — restart
          try {
            this.recognition?.start();
          } catch {
            this.setState({ isListening: false });
            this.shouldKeepListening = false;
          }
        }
      };

      this.recognition.start();
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to start speech recognition.";
      this.setState({ error: errorMessage, isListening: false });
      this.callbacks.onError?.(errorMessage);
      this.shouldKeepListening = false;
    }
  }

  /**
   * Stop listening and emit the full accumulated transcript.
   * Waits a short delay to let the API finalize any last corrections
   * before emitting the transcript.
   */
  stopListening(): void {
    this.shouldKeepListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore if already stopped
      }
    }

    this.setState({ isListening: false, interimTranscript: "" });

    // Clear any pending emit timer
    if (this.emitTimer) {
      clearTimeout(this.emitTimer);
    }

    // Wait briefly for the API to finalize corrections, then emit
    this.emitTimer = setTimeout(() => {
      const transcript = this.fullTranscript.trim();
      this.emitTimer = null;
      if (transcript) {
        this.callbacks.onTranscriptReady?.(transcript);
      }
    }, this.finalizationDelay);
  }

  /** Abort immediately — discards any current transcript. */
  abort(): void {
    this.shouldKeepListening = false;
    this.fullTranscript = "";
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        this.recognition.stop();
      }
    }
    this.setState({
      isListening: false,
      interimTranscript: "",
    });
  }

  /** Reset transcripts (useful for a new voice session). */
  reset(): void {
    this.fullTranscript = "";
    this.setState({
      interimTranscript: "",
      error: null,
    });
  }

  /** Cleanup — abort recognition and clear references. */
  destroy(): void {
    this.shouldKeepListening = false;
    if (this.emitTimer) {
      clearTimeout(this.emitTimer);
      this.emitTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        try {
          this.recognition.stop();
        } catch {
          // Ignore
        }
      }
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition = null;
    }
  }
}
