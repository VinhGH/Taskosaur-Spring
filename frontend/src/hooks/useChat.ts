import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { socketService } from '@/lib/socket';
import {
  ChannelResponse,
  ChannelMessage,
  ChannelMember,
  ChannelJoinRequest,
  UserBlock,
  ChannelType,
  EligibleMember,
  ChatHubResponse,
} from '@/types/chat';
import { toast } from 'sonner';

interface UseChatOptions {
  workspaceId?: string;
  projectId?: string;
  isHub?: boolean;
}

export function useChat({ workspaceId, projectId, isHub = false }: UseChatOptions) {
  const [channels, setChannels] = useState<ChannelResponse[]>([]);
  const [chatHub, setChatHub] = useState<ChatHubResponse | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<ChannelJoinRequest[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<UserBlock[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const activeChannel = channels.find((c) => c.id === activeChannelId) || null;
  const activeChannelRef = useRef<string | null>(null);
  activeChannelRef.current = activeChannelId;
  const channelsRef = useRef<ChannelResponse[]>(channels);
  channelsRef.current = channels;

  // 1. Fetch channels list
  const loadChannels = useCallback(async () => {
    if (!workspaceId && !projectId) return;
    setLoadingChannels(true);
    try {
      let data: ChannelResponse[] = [];

      if (isHub && workspaceId) {
        const res = await api.get(`/chat/channels/workspace/${workspaceId}/hub`);
        const hubData: ChatHubResponse = res.data;
        setChatHub(hubData);
        const wsChannels = hubData.workspaceChannels || [];
        const prjChannels = (hubData.projectGroups || []).flatMap((g) => g.channels || []);
        data = [...wsChannels, ...prjChannels];
      } else {
        setChatHub(null);
        let endpoint = '';
        if (projectId) {
          endpoint = `/chat/channels/project/${projectId}`;
        } else if (workspaceId) {
          endpoint = `/chat/channels/workspace/${workspaceId}`;
        }
        const res = await api.get(endpoint);
        data = res.data || [];
      }

      setChannels(data);

      // Default to first channel if none selected or if current active is not in data
      if (data.length > 0) {
        if (!activeChannelRef.current || !data.some((c) => c.id === activeChannelRef.current)) {
          setActiveChannelId(data[0].id);
        }
      } else {
        setActiveChannelId(null);
      }
    } catch (err: any) {
      console.error('Failed to load channels:', err);
    } finally {
      setLoadingChannels(false);
    }
  }, [workspaceId, projectId, isHub]);

  // 2. Fetch messages for active channel
  const loadMessages = useCallback(async (channelId: string) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/chat/channels/${channelId}/messages?size=50`);
      setMessages(res.data || []);

      // Mark as read
      api.post(`/chat/channels/${channelId}/messages/read`).catch(() => {});

      // Clear unread badge in local state
      setChannels((prev) =>
        prev.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err: any) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // 3. Fetch channel members
  const loadMembers = useCallback(async (channelId: string) => {
    try {
      const res = await api.get(`/chat/channels/${channelId}/members`);
      setMembers(res.data || []);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  }, []);

  // 4. Fetch pending join requests (Admin only)
  const loadJoinRequests = useCallback(async (channelId: string) => {
    try {
      const res = await api.get(`/chat/channels/${channelId}/join-requests`);
      setJoinRequests(res.data || []);
    } catch (err) {
      // Non-admins will get 403, which is normal
      setJoinRequests([]);
    }
  }, []);

  // 5. Fetch blocked users
  const loadBlockedUsers = useCallback(async () => {
    try {
      const res = await api.get('/chat/blocks');
      setBlockedUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load blocked users:', err);
    }
  }, []);

  // Load channels on mount / context change
  useEffect(() => {
    loadChannels();
    loadBlockedUsers();
  }, [loadChannels, loadBlockedUsers]);

  // Load messages & members when active channel changes
  useEffect(() => {
    if (!activeChannelId) return;

    loadMessages(activeChannelId);
    loadMembers(activeChannelId);

    // Join WebSocket channel room
    socketService.joinRoom('channel', activeChannelId);

    // If user is admin of this channel, also load join requests
    const ch = channelsRef.current.find((c) => c.id === activeChannelId);
    if (ch?.role === 'ADMIN') {
      loadJoinRequests(activeChannelId);
    }

    return () => {
      socketService.leaveRoom('channel', activeChannelId);
    };
  }, [activeChannelId, loadMessages, loadMembers, loadJoinRequests]);

  // Real-time WebSocket Listeners
  useEffect(() => {
    const handleMessageSent = (msg: ChannelMessage) => {
      if (msg.channelId === activeChannelRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Mark as read immediately if window is focused
        if (typeof document !== 'undefined' && !document.hidden) {
          api.post(`/chat/channels/${msg.channelId}/messages/read`).catch(() => {});
        }
      }

      // Update channels list lastMessage and unread count
      setChannels((prev) =>
        prev.map((c) => {
          if (c.id === msg.channelId) {
            const isCurrent = c.id === activeChannelRef.current;
            return {
              ...c,
              lastMessage: msg,
              unreadCount: isCurrent ? 0 : c.unreadCount + 1,
            };
          }
          return c;
        })
      );
    };

    const handleMessageDeleted = (data: { messageId: string; channelId: string }) => {
      if (data.channelId === activeChannelRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId
              ? { ...m, isDeleted: true, content: 'Tin nhắn đã được thu hồi', attachments: null }
              : m
          )
        );
      }
    };

    const handleMemberMuted = (data: { channelId: string; userId: string; isMuted: boolean }) => {
      if (data.channelId === activeChannelRef.current) {
        setMembers((prev) =>
          prev.map((m) => (m.userId === data.userId ? { ...m, isMuted: data.isMuted } : m))
        );
        // Also update in channels list if it's the current user
        setChannels((prev) =>
          prev.map((c) => (c.id === data.channelId ? { ...c, isMuted: data.isMuted } : c))
        );
      }
    };

    const handleJoinRequest = (req: ChannelJoinRequest) => {
      if (req.channelId === activeChannelRef.current) {
        setJoinRequests((prev) => [req, ...prev]);
        toast.info(`Yêu cầu tham gia mới từ ${req.userName}`);
      }
    };

    const handleMemberAdded = (data: { channelId: string; addedBy: string; addedUserNames: string[] }) => {
      if (data.channelId === activeChannelRef.current) {
        loadMembers(data.channelId);
        toast.info(`${data.addedBy} đã thêm ${data.addedUserNames.join(', ')} vào kênh`);
      }
    };

    socketService.on('chat:message_sent', handleMessageSent);
    socketService.on('chat:message_deleted', handleMessageDeleted);
    socketService.on('chat:member_muted', handleMemberMuted);
    socketService.on('chat:join_request', handleJoinRequest);
    socketService.on('chat:member_added', handleMemberAdded);

    return () => {
      socketService.off('chat:message_sent', handleMessageSent);
      socketService.off('chat:message_deleted', handleMessageDeleted);
      socketService.off('chat:member_muted', handleMemberMuted);
      socketService.off('chat:join_request', handleJoinRequest);
      socketService.off('chat:member_added', handleMemberAdded);
    };
  }, [loadMembers]);

  // Send Message
  const sendMessage = async (content: string, attachments?: string | null, replyToId?: string) => {
    if (!activeChannelId) return;
    setSendingMessage(true);
    try {
      await api.post(`/chat/channels/${activeChannelId}/messages`, {
        content,
        attachments: attachments || null,
        replyToId: replyToId || null,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể gửi tin nhắn';
      toast.error(msg);
      throw err;
    } finally {
      setSendingMessage(false);
    }
  };

  // Delete / Recall Message
  const deleteMessage = async (messageId: string) => {
    if (!activeChannelId) return;
    try {
      await api.delete(`/chat/channels/${activeChannelId}/messages/${messageId}`);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, isDeleted: true, content: 'Tin nhắn đã được thu hồi', attachments: null }
            : m
        )
      );
      toast.success('Đã thu hồi tin nhắn');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể thu hồi tin nhắn');
      throw err;
    }
  };

  // Create Channel
  const createChannel = async (payload: {
    name: string;
    description?: string;
    type?: ChannelType;
    isAnnouncementOnly?: boolean;
    requiresApproval?: boolean;
    projectId?: string;
  }) => {
    if (!workspaceId) throw new Error('Workspace ID is required');
    try {
      const res = await api.post('/chat/channels', {
        ...payload,
        workspaceId,
        projectId: payload.projectId || (isHub ? null : projectId) || null,
      });
      const newChannel: ChannelResponse = res.data;
      setChannels((prev) => [newChannel, ...prev]);
      setActiveChannelId(newChannel.id);
      if (isHub) {
        loadChannels();
      }
      toast.success(`Đã tạo kênh #${newChannel.name}`);
      return newChannel;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể tạo kênh');
      throw err;
    }
  };

  // Update Channel Settings
  const updateChannel = async (
    channelId: string,
    payload: {
      name?: string;
      description?: string;
      isAnnouncementOnly?: boolean;
      requiresApproval?: boolean;
    }
  ) => {
    try {
      const res = await api.put(`/chat/channels/${channelId}`, payload);
      const updated: ChannelResponse = res.data;
      setChannels((prev) => prev.map((c) => (c.id === channelId ? { ...c, ...updated } : c)));
      toast.success('Đã cập nhật cài đặt kênh');
      return updated;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể cập nhật kênh');
      throw err;
    }
  };

  // Reset Invite Code
  const resetInviteCode = async (channelId: string) => {
    try {
      const res = await api.post(`/chat/channels/${channelId}/reset-invite`);
      const { inviteCode } = res.data;
      setChannels((prev) => prev.map((c) => (c.id === channelId ? { ...c, inviteCode } : c)));
      toast.success('Đã tạo lại mã mời mới!');
      return inviteCode;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể đổi mã mời');
    }
  };

  // Mute / Unmute member
  const muteMember = async (targetUserId: string, isMuted: boolean) => {
    if (!activeChannelId) return;
    try {
      await api.post(
        `/chat/channels/${activeChannelId}/members/${targetUserId}/mute?isMuted=${isMuted}`
      );
      setMembers((prev) =>
        prev.map((m) => (m.userId === targetUserId ? { ...m, isMuted } : m))
      );
      toast.success(isMuted ? 'Đã hạn chế thành viên' : 'Đã gỡ hạn chế');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể thay đổi quyền thành viên');
    }
  };

  // Remove member
  const removeMember = async (targetUserId: string) => {
    if (!activeChannelId) return;
    try {
      await api.delete(`/chat/channels/${activeChannelId}/members/${targetUserId}`);
      setMembers((prev) => prev.filter((m) => m.userId !== targetUserId));
      toast.success('Đã mời thành viên rời khỏi kênh');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể xoá thành viên');
    }
  };

  // Review Join Request (Approve / Reject)
  const reviewJoinRequest = async (requestId: string, approve: boolean) => {
    if (!activeChannelId) return;
    try {
      await api.post(`/chat/channels/join-requests/${requestId}/review?approve=${approve}`);
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (approve) {
        loadMembers(activeChannelId);
        toast.success('Đã phê duyệt thành viên vào nhóm');
      } else {
        toast.info('Đã từ chối yêu cầu tham gia');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể xử lý yêu cầu');
    }
  };

  // Join by invite code
  const joinByCode = async (inviteCode: string, message?: string) => {
    try {
      const res = await api.post(`/chat/channels/join-by-code/${inviteCode}`, { message });
      const { status, channel } = res.data;
      if (status === 'JOINED_SUCCESSFULLY') {
        toast.success(`Đã tham gia kênh #${channel.name}`);
        setChannels((prev) => [channel, ...prev]);
        setActiveChannelId(channel.id);
      } else if (status === 'REQUEST_SUBMITTED') {
        toast.info('Yêu cầu tham gia đã được gửi tới quản trị viên xét duyệt');
      } else if (status === 'REQUEST_ALREADY_PENDING') {
        toast.warning('Bạn đã gửi yêu cầu, vui lòng chờ duyệt');
      }
      return res.data;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Mã mời không hợp lệ');
      throw err;
    }
  };

  // Block User
  const blockUser = async (blockedId: string, reason?: string) => {
    try {
      await api.post('/chat/blocks', { blockedId, reason });
      toast.success('Đã chặn người dùng này');
      loadBlockedUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể chặn người dùng');
    }
  };

  // Unblock User
  const unblockUser = async (blockedId: string) => {
    try {
      await api.delete(`/chat/blocks/${blockedId}`);
      toast.success('Đã bỏ chặn người dùng');
      setBlockedUsers((prev) => prev.filter((b) => b.blockedId !== blockedId));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể bỏ chặn');
    }
  };

  // Upload file attachment
  const uploadAttachment = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/uploads/upload/chat', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return {
      url: `/api/uploads/${res.data.url}`,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
      key: res.data.key,
    };
  };

  // Get Eligible Members from Workspace / Project
  const getEligibleMembers = useCallback(async (channelId: string): Promise<EligibleMember[]> => {
    try {
      const res = await api.get(`/chat/channels/${channelId}/eligible-members`);
      return res.data || [];
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể tải danh sách thành viên có thể mời');
      return [];
    }
  }, []);

  // Add Members to Channel
  const addMembersToChannel = async (channelId: string, userIds: string[]) => {
    try {
      const res = await api.post(`/chat/channels/${channelId}/members`, { userIds });
      setMembers(res.data || []);
      toast.success('Đã thêm thành viên vào kênh!');
      return res.data;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể thêm thành viên');
      throw err;
    }
  };

  return {
    channels,
    chatHub,
    activeChannel,
    activeChannelId,
    setActiveChannelId,
    messages,
    members,
    joinRequests,
    blockedUsers,
    loadingChannels,
    loadingMessages,
    sendingMessage,
    sendMessage,
    deleteMessage,
    createChannel,
    updateChannel,
    resetInviteCode,
    muteMember,
    removeMember,
    reviewJoinRequest,
    joinByCode,
    blockUser,
    unblockUser,
    uploadAttachment,
    getEligibleMembers,
    addMembersToChannel,
    refreshChannels: loadChannels,
    refreshMembers: () => activeChannelId && loadMembers(activeChannelId),
    refreshMessages: () => activeChannelId && loadMessages(activeChannelId),
  };
}
