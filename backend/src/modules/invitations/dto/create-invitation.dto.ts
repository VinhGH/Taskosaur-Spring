// src/modules/invitations/dto/create-invitation.dto.ts
import { IsEmail, IsString, IsOptional, IsUUID, IsArray } from 'class-validator';

export class CreateInvitationDto {
  @IsEmail()
  inviteeEmail: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  projectIds?: string[];

  @IsString()
  role: string;
}
