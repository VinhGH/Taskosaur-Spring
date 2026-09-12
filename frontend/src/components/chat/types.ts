export interface ThoughtStep {
  title: string;
  status: "pending" | "running" | "completed" | "failed";
  detail?: string;
}

export interface MessageAction {
  action: string;
  taskId?: string;
  taskSlug?: string;
  title?: string;
  priority?: string;
  status?: string;
  newStatus?: string;
  count?: number;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  assignee?: string;
  assigneeUsername?: string;
  reporter?: string;
  reporterUsername?: string;
  projectName?: string;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  actions?: MessageAction[];
  steps?: ThoughtStep[];
  logs?: string[];
  isThoughtExpanded?: boolean;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  actions?: MessageAction[];
  steps?: ThoughtStep[];
  logs?: string[];
}

export function sanitizeErrorMessage(msg: string): string {
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

export function formatUserDisplayMessage(content: string): string {
  if (!content) return "";
  if (content.startsWith("Task: ")) {
    const match = content.match(/^Task:\s*([\s\S]*?)(?=\n\nCurrent URL:|\n\nAvailable elements:|$)/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return content;
}
