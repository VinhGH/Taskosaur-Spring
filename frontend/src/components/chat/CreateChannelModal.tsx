import React, { useState } from 'react';
import { ChannelType } from '@/types/chat';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Hash, Lock, Megaphone, Plus, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChannel: (payload: {
    name: string;
    description?: string;
    type?: ChannelType;
    isAnnouncementOnly?: boolean;
    requiresApproval?: boolean;
    projectId?: string;
  }) => Promise<any>;
  projectId?: string;
  projectName?: string;
}

export default function CreateChannelModal({
  isOpen,
  onClose,
  onCreateChannel,
  projectId,
  projectName,
}: CreateChannelModalProps) {
  const { t } = useTranslation('chat');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ChannelType>('PUBLIC');
  const [isAnnouncementOnly, setIsAnnouncementOnly] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await onCreateChannel({
        name: name.trim().toLowerCase().replaceAll(/\s+/g, '-'),
        description: description.trim() || undefined,
        type,
        isAnnouncementOnly,
        requiresApproval,
        projectId,
      });
      setName('');
      setDescription('');
      setType('PUBLIC');
      setIsAnnouncementOnly(false);
      setRequiresApproval(false);
      onClose();
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6 bg-white dark:bg-[#181a22] text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-2xl z-50">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Plus size={18} />
            </div>
            <DialogTitle className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
              {projectName
                ? t('createModal.titleProject', { projectName, defaultValue: `Tạo Kênh Dự Án (${projectName})` })
                : projectId
                ? t('createModal.titleProjectNew', 'Tạo Kênh Dự Án Mới')
                : t('createModal.titleWorkspaceNew', 'Tạo Kênh Không Gian Làm Việc Mới')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            {projectName || projectId
              ? t('createModal.descProject', { projectName: projectName ? `"${projectName}"` : '', defaultValue: `Kênh trao đổi riêng dành cho các thành viên trong dự án ${projectName ? `"${projectName}"` : 'này'}.` })
              : t('createModal.descWorkspace', 'Kênh là nơi các thành viên trao đổi công việc theo từng chủ đề hoặc không gian làm việc.')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-200">
              {t('createModal.channelNameLabel', 'Tên kênh')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-mono text-xs">
                #
              </span>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('createModal.channelNamePlaceholder', 'ke-hoach-quy-3')}
                className="pl-7 font-mono text-xs bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-200">
              {t('createModal.descriptionLabel', 'Mô tả (tùy chọn)')}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('createModal.descriptionPlaceholder', 'Chủ đề trao đổi chính của kênh này...')}
              rows={2}
              className="text-xs bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>

          {/* Channel Type Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-200">
              {t('createModal.channelTypeLabel', 'Loại kênh')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('PUBLIC')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  type === 'PUBLIC'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 dark:border-indigo-500/60 dark:bg-indigo-500/20 dark:text-white ring-1 ring-indigo-500/30'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-gray-400 dark:hover:border-neutral-700 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium text-xs text-gray-900 dark:text-white">
                  <Hash size={14} className="text-indigo-600 dark:text-indigo-400" /> {t('createModal.public', 'Công khai (Public)')}
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  {projectId
                    ? t('createModal.publicDescProject', 'Mọi người trong dự án đều có thể xem và tham gia.')
                    : t('createModal.publicDescWorkspace', 'Mọi người trong workspace đều có thể xem và tham gia.')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setType('PRIVATE')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  type === 'PRIVATE'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-500/60 dark:bg-amber-500/20 dark:text-white ring-1 ring-amber-500/30'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-gray-400 dark:hover:border-neutral-700 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium text-xs text-gray-900 dark:text-white">
                  <Lock size={14} className="text-amber-600 dark:text-amber-500" /> {t('createModal.private', 'Riêng tư (Private)')}
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  {t('createModal.privateDesc', 'Chỉ những người được mời hoặc có link mới được vào.')}
                </span>
              </button>
            </div>
          </div>

          {/* Admin-only Announcement Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/60">
            <div className="space-y-0.5 pr-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 dark:text-white">
                <Megaphone size={14} className="text-indigo-600 dark:text-indigo-400" />
                {t('createModal.announcementOnly', 'Kênh Thông báo (Chỉ Admin nhắn)')}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {t('createModal.announcementOnlyDesc', 'Thành viên chỉ đọc, không được gửi tin nhắn.')}
              </p>
            </div>
            <Switch checked={isAnnouncementOnly} onCheckedChange={setIsAnnouncementOnly} />
          </div>

          {/* Require Approval Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/60">
            <div className="space-y-0.5 pr-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 dark:text-white">
                <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-500" />
                {t('createModal.approvalRequired', 'Xét duyệt khi tham gia qua Link/QR')}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {t('createModal.approvalRequiredDesc', 'Người xin vào cần được Admin duyệt trước.')}
              </p>
            </div>
            <Switch checked={requiresApproval} onCheckedChange={setRequiresApproval} />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-neutral-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 px-4 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-neutral-800 rounded-lg"
            >
              {t('createModal.cancel', 'Hủy')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !name.trim()}
              className="h-9 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-medium"
            >
              {submitting ? t('createModal.creating', 'Đang tạo...') : t('createModal.create', 'Tạo kênh')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
