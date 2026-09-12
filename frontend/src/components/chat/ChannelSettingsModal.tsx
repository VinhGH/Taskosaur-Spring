import React, { useState } from 'react';
import { ChannelResponse, ChannelMember, EligibleMember } from '@/types/chat';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Settings,
  Megaphone,
  ShieldCheck,
  VolumeX,
  Volume2,
  UserMinus,
  Ban,
  Users,
  Save,
  UserPlus,
  Crown,
  Link as LinkIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import AddChannelMemberModal from './AddChannelMemberModal';

interface ChannelSettingsModalProps {
  channel: ChannelResponse | null;
  members: ChannelMember[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateChannel: (
    channelId: string,
    payload: {
      name?: string;
      description?: string;
      isAnnouncementOnly?: boolean;
      requiresApproval?: boolean;
    }
  ) => Promise<any>;
  onMuteMember: (userId: string, isMuted: boolean) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onBlockUser: (userId: string, reason?: string) => Promise<void>;
  onGetEligibleMembers?: (channelId: string) => Promise<EligibleMember[]>;
  onAddMembers?: (channelId: string, userIds: string[]) => Promise<void>;
  currentUserId?: string;
}

export default function ChannelSettingsModal({
  channel,
  members,
  isOpen,
  onClose,
  onUpdateChannel,
  onMuteMember,
  onRemoveMember,
  onBlockUser,
  onGetEligibleMembers,
  onAddMembers,
  currentUserId,
}: ChannelSettingsModalProps) {
  const { t } = useTranslation('chat');
  const [activeTab, setActiveTab] = useState<'general' | 'members'>('general');
  const [name, setName] = useState(channel?.name || '');
  const [description, setDescription] = useState(channel?.description || '');
  const [isAnnouncementOnly, setIsAnnouncementOnly] = useState(
    channel?.isAnnouncementOnly || false
  );
  const [requiresApproval, setRequiresApproval] = useState(
    channel?.requiresApproval || false
  );
  const [saving, setSaving] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  if (!channel) return null;

  const isAdmin = channel.role === 'ADMIN';

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error(t('settingsModal.adminOnlyError', { defaultValue: 'Chỉ Quản trị viên mới có quyền đổi cài đặt kênh' }));
      return;
    }
    setSaving(true);
    try {
      await onUpdateChannel(channel.id, {
        name,
        description,
        isAnnouncementOnly,
        requiresApproval,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0 bg-white dark:bg-[#181a22] text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50">
        <DialogHeader className="p-5 pb-3 border-b border-gray-200 dark:border-neutral-800 bg-gray-50/80 dark:bg-neutral-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Settings size={18} />
            </div>
            <DialogTitle className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
              {t('settingsModal.title', { channelName: channel.name, defaultValue: `Cài đặt Kênh #${channel.name}` })}
            </DialogTitle>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-3 pt-1">
            <Button
              type="button"
              size="sm"
              variant={activeTab === 'general' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('general')}
              className={`text-xs h-7 px-3 gap-1.5 rounded-lg ${
                activeTab === 'general'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white'
              }`}
            >
              <Settings size={13} />
              {t('settingsModal.tabGeneral', { defaultValue: 'Cài đặt chung' })}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === 'members' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('members')}
              className={`text-xs h-7 px-3 gap-1.5 rounded-lg ${
                activeTab === 'members'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white'
              }`}
            >
              <Users size={13} />
              {t('settingsModal.tabMembers', { count: members.length, defaultValue: `Thành viên (${members.length})` })}
            </Button>
          </div>
        </DialogHeader>

        {activeTab === 'general' ? (
          <form onSubmit={handleSaveGeneral} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                {t('settingsModal.channelNameLabel', { defaultValue: 'Tên kênh' })}
              </label>
              <Input
                disabled={!isAdmin}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ten-kenh"
                className="text-xs font-mono bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white rounded-lg focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                {t('settingsModal.channelDescLabel', { defaultValue: 'Mô tả kênh' })}
              </label>
              <Textarea
                disabled={!isAdmin}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('settingsModal.channelDescPlaceholder', { defaultValue: 'Mục đích và chủ đề trao đổi của kênh...' })}
                rows={2}
                className="text-xs bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg focus:border-indigo-500"
              />
            </div>

            {/* Announcement Mode */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/40">
              <div className="space-y-0.5 pr-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 dark:text-white">
                  <Megaphone size={14} className="text-indigo-600 dark:text-indigo-400" />
                  {t('settingsModal.announcementToggle', { defaultValue: 'Kênh Thông báo (Chỉ Quản trị viên được nhắn tin)' })}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {t('settingsModal.announcementToggleDesc', { defaultValue: 'Chỉ Admin mới có thể gửi tin nhắn và tệp. Thành viên khác chỉ có quyền đọc và tải file.' })}
                </p>
              </div>
              <Switch
                disabled={!isAdmin}
                checked={isAnnouncementOnly}
                onCheckedChange={setIsAnnouncementOnly}
              />
            </div>

            {/* Approval Mode */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/40">
              <div className="space-y-0.5 pr-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 dark:text-white">
                  <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-500" />
                  {t('settingsModal.approvalToggle', { defaultValue: 'Xét duyệt thành viên khi tham gia' })}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {t('settingsModal.approvalToggleDesc', { defaultValue: 'Bắt buộc Quản trị viên duyệt yêu cầu trước khi người dùng qua link mời/mã QR được vào nhóm.' })}
                </p>
              </div>
              <Switch
                disabled={!isAdmin}
                checked={requiresApproval}
                onCheckedChange={setRequiresApproval}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-neutral-800">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white rounded-lg">
                {t('settingsModal.cancel', { defaultValue: 'Hủy' })}
              </Button>
              {isAdmin && (
                <Button type="submit" size="sm" disabled={saving} className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 rounded-lg shadow-sm">
                  <Save size={14} />
                  {saving ? t('settingsModal.saving', { defaultValue: 'Đang lưu...' }) : t('settingsModal.saveChanges', { defaultValue: 'Lưu thay đổi' })}
                </Button>
              )}
            </div>
          </form>
        ) : (
          <div className="flex flex-col">
            {/* Members Header Bar with Add Button */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/30">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <Users size={14} className="text-blue-500" />
                <span>{t('settingsModal.membersList', { count: members.length, defaultValue: `Danh sách thành viên (${members.length})` })}</span>
              </div>
              {onAddMembers && onGetEligibleMembers && (
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddMemberOpen(true)}
                  className="h-7 gap-1.5 text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg"
                >
                  <UserPlus size={12} />
                  {t('settingsModal.addMember', { defaultValue: 'Thêm thành viên' })}
                </Button>
              )}
            </div>

            <div className="p-5 space-y-2.5 max-h-[380px] overflow-y-auto">
              {members.map((m) => {
                const isSelf = m.userId === currentUserId;
                const isTargetAdmin = m.role === 'ADMIN';

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:bg-gray-50 dark:hover:bg-neutral-900/80 transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="w-8 h-8 border border-gray-200 dark:border-neutral-800">
                        <AvatarImage src={m.avatar || undefined} />
                        <AvatarFallback className="text-xs font-semibold uppercase bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                          {m.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                            {m.name}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 px-1.5 py-0.2 rounded font-medium">
                              {t('settingsModal.you', { defaultValue: 'Bạn' })}
                            </span>
                          )}
                          {isTargetAdmin && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 px-1.5 py-0.2 rounded font-medium border border-amber-200 dark:border-amber-500/20">
                              {t('settingsModal.admin', { defaultValue: 'Admin' })}
                            </span>
                          )}
                          {m.isMuted && (
                            <span className="text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 px-1.5 py-0.2 rounded font-medium border border-rose-200 dark:border-rose-500/20 flex items-center gap-0.5">
                              <VolumeX size={10} /> {t('settingsModal.muted', { defaultValue: 'Đã bị hạn chế' })}
                            </span>
                          )}
                        </div>

                        {/* Provenance: Who added this member */}
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{m.email}</p>
                          <span className="text-gray-300 dark:text-neutral-700 text-[10px]">•</span>
                          {m.addedByName ? (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 truncate">
                              <UserPlus size={10} className="shrink-0" />
                              {t('settingsModal.addedBy', { name: m.addedByName, defaultValue: `Được thêm bởi ${m.addedByName}` })}
                            </span>
                          ) : m.userId === channel.createdById ? (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                              <Crown size={10} className="shrink-0" />
                              {t('settingsModal.creator', { defaultValue: 'Người tạo kênh' })}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                              <LinkIcon size={10} className="shrink-0" />
                              {t('settingsModal.joinedViaLink', { defaultValue: 'Tham gia qua liên kết' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions for other members */}
                    {!isSelf && (
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {/* Mute/Unmute button (Admin only) */}
                        {isAdmin && !isTargetAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onMuteMember(m.userId, !m.isMuted)}
                            title={m.isMuted ? t('settingsModal.unmute', { defaultValue: 'Gỡ hạn chế nhắn tin' }) : t('settingsModal.mute', { defaultValue: 'Hạn chế nhắn tin (Mute)' })}
                            className={`h-7 w-7 p-0 ${m.isMuted ? 'text-amber-500 hover:bg-amber-500/10' : 'text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'}`}
                          >
                            {m.isMuted ? <Volume2 size={13} /> : <VolumeX size={13} />}
                          </Button>
                        )}

                        {/* Remove from channel (Admin only) */}
                        {isAdmin && !isTargetAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(t('settingsModal.removeConfirm', { name: m.name, defaultValue: `Mời ${m.name} rời khỏi kênh?` }))) {
                                onRemoveMember(m.userId);
                              }
                            }}
                            title={t('settingsModal.removeMember', { defaultValue: 'Mời rời khỏi kênh' })}
                            className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                          >
                            <UserMinus size={13} />
                          </Button>
                        )}

                        {/* Block user 1-1 */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(t('settingsModal.blockConfirm', { name: m.name, defaultValue: `Chặn người dùng ${m.name}? Bạn sẽ không nhận tin nhắn trực tiếp từ họ.` }))) {
                              onBlockUser(m.userId);
                            }
                          }}
                          title={t('settingsModal.blockUser', { defaultValue: 'Chặn người dùng này' })}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 dark:text-gray-400 dark:hover:text-rose-400"
                        >
                          <Ban size={13} />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>

      {/* Add Member Sub-Modal */}
      {onAddMembers && onGetEligibleMembers && (
        <AddChannelMemberModal
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
          channelName={channel.name}
          channelId={channel.id}
          onGetEligibleMembers={onGetEligibleMembers}
          onAddMembers={onAddMembers}
        />
      )}
    </Dialog>
  );
}
