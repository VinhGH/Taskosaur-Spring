import React from "react";
import {
  Brain,
  Sparkles,
  CheckCircle2,
  Loader2,
  Circle,
  Terminal,
} from "lucide-react";
import { ThoughtStep } from "./types";

interface ChatLiveReasoningProps {
  elapsedSeconds: number;
  liveSteps: ThoughtStep[];
  liveLogs: string[];
  formatSeconds: (sec: number) => string;
}

export const ChatLiveReasoning: React.FC<ChatLiveReasoningProps> = React.memo(
  ({ elapsedSeconds, liveSteps, liveLogs, formatSeconds }) => {
    return (
      <div className="flex justify-start mb-4">
        <div className="flex items-start gap-3 max-w-[90%] w-full">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm flex-shrink-0 animate-pulse">
            <Brain
              className="w-4 h-4 text-white animate-spin"
              style={{ animationDuration: "4s" }}
            />
          </div>

          <div className="bg-white dark:bg-gray-900 border border-blue-200/90 dark:border-blue-800/60 rounded-2xl rounded-tl-sm p-4 shadow-sm w-full space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                <span className="font-semibold text-xs text-gray-900 dark:text-gray-100 tracking-tight">
                  Taskosaur AI Agent đang giải quyết vấn đề...
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 text-[10px] font-medium font-mono">
                  <span className="size-1.5 rounded-full bg-blue-500 animate-ping" />
                  Active Reasoning
                </span>
                <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                  {formatSeconds(elapsedSeconds)}
                </span>
              </div>
            </div>

            {/* Progressive Reasoning Checklist */}
            <div className="space-y-2 py-1">
              {liveSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  {step.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : step.status === "running" ? (
                    <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 leading-tight">
                    <span
                      className={
                        step.status === "completed"
                          ? "text-gray-700 dark:text-gray-300 font-medium"
                          : step.status === "running"
                          ? "text-blue-600 dark:text-blue-400 font-semibold"
                          : "text-gray-400 dark:text-gray-500"
                      }
                    >
                      {step.title}
                    </span>
                    {step.detail && step.status === "running" && (
                      <span className="ml-1.5 text-[11px] text-gray-500 dark:text-gray-400 italic">
                        - {step.detail}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Live Terminal / Execution Logs */}
            <div className="rounded-xl overflow-hidden border border-gray-800/90 bg-gray-950 dark:bg-black shadow-inner">
              <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800 text-[10px] font-mono text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-rose-500/80" />
                  <span className="size-2 rounded-full bg-amber-500/80" />
                  <span className="size-2 rounded-full bg-emerald-500/80" />
                  <Terminal className="w-3 h-3 ml-1.5 text-gray-400" />
                  <span className="text-gray-300 font-medium">execution-audit.log</span>
                </div>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Stream
                </span>
              </div>
              <div className="p-3 max-h-36 overflow-y-auto font-mono text-[11px] text-emerald-400/90 space-y-1 chat-input-scrollbar">
                {liveLogs.map((log, lIdx) => (
                  <div key={lIdx} className="leading-relaxed break-all">
                    {log}
                  </div>
                ))}
                <div className="flex items-center gap-1 text-gray-400 pt-0.5">
                  <span className="text-emerald-500">›</span>
                  <span className="inline-block w-1.5 h-3.5 bg-emerald-400 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ChatLiveReasoning.displayName = "ChatLiveReasoning";
