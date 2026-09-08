import React, { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/auth-context';
import ChatChannelSidebar from './ChatChannelSidebar';
import ChatMessageArea from './ChatMessageArea';
import ChatMessageInput from './ChatMessageInput';
import CreateChannelModal from './CreateChannelModal';
import ChannelInviteModal from './ChannelInviteModal';
import JoinRequestsModal from './JoinRequestsModal';
import ChannelSettingsModal from './ChannelSettingsModal';
import AddChannelMemberModal from './AddChannelMemberModal';

interface ChatLayoutProps {
  workspaceId?: string;
  projectId?: string;
  isHubMode?: boolean;
  className?: string;
}

export default function ChatLayout({
  workspaceId,
  projectId,
  isHubMode = false,
  className = '',
}: ChatLayoutProps) {
  const { getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();

  const {
    channels,
    chatHub,
    activeChannel,
    activeChannelId,
    setActiveChannelId,
    messages,
    members,
    joinRequests,
    loadingMessages,
    sendMessage,
    deleteMessage,
    createChannel,
    updateChannel,
    resetInviteCode,
    muteMember,
    removeMember,
    reviewJoinRequest,
    blockUser,
    uploadAttachment,
    getEligibleMembers,
    addMembersToChannel,
  } = useChat({ workspaceId, projectId, isHub: isHubMode });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTarget, setCreateTarget] = useState<{
    projectId?: string;
    projectName?: string;
  } | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isJoinRequestsOpen, setIsJoinRequestsOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const handleOpenCreateChannel = (targetProjectId?: string, targetProjectName?: string) => {
    setCreateTarget(
      targetProjectId
        ? { projectId: targetProjectId, projectName: targetProjectName }
        : null
    );
    setIsCreateOpen(true);
  };

  return (
    <div className={`flex h-full w-full bg-white dark:bg-[#13151b] border border-gray-200/80 dark:border-neutral-800/80 rounded-2xl overflow-hidden shadow-sm ${className}`}>
      {/* 1. Channels Sidebar */}
      <ChatChannelSidebar
        channels={channels}
        chatHub={chatHub}
        activeChannelId={activeChannelId}
        onSelectChannel={setActiveChannelId}
        onOpenCreateChannel={handleOpenCreateChannel}
        onOpenInviteModal={() => setIsInviteOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onOpenJoinRequestsModal={() => setIsJoinRequestsOpen(true)}
        pendingRequestsCount={joinRequests.length}
        projectId={projectId}
      />

      {/* 2. Chat Center (Message Stream + Input) */}
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden bg-white dark:bg-[#13151b]">
        <ChatMessageArea
          channel={activeChannel}
          messages={messages}
          currentUserId={currentUser?.id}
          onDeleteMessage={deleteMessage}
          loading={loadingMessages}
          onOpenInviteModal={() => setIsInviteOpen(true)}
          onOpenAddMemberModal={() => setIsAddMemberOpen(true)}
          onOpenSettingsModal={() => setIsSettingsOpen(true)}
          onOpenJoinRequestsModal={() => setIsJoinRequestsOpen(true)}
          pendingRequestsCount={joinRequests.length}
        />

        <ChatMessageInput
          channel={activeChannel}
          onSendMessage={sendMessage}
          onUploadAttachment={uploadAttachment}
        />
      </div>

      {/* Modals */}
      <CreateChannelModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setCreateTarget(null);
        }}
        onCreateChannel={createChannel}
        projectId={createTarget?.projectId || projectId}
        projectName={createTarget?.projectName}
      />

      <ChannelInviteModal
        channel={activeChannel}
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onResetInviteCode={resetInviteCode}
      />

      <JoinRequestsModal
        channelName={activeChannel?.name || ''}
        isOpen={isJoinRequestsOpen}
        onClose={() => setIsJoinRequestsOpen(false)}
        requests={joinRequests}
        onReview={reviewJoinRequest}
      />

      <ChannelSettingsModal
        channel={activeChannel}
        members={members}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateChannel={updateChannel}
        onMuteMember={muteMember}
        onRemoveMember={removeMember}
        onBlockUser={blockUser}
        onGetEligibleMembers={getEligibleMembers}
        onAddMembers={addMembersToChannel}
        currentUserId={currentUser?.id}
      />

      <AddChannelMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        channelName={activeChannel?.name || ''}
        channelId={activeChannelId}
        onGetEligibleMembers={getEligibleMembers}
        onAddMembers={addMembersToChannel}
      />
    </div>
  );
}
