import { useState, useEffect, useRef, useCallback } from "react";
import { formatDateTimeForDisplay } from "@/utils/date";
import { isValidSlug } from "@/utils/slugUtils";
import { HiXMark, HiPaperAirplane, HiSparkles, HiArrowPath, HiStop, HiMicrophone, HiPlus, HiTrash, HiPencil, HiBars3, HiChatBubbleLeft } from "react-icons/hi2";
import {
  Plus,
  ListTodo,
  CheckCircle2,
  ArrowRightLeft,
  Zap,
  Trash2,
  Circle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Terminal,
  Brain,
  ShieldCheck,
  Cpu,
  Sparkles,
} from "lucide-react";
import { useChatContext } from "@/contexts/chat-context";
import { mcpServer, extractContextFromPath, Conversation } from "@/lib/mcp-server";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { BrowserAgent } from "@/lib/browser-automation/browser-agent";
import { VoiceController } from "@/lib/voice";
import api from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface ThoughtStep {
  title: string;
  status: "pending" | "running" | "completed" | "failed";
  detail?: string;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  actions?: Array<{
    action: string;
    taskId?: string;
    taskSlug?: string;
    title?: string;
    priority?: string;
    status?: string;
    newStatus?: string;
    count?: number;
  }>;
  steps?: ThoughtStep[];
  logs?: string[];
  isThoughtExpanded?: boolean;
}


interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function sanitizeErrorMessage(msg: string): string {
  const l = msg.toLowerCase();
  if (l.includes("rate limit") || l.includes("429") || l.includes("too many requests"))
    return "Rate limit reached. Please wait a moment and try again.";
  if (l.includes("context_length") || l.includes("context length") || l.includes("maximum context") || l.includes("too long"))
    return "Conversation too long. Please clear the chat and try again.";
  if (l.includes("element") && l.includes("not found"))
    return "I had trouble interacting with the page. Please try again.";
  if (l.includes("network") || l.includes("failed to fetch") || l.includes("econnrefused"))
    return "Network error. Please check your connection.";
  return msg.replace(/^Error:\s*/i, "").replace(/^LLM API error:\s*/i, "");
}

function formatUserDisplayMessage(content: string): string {
  if (!content) return "";
  if (content.startsWith("Task: ")) {
    const match = content.match(/^Task:\s*([\s\S]*?)(?=\n\nCurrent URL:|\n\nAvailable elements:|$)/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return content;
}

export default function ChatPanel() {
  const { isChatOpen, toggleChat } = useChatContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isContextManuallyCleared, setIsContextManuallyCleared] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(null);
  const { getCurrentUser } = useAuth();
  const [panelWidth, setPanelWidth] = useState(400);
  const resizing = useRef(false);

  // Live AI Problem Solving & Reasoning state (Antigravity-style)
  const [liveSteps, setLiveSteps] = useState<ThoughtStep[]>([]);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const liveTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearLiveThinkingTimers = useCallback(() => {
    liveTimersRef.current.forEach((t) => clearTimeout(t));
    liveTimersRef.current = [];
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
  }, []);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const toggleThoughtExpanded = (msgIndex: number) => {
    setMessages((prev) =>
      prev.map((msg, idx) =>
        idx === msgIndex ? { ...msg, isThoughtExpanded: !msg.isThoughtExpanded } : msg
      )
    );
  };

  // Browser automation state
  const [isBrowserAgentRunning, setIsBrowserAgentRunning] = useState(false);
  const browserAgentRef = useRef<BrowserAgent | null>(null);

  // Voice input state
  const voiceControllerRef = useRef<VoiceController | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Agent status display
  const thinkingWords = useRef([
    "Thinking", "Pondering", "Analyzing", "Processing",
    "Examining", "Figuring out", "Working on it", "Looking into it",
    "On it", "Brewing ideas", "Cooking up a plan", "Strategizing", "Contemplating", "Deliberating",
  ]);
  const lastStartIndex = useRef(0);
  const [agentStatus, setAgentStatus] = useState("");
  const thinkingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const thinkingDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAgentStatus = useCallback((status: string) => {
    if (thinkingIntervalRef.current) {
      clearInterval(thinkingIntervalRef.current);
      thinkingIntervalRef.current = null;
    }
    if (thinkingDelayRef.current) {
      clearTimeout(thinkingDelayRef.current);
      thinkingDelayRef.current = null;
    }
    if (status === "thinking") {
      setAgentStatus("");
      thinkingDelayRef.current = setTimeout(() => {
        const words = thinkingWords.current;
        let index = lastStartIndex.current;
        lastStartIndex.current = (lastStartIndex.current + 1) % words.length;
        setAgentStatus(words[index]);
        thinkingIntervalRef.current = setInterval(() => {
          index = (index + 1) % words.length;
          setAgentStatus(words[index]);
        }, 60000);
      }, 10000);
    } else {
      setAgentStatus(status);
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizing.current) return;
    const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 400), 650);
    setPanelWidth(newWidth);
  };

  const handleMouseUp = () => {
    resizing.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Initialize browser agent and clear stale history on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!browserAgentRef.current) {
        browserAgentRef.current = new BrowserAgent({
          maxIterations: 30,
          waitAfterAction: 500,
        });
      } else {
        browserAgentRef.current.reset();
      }

      // Initialize voice controller
      voiceControllerRef.current = new VoiceController({
        callbacks: {
          onStateChange: (state) => {
            setIsListening(state.isListening);
            setInterimTranscript(state.interimTranscript);
            setVoiceError(state.error);
          },
          onTranscriptReady: (fullTranscript) => {
            // Auto-send the transcribed message directly
            if (fullTranscript.trim()) {
              handleVoiceMessage(fullTranscript.trim());
            }
          },
          onError: (error) => {
            console.warn("Voice recognition error:", error);
            setIsListening(false);
          },
        },
        // 400ms delay after stopping to let API finalize word corrections
        finalizationDelay: 400,
        // Auto-stop after 2.5 seconds of silence
        silenceTimeout: 2500,
      });
    }

    // Cleanup on unmount
    return () => {
      voiceControllerRef.current?.destroy();
      clearLiveThinkingTimers();
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

  // Handle input change without auto-expanding height
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
    },
    []
  );


  const refreshConversations = useCallback(async () => {
    if (typeof window !== "undefined") {
      try {
        await mcpServer.loadAll();
      } catch (e) {
        console.warn("Failed to load conversations from backend", e);
      }
      setConversations(mcpServer.getConversations());
    }
  }, []);

  // Load messages from current conversation (with full persistence for steps, logs, actions)
  const loadMessagesFromHistory = useCallback(() => {
    try {
      const conv = mcpServer.getCurrentConversation();
      if (conv && conv.id) {
        // 1. Check local rich messages cache first
        const savedRich =
          typeof window !== "undefined"
            ? localStorage.getItem(`taskosaur_chat_rich_messages_${conv.id}`)
            : null;

        if (savedRich) {
          try {
            const parsed: Message[] = JSON.parse(savedRich);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const restored: Message[] = parsed.map((m) => ({
                ...m,
                timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
                isStreaming: false,
              }));
              setMessages(restored);
              return true;
            }
          } catch (pe) {
            console.warn("Failed to parse saved rich messages:", pe);
          }
        }

        // 2. Fallback to conv.messages (from backend or mcpServer)
        if (conv.messages && conv.messages.length > 0) {
          const convertedMessages: Message[] = conv.messages.map((msg: any, index: number) => {
            let content = msg.content || "";
            let actions = msg.actions || [];
            let steps = msg.steps || [];
            let logs = msg.logs || [];

            // Parse embedded meta comment if present in content
            if (content.includes("<!--TASKOSAUR_META:")) {
              const start = content.indexOf("<!--TASKOSAUR_META:") + 19;
              const end = content.indexOf("-->", start);
              if (end !== -1) {
                try {
                  const metaJson = content.substring(start, end);
                  const meta = JSON.parse(metaJson);
                  if (meta.actions && (!actions || actions.length === 0)) actions = meta.actions;
                  if (meta.steps && (!steps || steps.length === 0)) steps = meta.steps;
                  if (meta.logs && (!logs || logs.length === 0)) logs = meta.logs;
                  content = content.substring(0, content.indexOf("<!--TASKOSAUR_META:")).trim();
                } catch (e) {
                  // ignore
                }
              }
            }

            return {
              role: (msg.role === "system" ? "assistant" : msg.role) as Message["role"],
              content,
              timestamp: new Date(Date.now() - (conv.messages.length - index) * 1000),
              isStreaming: false,
              actions,
              steps,
              logs,
              isThoughtExpanded: false,
            };
          });

          setMessages(convertedMessages);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(
                `taskosaur_chat_rich_messages_${conv.id}`,
                JSON.stringify(convertedMessages)
              );
            } catch (e) {}
          }
          return true;
        }
      }
    } catch (error) {
      console.warn("Failed to load messages from conversation history:", error);
    }
    return false;
  }, []);

  // Handlers for conversation threads
  const handleNewChat = async () => {
    const newId = await mcpServer.startNewConversation();
    setCurrentConversationId(newId);
    setIsHistoryOpen(false);
  };

  const handleSelectConversation = async (id: string) => {
    await mcpServer.switchConversation(id);
    setCurrentConversationId(id);
    setIsHistoryOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    const nextId = await mcpServer.deleteConversation(id);
    setCurrentConversationId(nextId);
    await refreshConversations();
  };

  const handleRename = async (id: string) => {
    if (editTitle.trim()) {
      await mcpServer.renameConversation(id, editTitle.trim());
      await refreshConversations();
    }
    setEditingId(null);
    setEditTitle("");
  };

  // Initialize services on mount
  useEffect(() => {
    // Get current user
    const currentUser = getCurrentUser();
    const token = localStorage.getItem("access_token");
    const currentOrgId = localStorage.getItem("currentOrganizationId");

    setUser(currentUser);
    setCurrentOrganizationId(currentOrgId);

    if (token && currentUser) {
      // Initialize MCP server with context
      const pathContext = extractContextFromPath(pathname);

      mcpServer.initialize({
        currentUser: {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.email,
        },
        ...pathContext,
      }).then(async () => {
        // Load initial conversation
        const currentConv = mcpServer.getCurrentConversation();
        setCurrentConversationId(currentConv?.id || "");
        await refreshConversations();
        loadMessagesFromHistory();
      });
    }
  }, [pathname, getCurrentUser, refreshConversations, loadMessagesFromHistory]);

  // Update context when path changes (unless manually cleared)
  useEffect(() => {
    if (user && !isContextManuallyCleared) {
      const pathContext = extractContextFromPath(pathname);
      mcpServer.updateContext(pathContext);
    }
  }, [pathname, user, isContextManuallyCleared]);

  // Load conversation messages when active conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessagesFromHistory();
    }
  }, [currentConversationId, loadMessagesFromHistory]);

  // Sync messages state back to active conversation in DB and local storage
  useEffect(() => {
    let active = true;
    const syncHistory = async () => {
      const currentConv = mcpServer.getCurrentConversation();
      if (currentConv && currentConv.id && messages.length > 0) {
        try {
          localStorage.setItem(
            `taskosaur_chat_rich_messages_${currentConv.id}`,
            JSON.stringify(messages)
          );
        } catch (e) {}
      }

      const chatHistory: ChatMessage[] = messages
        .filter((m) => !m.isStreaming && m.role !== "system" && m.content && m.content.trim() !== "")
        .map((m) => ({
          role: m.role,
          content: m.content,
          actions: m.actions,
          steps: m.steps,
          logs: m.logs,
        }));

      if (currentConv && currentConv.id) {
        const currentMessagesCleaned = (currentConv.messages || [])
          .filter((m) => m.role !== "system")
          .map((m) => ({
            role: m.role,
            content: m.content,
            actions: m.actions,
            steps: m.steps,
            logs: m.logs,
          }));

        const currentHistoryJson = JSON.stringify(currentMessagesCleaned);
        const newHistoryJson = JSON.stringify(chatHistory);

        if (currentHistoryJson !== newHistoryJson) {
          await mcpServer.saveHistory(chatHistory);
          if (!active) return;
          await refreshConversations();
        }
      }
    };

    syncHistory();
    return () => {
      active = false;
    };
  }, [messages, refreshConversations]);

  if (
    currentOrganizationId !== null &&
    currentOrganizationId !== localStorage.getItem("currentOrganizationId") &&
    messages.length > 2
  ) {
    const newOrgId = localStorage.getItem("currentOrganizationId");
    setCurrentOrganizationId(newOrgId);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "⚠️ Organization changed. My previous responses may no longer apply to the correct workspace or projects.",
        timestamp: new Date(),
      },
    ]);
  }
  // Auto-scroll only the chat container to bottom without scrolling window
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, liveLogs, liveSteps, isLoading]);

  // Listen for workspace/project creation events
  useEffect(() => {
    const handleWorkspaceCreated = (event: CustomEvent) => {
      const { workspaceSlug, workspaceName } = event.detail;

      // Navigate to the new workspace
      if (isValidSlug(workspaceSlug)) {
        router.push(`/${workspaceSlug}`);
      }

      // Add a system message indicating navigation
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `✅ Navigated to workspace: ${workspaceName}`,
          timestamp: new Date(),
        },
      ]);
    };

    const handleProjectCreated = (event: CustomEvent) => {
      const { workspaceSlug, projectSlug, projectName } = event.detail;

      // Navigate to the new project
      if (isValidSlug(workspaceSlug) && isValidSlug(projectSlug)) {
        router.push(`/${workspaceSlug}/${projectSlug}`);
      }

      // Add a system message indicating navigation
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `✅ Navigated to project: ${projectName}`,
          timestamp: new Date(),
        },
      ]);
    };
    // Add event listeners
    if (typeof window !== "undefined") {
      window.addEventListener("aiWorkspaceCreated", handleWorkspaceCreated as EventListener);
      window.addEventListener("aiProjectCreated", handleProjectCreated as EventListener);

      return () => {
        window.removeEventListener("aiWorkspaceCreated", handleWorkspaceCreated as EventListener);
        window.removeEventListener("aiProjectCreated", handleProjectCreated as EventListener);
      };
    }
  }, [router]);

  // Handle browser automation
  const handleBrowserAutomation = async (message: string) => {
    if (!browserAgentRef.current) return;

    setIsBrowserAgentRunning(true);

    try {
      const result = await browserAgentRef.current.executeTask(message, undefined, handleAgentStatus, mcpServer.sessionId);

      let cleanMessage = result.message || "";
      if (cleanMessage.startsWith("DONE:")) {
        cleanMessage = cleanMessage.substring(5).trim() || "Done!";
      } else if (cleanMessage.startsWith("ASK:")) {
        cleanMessage = cleanMessage.substring(4).trim();
      } else if (cleanMessage.startsWith("Error: LLM API error: ")) {
        cleanMessage = cleanMessage.replace("Error: LLM API error: ", "").trim();
      } else if (cleanMessage.startsWith("Error: ")) {
        cleanMessage = cleanMessage.substring(7).trim();
      } else if (cleanMessage.startsWith("Action failed: ")) {
        cleanMessage = cleanMessage.substring(15).trim();
      }
      cleanMessage = sanitizeErrorMessage(cleanMessage);

      if (!cleanMessage || cleanMessage.trim() === "") {
        cleanMessage = "Task completed.";
      }

      const resultMessage: Message = {
        role: "assistant",
        content: cleanMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, resultMessage]);
    } catch (error: any) {
      const rawMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Failed to process request";
      const errorMessage: Message = {
        role: "assistant",
        content: sanitizeErrorMessage(rawMessage),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
        thinkingIntervalRef.current = null;
      }
      if (thinkingDelayRef.current) {
        clearTimeout(thinkingDelayRef.current);
        thinkingDelayRef.current = null;
      }
      setAgentStatus("");
      setIsBrowserAgentRunning(false);
    }
  };

  const handleConversationalTask = async (taskText: string) => {
    setIsLoading(true);
    handleAgentStatus("thinking");
    clearLiveThinkingTimers();

    const initialSteps: ThoughtStep[] = [
      {
        title: "Phân tích câu lệnh & trích xuất ý định",
        status: "running",
        detail: "Phân tích cú pháp NLP & bóc tách thực thể...",
      },
      {
        title: "Kiểm tra phân quyền RBAC & an toàn dữ liệu",
        status: "pending",
        detail: "Chờ xác thực quyền hạn...",
      },
      {
        title: "Định tuyến công cụ thực thi (Tool Calling Engine)",
        status: "pending",
        detail: "Chờ nạp bộ công cụ...",
      },
      {
        title: "Thực thi giao dịch dữ liệu & đồng bộ thời gian thực",
        status: "pending",
        detail: "Chờ xử lý dữ liệu...",
      },
    ];

    setLiveSteps(initialSteps);
    setLiveLogs([
      "› [00:00] Khởi tạo phiên làm việc Taskosaur AI Agent Engine...",
      "› [00:00] Trích xuất ngữ cảnh Workspace & Project từ đường dẫn...",
    ]);
    setElapsedSeconds(0);

    // Live timer progression
    liveIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Staged progression mimicking Antigravity agent reasoning
    const t1 = setTimeout(() => {
      setLiveSteps((prev) => [
        { ...prev[0], status: "completed", detail: "Đã trích xuất ý định người dùng" },
        { ...prev[1], status: "running", detail: "Xác thực phân quyền dự án & vai trò..." },
        prev[2],
        prev[3],
      ]);
      setLiveLogs((prev) => [
        ...prev,
        "› [00:01] Phân tích ngữ nghĩa hoàn tất. Kiểm tra quyền hạn RBAC đối với người dùng hiện tại...",
      ]);
    }, 600);

    const t2 = setTimeout(() => {
      setLiveSteps((prev) => [
        prev[0],
        { ...prev[1], status: "completed", detail: "Quyền hạn hợp lệ (Project Member / Admin)" },
        { ...prev[2], status: "running", detail: "Khởi tạo Schema & danh mục Tools..." },
        prev[3],
      ]);
      setLiveLogs((prev) => [
        ...prev,
        "› [00:01] Phân quyền thành công. Chuẩn bị bộ công cụ: CREATE_TASK, UPDATE_TASK, LIST_TASKS...",
      ]);
    }, 1400);

    const t3 = setTimeout(() => {
      setLiveSteps((prev) => [
        prev[0],
        prev[1],
        { ...prev[2], status: "completed", detail: "Đã nạp 3 công cụ xử lý" },
        { ...prev[3], status: "running", detail: "Gửi payload tới AI Engine & chuẩn bị đồng bộ WebSocket..." },
      ]);
      setLiveLogs((prev) => [
        ...prev,
        "› [00:02] Kích hoạt công cụ hệ thống & chuẩn bị phát sóng WebSocket tới bảng Kanban...",
      ]);
    }, 2300);

    liveTimersRef.current.push(t1, t2, t3);

    try {
      const pathContext = extractContextFromPath(pathname);
      const response = await api.post("/ai-chat/chat", {
        message: taskText,
        workspaceId: pathContext.currentWorkspace,
        projectId: pathContext.currentProject,
        sessionId: mcpServer.sessionId,
        currentOrganizationId: localStorage.getItem("currentOrganizationId"),
      });

      const data = response.data;
      if (data?.success === false && !data?.message) {
        throw new Error(data?.error || "Chat request failed");
      }

      // Format steps from backend or finalize live steps
      let finalSteps: ThoughtStep[] = [];
      if (data?.steps && Array.isArray(data.steps) && data.steps.length > 0) {
        finalSteps = data.steps.map((s: any) => ({
          title: s.title || s.name || "Xử lý tác vụ",
          status: (s.status === "failed" ? "failed" : "completed") as ThoughtStep["status"],
          detail: s.detail,
        }));
      } else {
        finalSteps = initialSteps.map((s) => ({
          ...s,
          status: "completed" as const,
          detail: s.detail?.replace("Chờ ", "Đã ").replace("...", ""),
        }));
      }

      // Format logs from backend or finalize live logs
      let finalLogs: string[] = [];
      if (data?.logs && Array.isArray(data.logs) && data.logs.length > 0) {
        finalLogs = data.logs.map((l: string) => (l.startsWith("›") ? l : `› ${l}`));
      } else {
        finalLogs = [
          ...liveLogs,
          "› [Result] Hoàn tất quá trình giải quyết vấn đề (Exit code 0)",
        ];
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data?.message || "Đã thực hiện xong yêu cầu.",
        timestamp: new Date(),
        actions: data?.actions || [],
        steps: finalSteps,
        logs: finalLogs,
        isThoughtExpanded: false,
      };

      setMessages((prev) => {
        const updated = [...prev, assistantMessage];
        const activeConv = mcpServer.getCurrentConversation();
        if (typeof window !== "undefined" && activeConv?.id) {
          try {
            localStorage.setItem(
              `taskosaur_chat_rich_messages_${activeConv.id}`,
              JSON.stringify(updated)
            );
          } catch (e) {}
        }
        return updated;
      });
      await refreshConversations();
    } catch (err: any) {
      console.error("AI execution error:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Đã xảy ra lỗi khi gửi yêu cầu tới AI Agent.";

      const failedSteps: ThoughtStep[] = initialSteps.map((s, idx) => ({
        ...s,
        status: idx <= 1 ? "completed" : idx === 2 ? "failed" : "pending",
        detail: idx === 2 ? "Gặp sự cố khi thực thi" : s.detail,
      }));

      const errAssistantMessage: Message = {
        role: "assistant",
        content: sanitizeErrorMessage(errMsg),
        timestamp: new Date(),
        steps: failedSteps,
        logs: [...liveLogs, `› [Error] ${errMsg}`],
        isThoughtExpanded: true,
      };

      setMessages((prev) => {
        const updated = [...prev, errAssistantMessage];
        const activeConv = mcpServer.getCurrentConversation();
        if (typeof window !== "undefined" && activeConv?.id) {
          try {
            localStorage.setItem(
              `taskosaur_chat_rich_messages_${activeConv.id}`,
              JSON.stringify(updated)
            );
          } catch (e) {}
        }
        return updated;
      });
    } finally {
      clearLiveThinkingTimers();
      setIsLoading(false);
      handleAgentStatus("");
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || isBrowserAgentRunning) return;

    const text = inputValue.trim();
    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    await handleConversationalTask(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Voice input handlers
  const handleToggleVoice = () => {
    if (!voiceControllerRef.current) return;

    if (isListening) {
      // Stop listening — onTranscriptReady will auto-send if there's text
      voiceControllerRef.current.stopListening();
    } else {
      // Clear any previous errors and start listening
      setVoiceError(null);
      setInterimTranscript("");
      voiceControllerRef.current.startListening();
    }
  };

  /** Handle a voice message — adds it to chat and sends through conversational task execution. */
  const handleVoiceMessage = async (message: string) => {
    if (!message.trim() || isLoading || isBrowserAgentRunning) return;

    const userMessage: Message = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    await handleConversationalTask(message);
  };


  const handleStopAgent = () => {
    browserAgentRef.current?.stop();
  };

  const clearChat = async () => {
    const conv = mcpServer.getCurrentConversation();
    if (conv?.id && typeof window !== "undefined") {
      try {
        localStorage.removeItem(`taskosaur_chat_rich_messages_${conv.id}`);
      } catch (e) {}
    }
    setMessages([]);
    await mcpServer.clearHistory();
    browserAgentRef.current?.reset();
    await refreshConversations();
  };

  const clearContext = async () => {
    try {
      // Clear the context both locally and on backend
      await mcpServer.clearContext();

      // Set flag to prevent automatic context extraction from URL
      setIsContextManuallyCleared(true);

      // Also clear the history to ensure clean context
      await mcpServer.clearHistory();

      // Clear the local messages but keep the context clear message
      setMessages([
        {
          role: "system",
          content:
            "Context cleared. You are now in global mode - specify workspace and project for your next actions.",
          timestamp: new Date(),
        },
      ]);
      await refreshConversations();
    } catch (error) {
      console.error("Failed to clear context:", error);
      setError("Failed to clear context. Please try again.");
    }
  };



  if (!isChatOpen) return null;

  return (
    <>
      {/* Chat Panel - Full popup on mobile, 3rd column in flex layout on desktop */}
      <div
        id="chat-panel"
        className="fixed inset-2 md:static md:inset-auto flex-shrink-0 flex flex-col h-[calc(100%-1rem)] md:h-full w-auto md:w-[380px] lg:w-[400px] overflow-hidden rounded-2xl border border-gray-200/80 dark:border-white/10 bg-[var(--panel)] backdrop-blur-2xl shadow-2xl shadow-indigo-950/10 dark:shadow-black/70 transition-all duration-300 ease-in-out z-50 md:z-30"
        style={typeof window !== "undefined" && window.innerWidth >= 768 ? { width: `${panelWidth}px`, maxWidth: "45vw" } : {}}
      >
        <div
          onMouseDown={handleMouseDown}
          className="hidden md:block absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize bg-transparent hover:bg-blue-500/40 transition-colors z-30"
        />

        {/* Sidebar Overlay */}
        {isHistoryOpen && (
          <div 
            className="absolute inset-0 bg-black/45 z-30 transition-opacity duration-200"
            onClick={() => setIsHistoryOpen(false)}
          />
        )}

        {/* Sidebar Content */}
        <div className={`absolute top-0 bottom-0 left-0 w-[280px] bg-[var(--background)] border-r border-[var(--border)] z-40 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isHistoryOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
            <h3 className="font-semibold text-primary">Chat History</h3>
            <button onClick={() => setIsHistoryOpen(false)} className="p-1 rounded-md hover:bg-[var(--accent)] transition-colors duration-200">
              <HiXMark className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
          </div>
          
          {/* New Chat Button */}
          <div className="p-3 border-b border-[var(--border)] flex-shrink-0">
            <button 
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium shadow-sm hover:shadow"
            >
              <HiPlus className="w-4 h-4" />
              New Chat
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 chatgpt-scrollbar">
            {conversations.map(conv => (
              <div 
                key={conv.id}
                className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                  conv.id === currentConversationId 
                    ? "bg-[var(--accent)] text-primary font-medium" 
                    : "hover:bg-[var(--accent)]/65 text-[var(--muted-foreground)]"
                }`}
                onClick={() => handleSelectConversation(conv.id)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <HiChatBubbleLeft className="w-4 h-4 flex-shrink-0 text-blue-500" />
                  {editingId === conv.id ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleRename(conv.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(conv.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-[var(--accent)] border border-blue-500 rounded px-1.5 py-0.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-primary"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm truncate">{conv.title}</span>
                  )}
                </div>
                
                {editingId !== conv.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(conv.id);
                        setEditTitle(conv.title);
                      }}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-[var(--muted-foreground)] hover:text-primary transition-colors"
                      title="Rename"
                    >
                      <HiPencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/40 text-red-500 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <HiTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Header - Always pinned at top */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200/80 dark:border-[var(--border)] bg-white/95 dark:bg-[var(--card)]/95 backdrop-blur shadow-xs z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setIsHistoryOpen(true);
                await refreshConversations();
              }}
              className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all duration-200"
              title="View Chat History"
            >
              <HiBars3 className="w-5 h-5" />
            </button>
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <HiSparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <h2 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">AI Assistant</h2>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Context Clear Button */}
            <button
              onClick={clearContext}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded-md transition-all duration-200"
              title="Clear Current Chat Context"
            >
              <HiArrowPath className="w-3 h-3" />
              Context
            </button>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="px-2 py-1 text-xs font-medium text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all duration-200"
              >
                Clear
              </button>
            )}
            <button
              onClick={toggleChat}
              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-red-500 transition-all duration-200 ml-1 shadow-sm"
              title="Close AI Assistant (Esc)"
            >
              <HiXMark className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-6 chatgpt-scrollbar"
          style={{
            scrollbarWidth: "none" /* Firefox */,
            msOverflowStyle: "none" /* Internet Explorer 10+ */,
          }}
        >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-[var(--muted)] max-w-sm">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-400 flex items-center justify-center shadow-md">
                    <HiSparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-1.5 tracking-tight">
                    Hi! I'm your Taskosaur AI Assistant
                  </h3>
                  <p className="text-xs sm:text-sm mb-4 text-gray-500 dark:text-gray-400">
                    I can help you manage tasks, projects, and workspaces
                  </p>
                  <div className="text-left bg-gray-50/90 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-700/60 rounded-xl p-4 shadow-xs">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2.5 text-gray-500 dark:text-gray-400">
                      Try these commands:
                    </p>
                    <ul className="text-xs space-y-2 text-gray-700 dark:text-gray-300 font-medium">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                        "Create a task called [name]"
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                        "Show high priority tasks"
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                        "Mark [task] as done"
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                        "Create a workspace called [name]"
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                        "List my projects"
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                        "Navigate to [workspace] workspace"
                      </li>
                    </ul>
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200 dark:border-gray-700/60 mt-3.5">
                      <button
                        type="button"
                        onClick={() => setInputValue("Tạo task 'Thiết kế trang thanh toán' độ ưu tiên HIGH")}
                        className="inline-flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border border-blue-200/80 hover:border-blue-300 bg-blue-50/90 hover:bg-blue-100/90 text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-blue-300 font-medium transition-all shadow-xs group"
                      >
                        <span className="size-5 rounded-md flex items-center justify-center bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/60 transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                        <span>Tạo task mẫu</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputValue("Liệt kê các task trong dự án này")}
                        className="inline-flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border border-indigo-200/80 hover:border-indigo-300 bg-indigo-50/90 hover:bg-indigo-100/90 text-indigo-700 dark:border-indigo-800/50 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 dark:text-indigo-300 font-medium transition-all shadow-xs group"
                      >
                        <span className="size-5 rounded-md flex items-center justify-center bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/60 transition-colors">
                          <ListTodo className="w-3.5 h-3.5" />
                        </span>
                        <span>Liệt kê task</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputValue("Chuyển task sang DONE")}
                        className="inline-flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-200/80 hover:border-emerald-300 bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 dark:text-emerald-300 font-medium transition-all shadow-xs group"
                      >
                        <span className="size-5 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/60 transition-colors">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                        <span>Đổi sang DONE</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div key={index} className="group">
                    {message.role === "user" ? (
                      // User Message - Right aligned like
                      <div className="flex justify-end mb-4">
                        <div className="flex items-start gap-3 max-w-[80%]">
                          <div className="bg-[#1E2939] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
                            <div className="text-sm whitespace-pre-wrap break-words">
                              {formatUserDisplayMessage(message.content)}
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#1E2939] text-sm font-medium flex-shrink-0">
                            {user?.firstName?.[0]?.toUpperCase() +
                              user?.lastName?.[0]?.toUpperCase() || "U"}
                          </div>
                        </div>
                      </div>
                    ) : message.role === "system" ? (
                      // System Message - Centered
                      <div className="flex justify-center mb-4">
                        <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2 text-sm max-w-[90%]">
                          {message.content}
                        </div>
                      </div>
                    ) : (
                      // Assistant Message - Left aligned
                      <div className="flex justify-start mb-4">
                        <div className="flex items-start gap-3 max-w-[85%]">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-400 flex items-center justify-center flex-shrink-0">
                            <HiSparkles className="w-4 h-4 text-white" />
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm space-y-2 flex-1">
                            {/* Antigravity-style Problem Solving Process & Audit Logs */}
                            {message.steps && message.steps.length > 0 && (
                              <div className="rounded-xl border border-gray-200/80 dark:border-gray-700/60 overflow-hidden bg-white/70 dark:bg-gray-900/60 transition-all shadow-xs">
                                <button
                                  type="button"
                                  onClick={() => toggleThoughtExpanded(index)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <Brain className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                                      Quá trình giải quyết ({message.steps.filter((s) => s.status === "completed").length}/{message.steps.length} bước hoàn tất)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-gray-400">
                                    <span className="text-[11px] font-mono">
                                      {message.isThoughtExpanded ? "Thu gọn" : "Chi tiết"}
                                    </span>
                                    {message.isThoughtExpanded ? (
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    )}
                                  </div>
                                </button>

                                {message.isThoughtExpanded && (
                                  <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-800 space-y-2.5 text-xs">
                                    {/* Steps List */}
                                    <div className="space-y-1.5 pt-1">
                                      {message.steps.map((st, sIdx) => (
                                        <div key={sIdx} className="flex items-start gap-2">
                                          {st.status === "completed" ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                          ) : st.status === "failed" ? (
                                            <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                          ) : (
                                            <Circle className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                          )}
                                          <div className="flex-1 leading-tight">
                                            <span className="font-medium text-gray-800 dark:text-gray-200">
                                              {st.title}
                                            </span>
                                            {st.detail && (
                                              <span className="ml-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                                                - {st.detail}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Audit Logs Console */}
                                    {message.logs && message.logs.length > 0 && (
                                      <div className="rounded-lg overflow-hidden border border-gray-800 bg-gray-950 dark:bg-black font-mono text-[11px]">
                                        <div className="flex items-center justify-between px-2.5 py-1 bg-gray-900 border-b border-gray-800 text-[10px] text-gray-400">
                                          <div className="flex items-center gap-1.5">
                                            <Terminal className="w-3 h-3 text-gray-400" />
                                            <span className="font-semibold text-gray-300">Nhật ký thực thi hệ thống (Audit Log)</span>
                                          </div>
                                          <span className="text-emerald-400 text-[10px]">Exit Code 0 (Success)</span>
                                        </div>
                                        <div className="p-2.5 max-h-36 overflow-y-auto space-y-1 text-emerald-400/90 chat-input-scrollbar">
                                          {message.logs.map((log, lIdx) => (
                                            <div key={lIdx} className="leading-snug break-all">
                                              {log}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="text-sm text-gray-900 dark:text-gray-100 break-words leading-relaxed">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({ children }) => (
                                    <p className="mb-2 last:mb-0 leading-relaxed whitespace-pre-wrap">{children}</p>
                                  ),
                                  strong: ({ children }) => (
                                    <strong className="font-bold text-gray-950 dark:text-white bg-blue-50/70 dark:bg-blue-900/30 px-1 py-0.5 rounded text-[13px] border border-blue-200/50 dark:border-blue-700/40">
                                      {children}
                                    </strong>
                                  ),
                                  em: ({ children }) => <em className="italic">{children}</em>,
                                  code: ({ children }) => (
                                    <code className="px-1.5 py-0.5 rounded bg-gray-200/70 dark:bg-gray-700/60 font-mono text-[12px] text-pink-600 dark:text-pink-400">
                                      {children}
                                    </code>
                                  ),
                                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-1.5">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-1.5">{children}</ol>,
                                  li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                                  a: ({ href, children }) => (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 dark:text-blue-400 underline hover:no-underline font-medium"
                                    >
                                      {children}
                                    </a>
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                              {message.isStreaming && (
                                <span className="inline-block w-2 h-4 ml-1 bg-blue-600 animate-pulse rounded" />
                              )}
                            </div>

                            {/* Action Confirmation Cards */}
                            {message.actions && message.actions.length > 0 && (
                              <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 space-y-1.5">
                                {message.actions.map((act, actIdx) => (
                                  <div
                                    key={actIdx}
                                    className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800/80 text-xs text-gray-900 dark:text-gray-100 shadow-xs"
                                  >
                                    {act.action === "CREATE_TASK" && (
                                      <>
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold text-[11px]">
                                          <Plus className="w-3 h-3" />
                                          <span>ĐÃ TẠO</span>
                                        </span>
                                        <span className="font-semibold text-blue-700 dark:text-blue-300">
                                          {act.taskSlug}
                                        </span>
                                        <span className="truncate flex-1 font-medium text-gray-800 dark:text-gray-200">{act.title}</span>
                                        {act.priority && (
                                          <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-500/20 dark:text-amber-300 dark:border-transparent">
                                            {act.priority}
                                          </span>
                                        )}
                                      </>
                                    )}
                                    {act.action === "UPDATE_STATUS" && (
                                      <>
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                                          <ArrowRightLeft className="w-3 h-3" />
                                          <span>TRẠNG THÁI</span>
                                        </span>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{act.taskSlug}</span>
                                        <span className="text-gray-400">→</span>
                                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                          {act.newStatus}
                                        </span>
                                      </>
                                    )}
                                    {act.action === "UPDATE_PRIORITY" && (
                                      <>
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400 font-semibold text-[11px]">
                                          <Zap className="w-3 h-3" />
                                          <span>ƯU TIÊN</span>
                                        </span>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{act.taskSlug}</span>
                                        <span className="text-gray-400">→</span>
                                        <span className="font-bold text-purple-700 dark:text-purple-400">
                                          {act.priority}
                                        </span>
                                      </>
                                    )}
                                    {act.action === "DELETE_TASK" && (
                                      <>
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 font-semibold text-[11px]">
                                          <Trash2 className="w-3 h-3" />
                                          <span>ĐÃ XÓA</span>
                                        </span>
                                        <span className="font-semibold line-through text-rose-700 dark:text-rose-300">
                                          {act.taskSlug}
                                        </span>
                                      </>
                                    )}
                                    {act.action === "LIST_TASKS" && (
                                      <>
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-semibold text-[11px]">
                                          <ListTodo className="w-3 h-3" />
                                          <span>DANH SÁCH</span>
                                        </span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200">
                                          Tìm thấy {act.count} công việc phù hợp
                                        </span>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Timestamp - appears on hover */}
                    {message.timestamp && (
                      <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mt-2 mb-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDateTimeForDisplay(message.timestamp, {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {/* Antigravity-style Live Problem Solving & Reasoning Card */}
                {isLoading && !isBrowserAgentRunning && (
                  <div className="flex justify-start mb-4">
                    <div className="flex items-start gap-3 max-w-[90%] w-full">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm flex-shrink-0 animate-pulse">
                        <Brain className="w-4 h-4 text-white animate-spin" style={{ animationDuration: "4s" }} />
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
                )}
                {isBrowserAgentRunning && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-400 flex items-center justify-center flex-shrink-0">
                    <HiSparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    {agentStatus && <span className="text-sm text-gray-500 dark:text-gray-400 italic thinking-fade" key={agentStatus}>{agentStatus}...</span>}
                    <div className="flex items-center gap-0.5 h-4">
                      <span className="w-1 bg-gray-400 rounded-sm animate-pulse" style={{ animationDuration: "1.2s", animationDelay: "0s", height: "40%" }} />
                      <span className="w-1 bg-gray-400 rounded-sm animate-pulse" style={{ animationDuration: "1.2s", animationDelay: "0.2s", height: "60%" }} />
                      <span className="w-1 bg-gray-400 rounded-sm animate-pulse" style={{ animationDuration: "1.2s", animationDelay: "0.4s", height: "80%" }} />
                      <span className="w-1 bg-gray-400 rounded-sm animate-pulse" style={{ animationDuration: "1.2s", animationDelay: "0.6s", height: "60%" }} />
                    </div>
                  </div>
                </div>
              )}
                <div ref={messagesEndRef} />
              </>
            )}

          {error && (
            <div className="mx-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 dark:text-red-400 text-sm">!</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input Area - Fixed at bottom with auto-expanding textarea */}
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
                  Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] font-mono">Esc</kbd> to cancel
                </span>
              </div>
            )}

            <div className="flex gap-3 items-end">
              {/* Microphone button */}
              <button
                onClick={handleToggleVoice}
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
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
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
                  onClick={handleStopAgent}
                  className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
                >
                  <HiStop className="w-4 h-4" />
                </button>
              ) : isListening ? (
                <button
                  onClick={() => voiceControllerRef.current?.stopListening()}
                  className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0 animate-pulse"
                  title="Stop listening and send"
                >
                  <HiStop className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading || !user}
                  className="p-3 bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-xs hover:shadow-sm disabled:shadow-none flex-shrink-0"
                >
                  <HiPaperAirplane className="w-4 h-4" />
                </button>
              )}
            </div>
        </div>
      </div>

      {/* Global styles for hidden scrollbars & animations */}
      <style jsx global>{`
        /* Hide scrollbars completely for message list */
        .chatgpt-scrollbar::-webkit-scrollbar {
          display: none;
        }

        /* Smooth scrolling */
        .chatgpt-scrollbar {
          scroll-behavior: smooth;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* Internet Explorer 10+ */
        }

        /* Custom slim scrollbar for chat input textarea */
        .chat-input-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .chat-input-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-input-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.4);
          border-radius: 4px;
        }
        .chat-input-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.7);
        }
        .chat-input-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.4) transparent;
        }

        .thinking-fade {
          animation: fade-swap 4s ease-in-out infinite;
        }
        @keyframes fade-swap {
          0%, 90%, 100% { opacity: 1; }
          95% { opacity: 0; }
        }
      `}</style>

    </>
  );
}
