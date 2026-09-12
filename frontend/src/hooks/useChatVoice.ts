import { useState, useEffect, useRef, useCallback } from "react";
import { VoiceController } from "@/lib/voice";

interface UseChatVoiceOptions {
  onTranscriptReady: (fullTranscript: string) => void;
}

export function useChatVoice({ onTranscriptReady }: UseChatVoiceOptions) {
  const voiceControllerRef = useRef<VoiceController | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Keep a stable ref for onTranscriptReady callback
  const onTranscriptReadyRef = useRef(onTranscriptReady);
  useEffect(() => {
    onTranscriptReadyRef.current = onTranscriptReady;
  }, [onTranscriptReady]);

  // Initialize voice controller
  useEffect(() => {
    if (typeof window !== "undefined") {
      voiceControllerRef.current = new VoiceController({
        callbacks: {
          onStateChange: (state) => {
            setIsListening(state.isListening);
            setInterimTranscript(state.interimTranscript);
            setVoiceError(state.error);
          },
          onTranscriptReady: (fullTranscript) => {
            if (fullTranscript.trim()) {
              onTranscriptReadyRef.current(fullTranscript.trim());
            }
          },
          onError: (error) => {
            console.warn("Voice recognition error:", error);
            setIsListening(false);
          },
        },
        finalizationDelay: 400,
        silenceTimeout: 2500,
      });
    }

    return () => {
      voiceControllerRef.current?.destroy();
    };
  }, []);

  // Abort voice input on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isListening) {
        e.preventDefault();
        voiceControllerRef.current?.abort();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isListening]);

  // Abort voice input when clicking outside the chat panel
  useEffect(() => {
    if (!isListening) return;

    const handleClickOutside = (e: MouseEvent) => {
      const chatPanel = document.getElementById("chat-panel");
      if (chatPanel && !chatPanel.contains(e.target as Node)) {
        voiceControllerRef.current?.abort();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isListening]);

  const handleToggleVoice = useCallback(() => {
    if (!voiceControllerRef.current) return;

    if (isListening) {
      voiceControllerRef.current.stopListening();
    } else {
      setVoiceError(null);
      setInterimTranscript("");
      voiceControllerRef.current.startListening();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    voiceControllerRef.current?.stopListening();
  }, []);

  const abortVoice = useCallback(() => {
    voiceControllerRef.current?.abort();
  }, []);

  return {
    isListening,
    interimTranscript,
    voiceError,
    handleToggleVoice,
    stopListening,
    abortVoice,
  };
}
