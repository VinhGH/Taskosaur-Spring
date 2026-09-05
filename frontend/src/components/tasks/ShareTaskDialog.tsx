import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { shareApi, ShareResponse } from '@/utils/api/shareApi';
import {
  HiGlobeAlt,
  HiLink,
  HiClipboard,
  HiTrash,
  HiCheck,
  HiClock,
  HiArrowTopRightOnSquare,
  HiShieldCheck,
  HiPlus,
  HiArrowPath,
} from 'react-icons/hi2';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ShareTaskDialogProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareTaskDialog({ taskId, isOpen, onClose }: ShareTaskDialogProps) {
  const { t } = useTranslation('tasks');
  const [expiryDays, setExpiryDays] = useState('7');
  const [shares, setShares] = useState<ShareResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadShares();
    }
  }, [isOpen, taskId]);

  const loadShares = async () => {
    setLoading(true);
    try {
      const data = await shareApi.getSharesForTask(taskId);
      setShares(data);
    } catch (error) {
      toast.error(t('share.toastError', 'Không thể tải danh sách liên kết'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShare = async () => {
    setCreating(true);
    try {
      const newShare = await shareApi.createShare({
        taskId,
        expiresInDays: parseInt(expiryDays, 10),
      });
      setShares([newShare, ...shares]);
      toast.success(t('share.toastCreated', 'Đã tạo liên kết chia sẻ công khai'));
      copyToClipboard(newShare.shareUrl, newShare.id);
    } catch (error) {
      toast.error(t('share.toastError', 'Tạo liên kết thất bại'));
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    setRevokingId(shareId);
    try {
      await shareApi.revokeShare(shareId);
      setShares(shares.filter((s) => s.id !== shareId));
      toast.success(t('share.toastRevoked', 'Đã thu hồi liên kết'));
    } catch (error) {
      toast.error(t('share.toastError', 'Thu hồi liên kết thất bại'));
    } finally {
      setRevokingId(null);
    }
  };

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success(t('share.toastCopied', 'Đã sao chép liên kết vào bộ nhớ tạm'));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatExpiryDate = (dateString: string) => {
    try {
      const d = dayjs(dateString);
      if (d.isValid()) {
        return d.format('DD/MM/YYYY HH:mm');
      }
    } catch (e) {}
    return dateString;
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-[540px] p-0 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        {/* Header with Visual Icon & Badges */}
        <div className="relative p-6 pb-4 border-b border-[var(--border)]/60 bg-gradient-to-b from-[var(--primary)]/5 to-transparent">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm flex-shrink-0">
                <HiGlobeAlt className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight text-[var(--foreground)] flex items-center gap-2">
                  <span>{t('share.title', 'Chia sẻ công việc lên Web')}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {t('share.badgePublic', 'Công khai')}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {t(
                    'share.description',
                    'Tạo liên kết công khai để bất kỳ ai có đường dẫn đều có thể xem công việc này.'
                  )}
                </DialogDescription>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Creation Section Box */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="expiry"
                className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5"
              >
                <HiClock className="w-3.5 h-3.5 text-blue-500" />
                <span>{t('share.expiresIn', 'Thời hạn liên kết')}</span>
              </Label>
              <span className="text-[11px] text-[var(--muted-foreground)] font-medium">
                {t('share.readOnlyNotice', 'Chế độ chỉ xem • Không cần đăng nhập')}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <Select value={expiryDays} onValueChange={setExpiryDays}>
                <SelectTrigger
                  id="expiry"
                  className="sm:w-[200px] h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                >
                  <SelectValue placeholder="Chọn thời hạn" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-50">
                  <SelectItem value="1">{t('share.days1', '1 ngày')}</SelectItem>
                  <SelectItem value="3">{t('share.days3', '3 ngày')}</SelectItem>
                  <SelectItem value="7">{t('share.days7', '7 ngày (Khuyên dùng)')}</SelectItem>
                  <SelectItem value="14">{t('share.days14', '14 ngày')}</SelectItem>
                  <SelectItem value="30">{t('share.days30', '30 ngày')}</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleCreateShare}
                disabled={creating}
                className="flex-1 h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {creating ? (
                  <>
                    <HiArrowPath className="w-4 h-4 animate-spin" />
                    <span>{t('share.creating', 'Đang tạo...')}</span>
                  </>
                ) : (
                  <>
                    <HiPlus className="w-4 h-4 stroke-2" />
                    <span>{t('share.createButton', 'Tạo liên kết mới')}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Active Links Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-2">
                <span>{t('share.activeLinks', 'Liên kết đang hoạt động')}</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {shares.length}
                </span>
              </h4>
              {loading && (
                <HiArrowPath className="w-3.5 h-3.5 animate-spin text-[var(--muted-foreground)]" />
              )}
            </div>

            {shares.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)]/10 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--muted)]/40 border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] mb-3">
                  <HiGlobeAlt className="w-6 h-6 opacity-60" />
                </div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {t('share.noLinksTitle', 'Chưa có liên kết chia sẻ nào')}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] max-w-xs mt-1">
                  {t(
                    'share.noLinksDescription',
                    'Tạo liên kết ở trên để chia sẻ nhanh tiến độ công việc với khách hàng hoặc đối tác bên ngoài.'
                  )}
                </p>
              </div>
            ) : (
              <div className="max-h-[250px] overflow-y-auto pr-1 space-y-3">
                {shares.map((share) => {
                  const expired = isExpired(share.expiresAt);
                  const isRevoking = revokingId === share.id;

                  return (
                    <div
                      key={share.id}
                      className={cn(
                        'flex flex-col gap-2.5 rounded-2xl border p-3.5 shadow-xs transition-all',
                        expired
                          ? 'border-red-500/20 bg-red-500/5'
                          : 'border-[var(--border)] bg-[var(--card)] hover:border-blue-500/30 hover:shadow-md'
                      )}
                    >
                      {/* Status & Expiry Bar */}
                      <div className="flex items-center justify-between min-w-0">
                        <div className="flex items-center gap-2">
                          {expired ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              {t('share.statusExpired', 'Đã hết hạn')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {t('share.statusActive', 'Đang hoạt động')}
                            </span>
                          )}

                          <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                            <HiClock className="w-3.5 h-3.5 opacity-60" />
                            <span>
                              {t('share.expiresAt', 'Hết hạn')}: {formatExpiryDate(share.expiresAt)}
                            </span>
                          </span>
                        </div>

                        {/* Revoke Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isRevoking}
                          className="h-7 w-7 rounded-lg text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          onClick={() => handleRevokeShare(share.id)}
                          title={t('share.revokeTitle', 'Thu hồi liên kết này')}
                        >
                          {isRevoking ? (
                            <HiArrowPath className="w-3.5 h-3.5 animate-spin text-red-500" />
                          ) : (
                            <HiTrash className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>

                      {/* URL Box & Actions */}
                      <div className="flex items-center gap-2 rounded-xl bg-[var(--muted)]/40 border border-[var(--border)] p-1.5 pl-2.5 hover:border-[var(--border)] transition-colors">
                        <HiLink className="h-4 w-4 flex-shrink-0 text-blue-500" />
                        <input
                          type="text"
                          readOnly
                          value={share.shareUrl}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          className="flex-1 min-w-0 text-xs font-mono text-[var(--foreground)] bg-transparent border-none outline-none select-all truncate"
                        />

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Copy Link Button */}
                          <button
                            type="button"
                            onClick={() => copyToClipboard(share.shareUrl, share.id)}
                            className={cn(
                              'h-8 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer',
                              copiedId === share.id
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-[var(--card)] hover:bg-[var(--hover-bg)] text-[var(--foreground)] border border-[var(--border)] shadow-xs'
                            )}
                          >
                            {copiedId === share.id ? (
                              <>
                                <HiCheck className="w-3.5 h-3.5 text-white" />
                                <span>{t('share.copied', 'Đã chép!')}</span>
                              </>
                            ) : (
                              <>
                                <HiClipboard className="w-3.5 h-3.5 text-blue-500" />
                                <span>{t('share.copyLink', 'Sao chép')}</span>
                              </>
                            )}
                          </button>

                          {/* Open in new tab */}
                          <a
                            href={share.shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:text-blue-500 hover:bg-blue-500/10 transition-colors border border-[var(--border)] bg-[var(--card)]"
                            title={t('share.openLink', 'Mở trong tab mới')}
                          >
                            <HiArrowTopRightOnSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[var(--border)]/60 bg-[var(--muted)]/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <HiShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span className="hidden sm:inline">
              {t('share.footerNote', 'Bảo mật: Chỉ người có đường dẫn chính xác mới xem được công việc này.')}
            </span>
            <span className="sm:hidden">
              {t('share.readOnlyNotice', 'Chế độ chỉ xem')}
            </span>
          </div>

          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl px-5 h-9 text-xs font-semibold border-[var(--border)] hover:bg-[var(--accent)] text-[var(--foreground)] cursor-pointer"
          >
            {t('share.done', 'Đóng')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
