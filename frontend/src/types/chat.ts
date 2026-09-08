export type ChannelType = 'PUBLIC' | 'PRIVATE' | 'DIRECT_MESSAGE' | 'ANNOUNCEMENT';

export type ChannelMemberRole = 'ADMIN' | 'MEMBER';

export type JoinRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ChatAttachment {
  url: string;
  filename: string;
  size: number;
  mimeType?: string;
  key?: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  senderEmail?: string | null;
  content: string;
  attachments?: string | null; // JSON string or parsed
  replyToId?: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  deletedById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelMember {
  id: string;
  channelId: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: ChannelMemberRole;
  isMuted: boolean;
  joinedAt: string;
  addedById?: string | null;
  addedByName?: string | null;
}

export interface EligibleMember {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role?: string | null;
  source: 'WORKSPACE' | 'PROJECT';
}

export interface ChannelResponse {
  id: string;
  workspaceId: string;
  projectId?: string | null;
  projectName?: string | null;
  name: string;
  description?: string | null;
  type: ChannelType;
  isAnnouncementOnly: boolean;
  requiresApproval: boolean;
  inviteCode?: string | null;
  isArchived: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;

  memberCount: number;
  unreadCount: number;
  isMember: boolean;
  role?: ChannelMemberRole | null;
  isMuted: boolean;
  lastMessage?: ChannelMessage | null;
}

export interface ProjectChatGroup {
  projectId: string;
  projectName: string;
  projectSlug: string;
  channels: ChannelResponse[];
}

export interface ChatHubResponse {
  workspaceId: string;
  workspaceName: string;
  workspaceChannels: ChannelResponse[];
  projectGroups: ProjectChatGroup[];
}

export interface ChannelJoinRequest {
  id: string;
  channelId: string;
  channelName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
  status: JoinRequestStatus;
  message?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface UserBlock {
  id: string;
  blockedId: string;
  blockedName: string;
  blockedEmail: string;
  blockedAvatar?: string | null;
  reason?: string | null;
  createdAt: string;
}
