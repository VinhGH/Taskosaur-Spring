import { ReactNode } from "react";
import { useChatStore } from "@/stores/useChatStore";

export const useChatContext = () => {
  const isChatOpen = useChatStore((state) => state.isChatOpen);
  const toggleChat = useChatStore((state) => state.toggleChat);

  return {
    isChatOpen,
    toggleChat,
  };
};

interface ChatProviderProps {
  children: ReactNode;
}

/**
 * ChatProvider - Kept for backwards compatibility.
 * State is now powered by Zustand store (useChatStore).
 */
export function ChatProvider({ children }: ChatProviderProps) {
  return <>{children}</>;
}

export default ChatProvider;
