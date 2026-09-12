import React, { useState } from 'react';
import { ChannelResponse, ChatHubResponse } from '@/types/chat';
import { Button } from '@/components/ui/button';
import {
  Hash,
  Lock,
  Megaphone,
  Plus,
  QrCode,
  Settings,
  UserCheck,
  Search,
  Globe,
  FolderKanban,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChatChannelSidebarProps {
  channels: ChannelResponse[];
  chatHub?: ChatHubResponse | null;
  activeChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  onOpenCreateChannel: (targetProjectId?: string, targetProjectName?: string) => void;
  onOpenInviteModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenJoinRequestsModal: () => void;
  pendingRequestsCount?: number;
  projectId?: string;
}

export default function ChatChannelSidebar({
  channels,
  chatHub,
  activeChannelId,
  onSelectChannel,
  onOpenCreateChannel,
  onOpenInviteModal,
  onOpenSettingsModal,
  onOpenJoinRequestsModal,
  pendingRequestsCount = 0,
  projectId,
}: ChatChannelSidebarProps) {
  const { t } = useTranslation('chat');
  const [search, setSearch] = useState('');
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const isAdminOfActive = activeChannel?.role === 'ADMIN';

  const renderChannelItem = (c: ChannelResponse) => {
    const isActive = c.id === activeChannelId;
    const isPrivate = c.type === 'PRIVATE';

    return (
      <button
        key={c.id}
        onClick={() => onSelectChannel(c.id)}
        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] transition-all ${
          isActive
            ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 font-semibold border-l-2 border-blue-600 dark:border-blue-400 shadow-xs'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800/50 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate min-w-0">
          {c.isAnnouncementOnly ? (
            <Megaphone size={12} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-blue-500/70'} />
          ) : isPrivate ? (
            <Lock size={12} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-amber-500/90'} />
          ) : (
            <Hash size={13} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-400'} />
          )}
          <span className="truncate font-medium">{c.name}</span>
        </div>
        {c.unreadCount > 0 && (
          <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-blue-600 text-white min-w-[16px] text-center shrink-0">
            {c.unreadCount}
          </span>
        )}
      </button>
    );
  };

  // Hub Mode: partition into Workspace channels and Projects
  const isHubMode = Boolean(chatHub);
  const hubWorkspaceChannels = (chatHub?.workspaceChannels || []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const hubProjectGroups = chatHub?.projectGroups || [];

  // Non-Hub Mode: filter regular and announcement channels
  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const announcementChannels = filteredChannels.filter((c) => c.isAnnouncementOnly);
  const regularChannels = filteredChannels.filter((c) => !c.isAnnouncementOnly);

  return (
    <div className="w-48 sm:w-52 border-r border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#14161f] flex flex-col h-full select-none shrink-0">
      {/* Sidebar Header */}
      <div className="p-2.5 px-3 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="min-w-0 pr-1">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
            {isHubMode
              ? (chatHub?.workspaceName || t('title.chatHub', 'Trung Tâm Trò Chuyện'))
              : (projectId ? t('sidebar.projectChannels', 'Kênh Dự Án') : t('sidebar.workspaceChannels', 'Kênh Không Gian'))}
          </h2>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
            {t('sidebar.activeChannels', { count: channels.length, defaultValue: `${channels.length} kênh hoạt động` })}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onOpenCreateChannel()}
          title={isHubMode ? t('sidebar.createWorkspaceChannel', 'Tạo kênh không gian mới') : (projectId ? t('sidebar.createProjectChannel', 'Tạo kênh dự án mới') : t('sidebar.createWorkspaceChannel', 'Tạo kênh không gian mới'))}
          className="h-6 w-6 p-0 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-neutral-800/60 shrink-0"
        >
          <Plus size={14} />
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-2 px-2.5 border-b border-gray-200 dark:border-neutral-800/60">
        <div className="relative">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('sidebar.searchChannels', 'Tìm kiếm kênh...')}
            className="w-full pl-6 pr-2 py-1 text-[11px] bg-gray-50 dark:bg-[#1a1d28] rounded-md border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/40 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors shadow-xs"
          />
        </div>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-2.5">
        {isHubMode ? (
          <>
            {/* Section 1: Workspace Channels */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between px-1.5 py-0.5">
                <span className="text-[9.5px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase flex items-center gap-1">
                  <Globe size={11} />
                  {t('sidebar.workspace', 'Không gian làm việc')}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenCreateChannel()}
                  title={t('sidebar.createWorkspaceChannel', 'Tạo kênh không gian làm việc')}
                  className="h-5 w-5 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                >
                  <Plus size={12} />
                </button>
              </div>
              {hubWorkspaceChannels.length === 0 ? (
                <div className="px-2 py-1 text-[10px] text-gray-400 dark:text-gray-500 italic">
                  {t('sidebar.noWorkspaceChannels', 'Chưa có kênh không gian')}
                </div>
              ) : (
                hubWorkspaceChannels.map(renderChannelItem)
              )}
            </div>

            {/* Section 2: Projects Section */}
            <div className="space-y-1.5 pt-1.5 border-t border-gray-100 dark:border-neutral-800/60">
              <div className="px-1.5 py-0.5 text-[9.5px] font-bold tracking-wider text-purple-600 dark:text-purple-400 uppercase flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <FolderKanban size={11} />
                  {t('sidebar.projects', { count: hubProjectGroups.length, defaultValue: `Các dự án (${hubProjectGroups.length})` })}
                </span>
              </div>

              {hubProjectGroups.length === 0 ? (
                <div className="px-2 py-1 text-[10px] text-gray-400 dark:text-gray-500 italic">
                  {t('sidebar.noProjects', 'Chưa có dự án nào')}
                </div>
              ) : (
                hubProjectGroups.map((group) => {
                  const matchingChannels = (group.channels || []).filter((c) =>
                    c.name.toLowerCase().includes(search.toLowerCase())
                  );
                  const matchesProjectName = group.projectName.toLowerCase().includes(search.toLowerCase());
                  const displayedChannels = search
                    ? (matchesProjectName ? group.channels : matchingChannels)
                    : (group.channels || []);

                  if (search && displayedChannels.length === 0 && !matchesProjectName) {
                    return null;
                  }

                  const isCollapsed = Boolean(collapsedProjects[group.projectId]);
                  const effectiveCollapsed = search ? false : isCollapsed;

                  return (
                    <div key={group.projectId} className="space-y-0.5">
                      {/* Project Header */}
                      <div className="flex items-center justify-between px-1.5 py-1 rounded-md hover:bg-gray-100/70 dark:hover:bg-neutral-800/50 group transition-colors">
                        <button
                          type="button"
                          onClick={() =>
                            setCollapsedProjects((prev) => ({
                              ...prev,
                              [group.projectId]: !isCollapsed,
                            }))
                          }
                          className="flex items-center gap-1 min-w-0 text-left flex-1"
                        >
                          {effectiveCollapsed ? (
                            <ChevronRight size={11} className="text-gray-400 shrink-0" />
                          ) : (
                            <ChevronDown size={11} className="text-gray-400 shrink-0" />
                          )}
                          <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 truncate" title={group.projectName}>
                            {group.projectName}
                          </span>
                          <span className="text-[9.5px] text-gray-400 shrink-0">
                            ({group.channels?.length || 0})
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenCreateChannel(group.projectId, group.projectName)}
                          title={t('sidebar.createProjectChannelFor', { projectName: group.projectName, defaultValue: `Tạo kênh mới cho ${group.projectName}` })}
                          className="h-5 w-5 flex items-center justify-center rounded text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors shrink-0"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Project Channels */}
                      {!effectiveCollapsed && (
                        <div className="pl-1 space-y-0.5">
                          {displayedChannels.length === 0 ? (
                            <div className="px-2 py-1 text-[10px] text-gray-400 dark:text-gray-500 italic flex items-center justify-between">
                              <span>{t('sidebar.noChannels', 'Chưa có kênh')}</span>
                              <button
                                type="button"
                                onClick={() => onOpenCreateChannel(group.projectId, group.projectName)}
                                className="text-[9.5px] text-purple-600 dark:text-purple-400 hover:underline font-medium"
                              >
                                + {t('sidebar.createChannel', 'Tạo kênh')}
                              </button>
                            </div>
                          ) : (
                            displayedChannels.map(renderChannelItem)
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <>
            {/* Non-Hub Mode: Announcement Channels */}
            {announcementChannels.length > 0 && (
              <div className="space-y-0.5">
                <div className="px-1.5 py-0.5 text-[9.5px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase flex items-center gap-1">
                  <Megaphone size={11} /> {t('sidebar.announcementChannels', 'Kênh Thông Báo')}
                </div>
                {announcementChannels.map(renderChannelItem)}
              </div>
            )}

            {/* Non-Hub Mode: Regular Channels */}
            <div className="space-y-0.5">
              <div className="px-1.5 py-0.5 text-[9.5px] font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase">
                {t('sidebar.channelsList', 'Danh sách Kênh')}
              </div>
              {regularChannels.length === 0 && announcementChannels.length === 0 ? (
                <div className="px-2 py-4 text-center text-[11px] text-gray-400 dark:text-gray-500">
                  {t('sidebar.noChannels', 'Chưa có kênh nào')}
                </div>
              ) : (
                regularChannels.map(renderChannelItem)
              )}
            </div>
          </>
        )}
      </div>

      {/* Active Channel Quick Toolbar at Bottom */}
      {activeChannel && (
        <div className="p-1.5 border-t border-gray-200 dark:border-neutral-800 bg-gray-50/90 dark:bg-[#161822] flex items-center justify-around text-[10.5px]">
          <Button
            size="sm"
            variant="ghost"
            onClick={onOpenInviteModal}
            title={t('sidebar.qrAndInvite', 'Mã QR & Link mời tham gia')}
            className="h-7 gap-1 px-1.5 text-[10.5px] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-neutral-800/60 rounded-md"
          >
            <QrCode size={12} />
            {t('sidebar.qr', 'QR')}
          </Button>

          {isAdminOfActive && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onOpenJoinRequestsModal}
              title={t('sidebar.joinRequests', 'Yêu cầu tham gia chờ duyệt')}
              className="h-7 gap-1 px-1.5 text-[10.5px] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-neutral-800/60 rounded-md relative"
            >
              <UserCheck size={12} />
              {t('sidebar.review', 'Duyệt')}
              {pendingRequestsCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-1 right-1 ring-2 ring-white dark:ring-background" />
              )}
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={onOpenSettingsModal}
            title={t('sidebar.settings', 'Cài đặt kênh & thành viên')}
            className="h-7 gap-1 px-1.5 text-[10.5px] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-neutral-800/60 rounded-md"
          >
            <Settings size={12} />
            {t('sidebar.settings', 'Cài đặt')}
          </Button>
        </div>
      )}
    </div>
  );
}
