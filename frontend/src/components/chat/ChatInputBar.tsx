import React from "react";
import { HiMicrophone, HiStop, HiPaperAirplane } from "react-icons/hi2";

interface ChatInputBarProps {
  inputValue: string;
  onChangeInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSendMessage: () => void;
  onToggleVoice: () => void;
  onStopListening: () => void;
  onStopAgent: () => void;
  isListening: boolean;
  interimTranscript: string;
  voiceError: string | null;
  isLoading: boolean;
  isBrowserAgentRunning: boolean;
  user: any;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = React.memo(
  ({
    inputValue,
    onChangeInput,
    onKeyDown,
    onSendMessage,
    onToggleVoice,
    onStopListening,
    onStopAgent,
    isListening,
    interimTranscript,
    voiceError,
    isLoading,
    isBrowserAgentRunning,
    user,
    textareaRef,
  }) => {
    return (
      <div className="flex-shrink-0 border-t border-gray-200/80 dark:border-[var(--border)] bg-white/90 dark:bg-[var(--card)]/90 backdrop-blur p-4">
        {/* Interim transcript display (shown while listening) */}
        {isListening && interimTranscript && (
          <div className="mb-2 px-1">
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">
              {interimTranscript}
            </span>
          </div>
        )}

        {/* Voice error display */}
        {voiceError && (
          <div className="mb-2 px-1">
            <span className="text-xs text-red-500 dark:text-red-400">
              {voiceError}
            </span>
          </div>
        )}

        {/* Cancel hint while listening */}
        {isListening && (
          <div className="mb-1 px-1">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] font-mono">
                Esc
              </kbd>{" "}
              to cancel
            </span>
          </div>
        )}

        <div className="flex gap-3 items-end">
          {/* Microphone button */}
          <button
            onClick={onToggleVoice}
            disabled={isLoading || isBrowserAgentRunning}
            className={`p-3 rounded-full flex items-center justify-center transition-all duration-200 shadow-xs hover:shadow-sm flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
              isListening
                ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700/60"
            }`}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            <HiMicrophone className="w-4 h-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={onChangeInput}
            onKeyDown={onKeyDown}
            placeholder={
              !user
                ? "Please log in to use AI assistant..."
                : isListening
                ? "Listening..."
                : "Message AI Assistant..."
            }
            disabled={isLoading || isBrowserAgentRunning || !user || isListening}
            rows={1}
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-[var(--muted)] border border-gray-200/80 dark:border-[var(--border)] focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-200 rounded-xl shadow-xs hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed overflow-y-auto resize-none chat-input-scrollbar text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            style={{
              height: "48px",
              maxHeight: "48px",
              lineHeight: "1.5",
            }}
          />
          {isBrowserAgentRunning ? (
            <button
              onClick={onStopAgent}
              className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
            >
              <HiStop className="w-4 h-4" />
            </button>
          ) : isListening ? (
            <button
              onClick={onStopListening}
              className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0 animate-pulse"
              title="Stop listening and send"
            >
              <HiStop className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onSendMessage}
              disabled={!inputValue.trim() || isLoading || !user}
              className="p-3 bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-xs hover:shadow-sm disabled:shadow-none flex-shrink-0"
            >
              <HiPaperAirplane className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

ChatInputBar.displayName = "ChatInputBar";
