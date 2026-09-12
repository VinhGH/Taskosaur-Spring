import React, { useState } from 'react';
import { ChannelResponse } from '@/types/chat';
import QRCodeDisplay from './QRCodeDisplay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, RotateCw, QrCode, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ChannelInviteModalProps {
  channel: ChannelResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onResetInviteCode: (channelId: string) => Promise<string | undefined>;
}

export default function ChannelInviteModal({
  channel,
  isOpen,
  onClose,
  onResetInviteCode,
}: ChannelInviteModalProps) {
  const { t } = useTranslation('chat');
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);

  if (!channel) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteUrl = `${origin}/join/${channel.inviteCode || ''}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success(t('inviteModal.copySuccess', 'Đã sao chép liên kết mời tham gia!'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = async () => {
    if (!confirm(t('inviteModal.resetConfirm', 'Bạn có chắc muốn đổi mã mời mới? Liên kết và mã QR cũ sẽ không còn hiệu lực.'))) {
      return;
    }
    setResetting(true);
    try {
      await onResetInviteCode(channel.id);
    } finally {
      setResetting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6 bg-white dark:bg-[#181a22] text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-2xl z-50">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <QrCode size={18} />
            </div>
            <DialogTitle className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
              {t('inviteModal.title', { channelName: channel.name, defaultValue: `Mời Tham Gia Kênh #${channel.name}` })}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            {t('inviteModal.description', 'Bất kỳ ai có liên kết hoặc quét mã QR dưới đây đều có thể tham gia vào kênh này.')}
          </DialogDescription>
        </DialogHeader>

        {channel.requiresApproval && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 text-xs font-medium">
            <ShieldCheck size={16} className="shrink-0 mt-0.5" />
            <span>
              {t('inviteModal.approvalNote', 'Kênh này đang bật Xét duyệt thành viên. Người quét mã/click link sẽ gửi yêu cầu và cần Quản trị viên phê duyệt trước khi vào kênh.')}
            </span>
          </div>
        )}

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center my-3 p-4 rounded-xl bg-gray-50 dark:bg-neutral-900/60 border border-gray-200 dark:border-neutral-800">
          <QRCodeDisplay value={inviteUrl} size={180} />
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
            {t('inviteModal.qrHint', 'Quét mã QR bằng camera điện thoại để tham gia nhanh')}
          </p>
        </div>

        {/* Link Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
            <LinkIcon size={14} className="text-gray-400 dark:text-gray-400" />
            {t('inviteModal.inviteUrlLabel', 'Liên kết mời (Invite URL)')}
          </label>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={inviteUrl}
              className="font-mono text-xs bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white select-all rounded-lg"
            />
            <Button
              type="button"
              size="sm"
              variant={copied ? 'default' : 'secondary'}
              onClick={handleCopy}
              className="gap-1.5 shrink-0 text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? t('inviteModal.copied', 'Đã chép') : t('inviteModal.copy', 'Sao chép')}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        {channel.role === 'ADMIN' && (
          <div className="pt-2 flex items-center justify-between border-t border-gray-200 dark:border-neutral-800 mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={resetting}
              className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white gap-1.5"
            >
              <RotateCw size={13} className={resetting ? 'animate-spin' : ''} />
              {t('inviteModal.resetCode', 'Đổi mã mời mới')}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800">
              {t('inviteModal.close', 'Đóng')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
