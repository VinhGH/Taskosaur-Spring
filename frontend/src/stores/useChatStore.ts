import { create } from "zustand";

interface ChatState {
  isChatOpen: boolean;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isChatOpen: false,

  toggleChat: () =>
    set((state) => {
      const next = !state.isChatOpen;
      if (typeof document !== "undefined") {
        document.body.classList.toggle("chat-open", next);
      }
      return { isChatOpen: next };
    }),

  openChat: () =>
    set(() => {
      if (typeof document !== "undefined") {
        document.body.classList.add("chat-open");
      }
      return { isChatOpen: true };
    }),

  closeChat: () =>
    set(() => {
      if (typeof document !== "undefined") {
        document.body.classList.remove("chat-open");
      }
      return { isChatOpen: false };
    }),
}));
