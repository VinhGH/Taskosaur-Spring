import type { User } from "./users";
import type { Organization } from "./organizations";
import type { Workspace } from "./workspaces";
import type { Project } from "./projects";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
export type EntityType = "organization" | "workspace" | "project";

export interface Invitation {
  id: string;
  email: string;
  entityType: EntityType;
  entityId: string;
  role: string;
  status: InvitationStatus;
  token: string;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  inviter?: User;
  organization?: Organization;
  workspace?: Workspace;
  project?: Project;
  organizationId?: string;
  workspaceId?: string;
  projectId?: string;
}

export interface CreateInvitationData {
  inviteeEmail: string;
  organizationId?: string;
  workspaceId?: string;
  projectId?: string;
  projectIds?: string[];
  role: string;
}

export interface InvitationFilters {
  status?: InvitationStatus;
  entityType?: EntityType;
  entityId?: string;
}

export interface AcceptInvitationResponse {
  success: boolean;
  message: string;
  invitation: Invitation;
}

export interface DeclineInvitationResponse {
  success: boolean;
  message: string;
  invitation: Invitation;
}

export interface VerifyInvitationResponse {
  success: boolean;
  message: string;
  invitation: Invitation;
  isValid: boolean;
  isExpired: boolean;
  canRespond: boolean;
  inviteeExists: boolean;
}
