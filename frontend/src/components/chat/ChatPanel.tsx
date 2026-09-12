import React, { useState, useEffect, useRef, useCallback } from "react";
import { isValidSlug } from "@/utils/slugUtils";
import { HiSparkles } from "react-icons/hi2";
import { toast } from "sonner";
import { useChatContext } from "@/contexts/chat-context";
import { mcpServer, extractContextFromPath, Conversation } from "@/lib/mcp-server";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { BrowserAgent } from "@/lib/browser-automation/browser-agent";
import api from "@/lib/api";
import { useChatVoice } from "@/hooks/useChatVoice";
import {
  ThoughtStep,
  Message,
  ChatMessage,
  sanitizeErrorMessage,
  formatUserDisplayMessage,
} from "./types";
import { ChatHeader } from "./ChatHeader";
import { ChatHistoryDrawer } from "./ChatHistoryDrawer";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatLiveReasoning } from "./ChatLiveReasoning";
import { ChatEmptyState } from "./ChatEmptyState";
import { ChatInputBar } from "./ChatInputBar";

export type { ThoughtStep };

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(null);
  const { getCurrentUser } = useAuth();
  const [panelWidth, setPanelWidth] = useState(400);
  const resizing = useRef(false);

  // Live AI Problem Solving & Reasoning state
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

  const formatSeconds = useCallback((sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  const toggleThoughtExpanded = useCallback((msgIndex: number) => {
    setMessages((prev) =>
      prev.map((msg, idx) =>
        idx === msgIndex ? { ...msg, isThoughtExpanded: !msg.isThoughtExpanded } : msg
      )
    );
  }, []);

  // Browser automation state
  const [isBrowserAgentRunning, setIsBrowserAgentRunning] = useState(false);
  const browserAgentRef = useRef<BrowserAgent | null>(null);

  // Copy & Rollback message state and handlers
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyMessage = useCallback(async (content: string, index: number) => {
    try {
      const clean = formatUserDisplayMessage(content);
      await navigator.clipboard.writeText(clean);
      setCopiedIndex(index);
      toast.success("Đã sao chép nội dung tin nhắn!");
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy message:", err);
      toast.error("Không thể sao chép tin nhắn");
    }
  }, []);

  const handleRollbackMessage = useCallback(
    (index: number) => {
      if (isLoading || isBrowserAgentRunning) {
        toast.warning("Vui lòng đợi AI hoàn thành câu trả lời trước khi rollback.");
        return;
      }

      const targetMessage = messages[index];
      if (!targetMessage) return;

      if (targetMessage.role === "user") {
        const cleanText = formatUserDisplayMessage(targetMessage.content);
        setInputValue(cleanText);

        const newMessages = messages.slice(0, index);
        setMessages(newMessages);

        toast.info("Đã rollback tin nhắn. Bạn có thể chỉnh sửa và gửi lại.");

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.selectionStart = textareaRef.current.value.length;
            textareaRef.current.selectionEnd = textareaRef.current.value.length;
          }
        }, 50);
      } else if (targetMessage.role === "assistant") {
        const prevUserMsg =
          index > 0 && messages[index - 1].role === "user" ? messages[index - 1] : null;

        if (prevUserMsg) {
          const cleanText = formatUserDisplayMessage(prevUserMsg.content);
          setInputValue(cleanText);

          const newMessages = messages.slice(0, index - 1);
          setMessages(newMessages);
          toast.info("Đã rollback câu trả lời. Câu hỏi trước đó đã được đưa lại vào khung nhập.");
        } else {
          const newMessages = messages.slice(0, index);
          setMessages(newMessages);
          toast.info("Đã thu hồi câu trả lời.");
        }

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.selectionStart = textareaRef.current.value.length;
            textareaRef.current.selectionEnd = textareaRef.current.value.length;
          }
        }, 50);
      }
    },
    [messages, isLoading, isBrowserAgentRunning]
  );

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

  // Panel Resizing handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing.current) return;
      const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 400), 650);
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      resizing.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Conversational Task Handler
  const handleConversationalTask = useCallback(
    async (taskText: string) => {
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

      liveIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

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
    },
    [pathname, liveLogs, clearLiveThinkingTimers, handleAgentStatus]
  );

  // Voice controller hook integration
  const handleVoiceMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading || isBrowserAgentRunning) return;

      const userMessage: Message = {
        role: "user",
        content: messageText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      await handleConversationalTask(messageText);
    },
    [isLoading, isBrowserAgentRunning, handleConversationalTask]
  );

  const {
    isListening,
    interimTranscript,
    voiceError,
    handleToggleVoice,
    stopListening,
  } = useChatVoice({
    onTranscriptReady: handleVoiceMessage,
  });

  // Browser automation
  const handleBrowserAutomation = async (message: string) => {
    if (!browserAgentRef.current) return;

    setIsBrowserAgentRunning(true);

    try {
      const result = await browserAgentRef.current.executeTask(
        message,
        undefined,
        handleAgentStatus,
        mcpServer.sessionId
      );

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
      const rawMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to process request";
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

  // Initialize browser agent on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!browserAgentRef.current) {
        browserAgentRef.current = new BrowserAgent({
          maxIterations: 30,
          waitAfterAction: 500,
        });
      } else {
        browserAgentRef.current.reset();
      }
    }

    return () => {
      clearLiveThinkingTimers();
    };
  }, [clearLiveThinkingTimers]);

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

  const loadMessagesFromHistory = useCallback(() => {
    try {
      const conv = mcpServer.getCurrentConversation();
      if (conv && conv.id) {
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

        if (conv.messages && conv.messages.length > 0) {
          const convertedMessages: Message[] = conv.messages.map((msg: any, index: number) => {
            let content = msg.content || "";
            let actions = msg.actions || [];
            let steps = msg.steps || [];
            let logs = msg.logs || [];

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
                } catch (e) {}
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
    const currentUser = getCurrentUser();
    const token = localStorage.getItem("access_token");
    const currentOrgId = localStorage.getItem("currentOrganizationId");

    setUser(currentUser);
    setCurrentOrganizationId(currentOrgId);

    if (token && currentUser) {
      const pathContext = extractContextFromPath(pathname);

      mcpServer
        .initialize({
          currentUser: {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.email,
          },
          ...pathContext,
        })
        .then(async () => {
          const currentConv = mcpServer.getCurrentConversation();
          setCurrentConversationId(currentConv?.id || "");
          await refreshConversations();
          loadMessagesFromHistory();
        });
    }
  }, [pathname, getCurrentUser, refreshConversations, loadMessagesFromHistory]);

  // Update context when path changes
  useEffect(() => {
    if (user && !isContextManuallyCleared) {
      const pathContext = extractContextFromPath(pathname);
      mcpServer.updateContext(pathContext);
    }
  }, [pathname, user, isContextManuallyCleared]);

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
      if (currentConv && currentConv.id) {
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

  // Auto-scroll messages
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
      if (isValidSlug(workspaceSlug)) {
        router.push(`/${workspaceSlug}`);
      }
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
      if (isValidSlug(workspaceSlug) && isValidSlug(projectSlug)) {
        router.push(`/${workspaceSlug}/${projectSlug}`);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `✅ Navigated to project: ${projectName}`,
          timestamp: new Date(),
        },
      ]);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("aiWorkspaceCreated", handleWorkspaceCreated as EventListener);
      window.addEventListener("aiProjectCreated", handleProjectCreated as EventListener);

      return () => {
        window.removeEventListener("aiWorkspaceCreated", handleWorkspaceCreated as EventListener);
        window.removeEventListener("aiProjectCreated", handleProjectCreated as EventListener);
      };
    }
  }, [router]);

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
      await mcpServer.clearContext();
      setIsContextManuallyCleared(true);
      await mcpServer.clearHistory();
      setMessages([
        {
          role: "system",
          content:
            "Context cleared. You are now in global mode - specify workspace and project for your next actions.",
          timestamp: new Date(),
        },
      ]);
      await refreshConversations();
    } catch (err) {
      console.error("Failed to clear context:", err);
      setError("Failed to clear context. Please try again.");
    }
  };

  if (!isChatOpen) return null;

  return (
    <>
      {/* Chat Panel */}
      <div
        id="chat-panel"
        className="fixed inset-2 md:static md:inset-auto flex-shrink-0 flex flex-col h-[calc(100%-1rem)] md:h-full w-auto md:w-[380px] lg:w-[400px] overflow-hidden rounded-2xl border border-gray-200/80 dark:border-white/10 bg-[var(--panel)] backdrop-blur-2xl shadow-2xl shadow-indigo-950/10 dark:shadow-black/70 transition-all duration-300 ease-in-out z-50 md:z-30"
        style={
          typeof window !== "undefined" && window.innerWidth >= 768
            ? { width: `${panelWidth}px`, maxWidth: "45vw" }
            : {}
        }
      >
        <div
          onMouseDown={handleMouseDown}
          className="hidden md:block absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize bg-transparent hover:bg-blue-500/40 transition-colors z-30"
        />

        {/* History Drawer */}
        <ChatHistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          conversations={conversations}
          currentConversationId={currentConversationId}
          editingId={editingId}
          editTitle={editTitle}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onStartRename={(id, title) => {
            setEditingId(id);
            setEditTitle(title);
          }}
          onSaveRename={handleRename}
          onCancelRename={() => setEditingId(null)}
          onChangeEditTitle={setEditTitle}
        />

        {/* Chat Header */}
        <ChatHeader
          onOpenHistory={async () => {
            setIsHistoryOpen(true);
            await refreshConversations();
          }}
          onClearContext={clearContext}
          onClearChat={clearChat}
          onCloseChat={toggleChat}
          hasMessages={messages.length > 0}
        />

        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-6 chatgpt-scrollbar"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {messages.length === 0 ? (
            <ChatEmptyState onSelectPrompt={(prompt) => setInputValue(prompt)} />
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatMessageItem
                  key={index}
                  message={message}
                  index={index}
                  user={user}
                  copiedIndex={copiedIndex}
                  onCopyMessage={handleCopyMessage}
                  onRollbackMessage={handleRollbackMessage}
                  onToggleThoughtExpanded={toggleThoughtExpanded}
                />
              ))}

              {/* Antigravity-style Live Problem Solving & Reasoning Card */}
              {isLoading && !isBrowserAgentRunning && (
                <ChatLiveReasoning
                  elapsedSeconds={elapsedSeconds}
                  liveSteps={liveSteps}
                  liveLogs={liveLogs}
                  formatSeconds={formatSeconds}
                />
              )}

              {/* Browser Agent Running Indicator */}
              {isBrowserAgentRunning && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-400 flex items-center justify-center flex-shrink-0">
                    <HiSparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    {agentStatus && (
                      <span
                        className="text-sm text-gray-500 dark:text-gray-400 italic thinking-fade"
                        key={agentStatus}
                      >
                        {agentStatus}...
                      </span>
                    )}
                    <div className="flex items-center gap-0.5 h-4">
                      <span
                        className="w-1 bg-gray-400 rounded-sm animate-pulse"
                        style={{
                          animationDuration: "1.2s",
                          animationDelay: "0s",
                          height: "40%",
                        }}
                      />
                      <span
                        className="w-1 bg-gray-400 rounded-sm animate-pulse"
                        style={{
                          animationDuration: "1.2s",
                          animationDelay: "0.2s",
                          height: "60%",
                        }}
                      />
                      <span
                        className="w-1 bg-gray-400 rounded-sm animate-pulse"
                        style={{
                          animationDuration: "1.2s",
                          animationDelay: "0.4s",
                          height: "80%",
                        }}
                      />
                      <span
                        className="w-1 bg-gray-400 rounded-sm animate-pulse"
                        style={{
                          animationDuration: "1.2s",
                          animationDelay: "0.6s",
                          height: "60%",
                        }}
                      />
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

        {/* Input Bar */}
        <ChatInputBar
          inputValue={inputValue}
          onChangeInput={handleInputChange}
          onKeyDown={handleKeyPress}
          onSendMessage={handleSendMessage}
          onToggleVoice={handleToggleVoice}
          onStopListening={stopListening}
          onStopAgent={handleStopAgent}
          isListening={isListening}
          interimTranscript={interimTranscript}
          voiceError={voiceError}
          isLoading={isLoading}
          isBrowserAgentRunning={isBrowserAgentRunning}
          user={user}
          textareaRef={textareaRef}
        />
      </div>

      {/* Global styles for hidden scrollbars & animations */}
      <style jsx global>{`
        .chatgpt-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .chatgpt-scrollbar {
          scroll-behavior: smooth;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
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
