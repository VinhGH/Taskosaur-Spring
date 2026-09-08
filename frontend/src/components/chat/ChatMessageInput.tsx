import React, { useState, useRef } from 'react';
import { ChannelResponse, ChatAttachment } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Send,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Megaphone,
  VolumeX,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessageInputProps {
  channel: ChannelResponse | null;
  onSendMessage: (content: string, attachments?: string | null) => Promise<void>;
  onUploadAttachment: (file: File) => Promise<ChatAttachment>;
  disabled?: boolean;
}

export default function ChatMessageInput({
  channel,
  onSendMessage,
  onUploadAttachment,
  disabled = false,
}: ChatMessageInputProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  if (!channel) return null;

  const isAdmin = channel.role === 'ADMIN';
  const isAnnouncementRestricted = channel.isAnnouncementOnly && !isAdmin;
  const isMuted = channel.isMuted;
  const isInputLocked = isAnnouncementRestricted || isMuted || disabled;

  const handleSend = async () => {
    if ((!content.trim() && attachments.length === 0) || isInputLocked || sending) return;

    setSending(true);
    try {
      const attachmentsJson = attachments.length > 0 ? JSON.stringify(attachments) : null;
      await onSendMessage(content.trim(), attachmentsJson);
      setContent('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setSending(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 25 * 1024 * 1024) {
          toast.error(`Tệp ${file.name} vượt quá giới hạn 25MB`);
          continue;
        }
        const uploaded = await onUploadAttachment(file);
        setAttachments((prev) => [...prev, uploaded]);
      }
    } catch (err: any) {
      toast.error('Lỗi khi tải lên tệp đính kèm');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-3.5 bg-white dark:bg-[#141620] border-t border-gray-200 dark:border-neutral-800 shrink-0">
      {/* Banner 1: Announcement Locked */}
      {isAnnouncementRestricted && (
        <div className="mb-2.5 flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium">
          <Megaphone size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <span>
            Chỉ Quản trị viên mới có quyền đăng tin trong kênh thông báo này.
          </span>
        </div>
      )}

      {/* Banner 2: Muted / Restricted */}
      {isMuted && (
        <div className="mb-2.5 flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs font-medium">
          <VolumeX size={14} className="text-red-500 shrink-0" />
          <span>
            Bạn đã bị Quản trị viên hạn chế gửi tin nhắn trong kênh này.
          </span>
        </div>
      )}

      {/* Attachments Preview Chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2.5 p-2 bg-gray-50 dark:bg-[#181a24] rounded-xl border border-gray-200 dark:border-neutral-800/60">
          {attachments.map((att, idx) => {
            const isImg = att.mimeType?.startsWith('image/');
            return (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#1e222e] border border-gray-200 dark:border-neutral-800 text-xs shadow-xs max-w-[240px]"
              >
                {isImg ? (
                  <ImageIcon size={13} className="text-sky-500 shrink-0" />
                ) : (
                  <FileText size={13} className="text-amber-500 shrink-0" />
                )}
                <span className="truncate text-gray-900 dark:text-white font-medium">{att.filename}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-400 shrink-0">
                  ({(att.size / 1024).toFixed(0)}KB)
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="text-gray-400 hover:text-red-500 dark:text-gray-400 ml-1 p-0.5 rounded transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input Row */}
      <div className="flex items-end gap-2 bg-gray-50 dark:bg-[#1a1d28] p-1.5 rounded-xl border border-gray-200 dark:border-neutral-800 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all shadow-xs">
        {/* Attachment Upload Button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
          disabled={isInputLocked || uploading}
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isInputLocked || uploading}
          onClick={() => fileInputRef.current?.click()}
          title="Đính kèm tệp / hình ảnh"
          className="h-9 w-9 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 dark:text-gray-400 dark:hover:text-white dark:hover:bg-neutral-800/60 shrink-0 rounded-lg"
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin text-blue-500" />
          ) : (
            <Paperclip size={16} />
          )}
        </Button>

        {/* Text Input */}
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          disabled={isInputLocked}
          placeholder={
            isInputLocked
              ? 'Bạn không có quyền gửi tin nhắn trong kênh này...'
              : `Nhắn tin trong #${channel.name}... (Nhấn Enter để gửi, Shift+Enter xuống dòng)`
          }
          rows={1}
          className="min-h-[38px] max-h-[140px] resize-none border-0 bg-transparent py-2 px-1 text-xs sm:text-sm shadow-none focus-visible:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white break-all [overflow-wrap:anywhere]"
        />

        {/* Send Button */}
        <Button
          type="button"
          size="sm"
          onClick={handleSend}
          disabled={isInputLocked || sending || (!content.trim() && attachments.length === 0)}
          className="h-9 w-9 p-0 shrink-0 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-40"
        >
          {sending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
        </Button>
      </div>
    </div>
  );
}
