import React, { useEffect, useRef, useState } from 'react';
import { ChannelMessage, ChannelResponse, ChatAttachment } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Copy,
  Download,
  FileText,
  MessageSquare,
  Lock,
  Megaphone,
  ShieldCheck,
  Users,
  QrCode,
  Settings,
  UserCheck,
  UserPlus,
  Globe,
  FolderKanban,
  RotateCcw,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ChatMessageAreaProps {
  channel: ChannelResponse | null;
  messages: ChannelMessage[];
  currentUserId?: string;
  onDeleteMessage: (messageId: string) => Promise<void>;
  loading?: boolean;
  onOpenInviteModal?: () => void;
  onOpenAddMemberModal?: () => void;
  onOpenSettingsModal?: () => void;
  onOpenJoinRequestsModal?: () => void;
  pendingRequestsCount?: number;
}

export default function ChatMessageArea({
  channel,
  messages,
  currentUserId,
  onDeleteMessage,
  loading = false,
  onOpenInviteModal,
  onOpenAddMemberModal,
  onOpenSettingsModal,
  onOpenJoinRequestsModal,
  pendingRequestsCount = 0,
}: ChatMessageAreaProps) {
  const { t } = useTranslation('chat');
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [recallingMessageId, setRecallingMessageId] = useState<string | null>(null);
  const [isRecalling, setIsRecalling] = useState(false);

  // Robust current user resolution
  const fallbackUserId = typeof window !== 'undefined' ? (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')?.id;
    } catch (e) {
      return undefined;
    }
  })() : undefined;
  const effectiveUserId = currentUserId || fallbackUserId;

  const handleConfirmRecall = async () => {
    if (!recallingMessageId) return;
    setIsRecalling(true);
    try {
      await onDeleteMessage(recallingMessageId);
      setRecallingMessageId(null);
    } catch (err) {
      // Toast error handled in useChat
    } finally {
      setIsRecalling(false);
    }
  };

  const isAtBottomRef = useRef(true);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const prevChannelIdRef = useRef<string | undefined>(undefined);
  const prevMessagesCountRef = useRef(0);

  // Monitor user's scroll position
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    // Consider at bottom if within 100px of the bottom
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    isAtBottomRef.current = atBottom;
    setShowScrollBottom(!atBottom && scrollHeight > clientHeight + 100);
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
      isAtBottomRef.current = true;
      setShowScrollBottom(false);
    }
  };

  // User-aware auto-scroll:
  // 1. Channel changed -> scroll to bottom instantly
  // 2. New message arrived -> only auto-scroll if user is already at bottom, or if user sent the message
  useEffect(() => {
    if (!messagesContainerRef.current) return;

    const channelChanged = channel?.id !== prevChannelIdRef.current;
    prevChannelIdRef.current = channel?.id;

    const hasNewMessage = messages.length > prevMessagesCountRef.current;
    prevMessagesCountRef.current = messages.length;

    if (channelChanged) {
      isAtBottomRef.current = true;
      setShowScrollBottom(false);
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    } else if (hasNewMessage) {
      const lastMessage = messages[messages.length - 1];
      const isMe = lastMessage?.senderId === effectiveUserId;

      if (isMe || isAtBottomRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
        isAtBottomRef.current = true;
        setShowScrollBottom(false);
      }
    }
  }, [messages, channel?.id, effectiveUserId]);

  if (!channel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#13151b]">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-neutral-800/80 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4 shadow-xs">
          <MessageSquare size={26} className="text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {t('messageArea.selectChannelTitle', 'Chọn một kênh để bắt đầu trò chuyện')}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 max-w-xs leading-relaxed">
          {t('messageArea.selectChannelSubtitle', 'Trao đổi với các thành viên trong dự án hoặc liên đội ngũ trong không gian làm việc.')}
        </p>
      </div>
    );
  }

  const isAdmin = channel.role === 'ADMIN';

  const handleCopyText = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success(t('messageArea.copiedMessage', 'Đã chép nội dung tin nhắn'));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-white dark:bg-[#13151b] relative">
      {/* 1. Fixed Top Header Bar */}
      {/* 1. Fixed Top Header Bar */}
      <div className="h-13 px-3.5 border-b border-gray-200/80 dark:border-neutral-800/80 bg-white/95 dark:bg-[#141620]/95 backdrop-blur-md flex items-center justify-between shrink-0 z-10 overflow-hidden">
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
            {channel.type === 'PRIVATE' ? (
              <Lock size={14} className="text-amber-500" />
            ) : channel.isAnnouncementOnly ? (
              <Megaphone size={14} className="text-blue-500" />
            ) : (
              <span className="text-gray-400 dark:text-gray-400 font-bold text-sm">#</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {/* Title row with badge inline */}
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                {channel.name}
              </h3>
              {channel.projectName ? (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 inline-flex items-center gap-1 shrink-0 max-w-[130px] truncate">
                  <FolderKanban size={10} className="shrink-0" />
                  <span className="truncate">{channel.projectName}</span>
                </span>
              ) : (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 inline-flex items-center gap-1 shrink-0">
                  <Globe size={10} className="shrink-0" />
                  <span>{t('messageArea.workspaceBadge', 'Không gian làm việc')}</span>
                </span>
              )}
              {channel.isAnnouncementOnly && (
                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                  {t('messageArea.announcementBadge', 'Thông báo')}
                </span>
              )}
            </div>
            {/* Description row */}
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-sm sm:max-w-md leading-tight">
              {channel.description || t('messageArea.memberCount', { count: channel.memberCount, defaultValue: `${channel.memberCount} thành viên` })}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800/80 text-xs text-gray-600 dark:text-gray-300 font-medium mr-0.5">
            <Users size={12} />
            <span className="text-[11px]">{channel.memberCount}</span>
          </div>

          {onOpenAddMemberModal && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onOpenAddMemberModal}
              title={t('messageArea.addMember', 'Thêm thành viên')}
              className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md"
            >
              <UserPlus size={14} />
            </Button>
          )}

          {onOpenInviteModal && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onOpenInviteModal}
              title={t('sidebar.qrAndInvite', 'Mã QR & Link mời tham gia')}
              className="h-7 w-7 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md"
            >
              <QrCode size={14} />
            </Button>
          )}

          {isAdmin && onOpenJoinRequestsModal && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onOpenJoinRequestsModal}
              title={t('sidebar.joinRequests', 'Yêu cầu tham gia chờ duyệt')}
              className="h-7 w-7 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md relative"
            >
              <UserCheck size={14} />
              {pendingRequestsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1 ring-2 ring-white dark:ring-neutral-900" />
              )}
            </Button>
          )}

          {onOpenSettingsModal && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onOpenSettingsModal}
              title={t('sidebar.settings', 'Cài đặt kênh & thành viên')}
              className="h-7 w-7 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md"
            >
              <Settings size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* 2. Messages Stream */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-2 bg-white dark:bg-[#13151b] overscroll-contain"
      >
        {/* Compact Welcome Channel Banner */}
        <div className="p-3 border border-gray-200/70 dark:border-neutral-800/70 bg-gray-50/70 dark:bg-[#161924]/60 rounded-xl mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              {channel.type === 'PRIVATE' ? (
                <Lock size={14} />
              ) : channel.isAnnouncementOnly ? (
                <Megaphone size={14} />
              ) : (
                <span className="text-sm font-bold">#</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {t('messageArea.welcomeTitle', { channelName: channel.name, defaultValue: `Chào mừng bạn đến với kênh #${channel.name}!` })}
                </h4>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium border border-emerald-200/60 dark:border-transparent">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  {t('messageArea.memberCount', { count: channel.memberCount, defaultValue: `${channel.memberCount} thành viên` })}
                </span>
                {channel.requiresApproval && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 text-[10px] font-medium">
                    <ShieldCheck size={10} /> {t('messageArea.approvalBadge', 'Xét duyệt')}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug line-clamp-1">
                {channel.description || t('messageArea.defaultDescription', 'Bắt đầu cuộc trò chuyện trong kênh này. Chia sẻ ý kiến, tệp đính kèm và trao đổi công việc cùng các thành viên.')}
              </p>
            </div>
          </div>
        </div>

        {/* Messages List */}
        {messages.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-xs font-medium">
            {t('messageArea.noMessages', 'Chưa có tin nhắn nào trong kênh này. Hãy gửi tin nhắn đầu tiên!')}
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === effectiveUserId;
            const canRecall = !msg.isDeleted && (isMe || isAdmin);

            let parsedAttachments: ChatAttachment[] = [];
            if (msg.attachments) {
              try {
                parsedAttachments =
                  typeof msg.attachments === 'string'
                    ? JSON.parse(msg.attachments)
                    : msg.attachments;
              } catch (e) {
                parsedAttachments = [];
              }
            }

            return (
              <div
                key={msg.id}
                className={`group flex items-start gap-2.5 p-1.5 sm:p-2 rounded-xl transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02] relative ${
                  msg.isDeleted ? 'opacity-60' : ''
                }`}
              >
                <Avatar className="w-8 h-8 mt-0.5 shrink-0 border border-gray-200 dark:border-neutral-800">
                  <AvatarImage src={msg.senderAvatar || undefined} />
                  <AvatarFallback className="text-xs font-semibold uppercase bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                    {msg.senderName ? msg.senderName.substring(0, 2) : 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-400 font-medium">
                      {dayjs(msg.createdAt).format('HH:mm - DD/MM')}
                    </span>
                  </div>

                  {/* Message Content & Action Buttons */}
                  {msg.isDeleted ? (
                    <div className="inline-flex items-center gap-1.5 text-[11px] italic text-gray-400 dark:text-gray-500 mt-1 py-0.5 px-2.5 select-none bg-gray-50/80 dark:bg-neutral-800/40 rounded-lg border border-dashed border-gray-200 dark:border-neutral-800">
                      <RotateCcw size={11} className="opacity-70 shrink-0 text-amber-500/80" />
                      <span>{t('messageArea.messageRecalled', 'Tin nhắn đã được thu hồi')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-0.5 max-w-full flex-wrap">
                      {msg.content && (
                        <div
                          className={`inline-block px-3 py-1.5 rounded-2xl text-xs whitespace-pre-wrap break-all [overflow-wrap:anywhere] leading-relaxed font-normal max-w-[320px] sm:max-w-[400px] md:max-w-[440px] shadow-2xs border ${
                            isMe
                              ? 'bg-blue-50/90 text-gray-900 dark:bg-[#192238] dark:text-gray-100 border-blue-200/70 dark:border-blue-900/50'
                              : 'bg-gray-100/90 text-gray-900 dark:bg-[#181b26] dark:text-gray-100 border-gray-200/70 dark:border-neutral-800/80'
                          }`}
                        >
                          {msg.content}
                        </div>
                      )}

                      {/* Action Buttons on Hover - colocated right beside the bubble */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-white/95 dark:bg-[#1a1d28]/95 backdrop-blur-md border border-gray-200 dark:border-neutral-700/80 p-0.5 rounded-lg shadow-2xs shrink-0">
                        {msg.content && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyText(msg.content)}
                            title={t('messageArea.copyMessage', 'Sao chép tin nhắn')}
                            className="h-6 w-6 p-0 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded"
                          >
                            <Copy size={11} />
                          </Button>
                        )}
                        {canRecall && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setRecallingMessageId(msg.id)}
                            title={t('messageArea.recallMessage', 'Thu hồi tin nhắn')}
                            className="h-6 px-1.5 gap-1 text-[10px] font-medium text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded transition-colors"
                          >
                            <RotateCcw size={10} />
                            <span>{t('messageArea.recallMessage', 'Thu hồi')}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Attachments (Files & Images) */}
                  {!msg.isDeleted && parsedAttachments.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-2 max-w-[320px] sm:max-w-[400px] md:max-w-[440px]">
                      {parsedAttachments.map((file, fileIdx) => {
                        const isImage = file.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.filename);

                        if (isImage) {
                          return (
                            <div
                              key={fileIdx}
                              className="relative group/img overflow-hidden rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#1b1e28] shadow-xs max-w-[280px]"
                            >
                              <img
                                src={file.url}
                                alt={file.filename}
                                className="max-h-[200px] w-auto object-cover rounded-xl hover:opacity-95 transition-opacity"
                              />
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                download={file.filename}
                                className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20 text-white opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-black/80"
                                title={t('messageArea.downloadImage', 'Tải ảnh về')}
                              >
                                <Download size={13} />
                              </a>
                            </div>
                          );
                        }

                        return (
                          <a
                            key={fileIdx}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            download={file.filename}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#1b1e28] hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors max-w-xs shadow-xs"
                          >
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center justify-center shrink-0">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                {file.filename}
                              </p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-400">
                                {(file.size / 1024).toFixed(0)} KB
                              </p>
                            </div>
                            <Download size={14} className="text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white shrink-0" />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-[#1e2230]/95 backdrop-blur-md border border-gray-200/90 dark:border-neutral-700 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all cursor-pointer animate-in fade-in zoom-in-90"
        >
          <ChevronDown size={14} className="text-blue-600 dark:text-blue-400 animate-bounce" />
          <span>{t('messageArea.scrollToBottom', 'Cuộn xuống')}</span>
        </button>
      )}

      {/* Recall Message Confirmation Modal */}
      <Dialog
        open={!!recallingMessageId}
        onOpenChange={(open) => {
          if (!open && !isRecalling) setRecallingMessageId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              <RotateCcw className="w-4 h-4 text-amber-500 shrink-0" />
              {t('messageArea.recallConfirmTitle', 'Thu hồi tin nhắn')}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 pt-1">
              {t('messageArea.recallConfirmDesc', 'Bạn có chắc chắn muốn thu hồi tin nhắn này không? Tin nhắn sẽ được thu hồi đối với tất cả thành viên trong kênh.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isRecalling}
              onClick={() => setRecallingMessageId(null)}
              className="text-xs"
            >
              {t('messageArea.cancel', 'Huỷ bỏ')}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isRecalling}
              onClick={handleConfirmRecall}
              className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white border-0"
            >
              {isRecalling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              {t('messageArea.confirmRecall', 'Thu hồi tin nhắn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
