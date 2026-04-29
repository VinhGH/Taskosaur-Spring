import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ScopeType, ViewType } from '@prisma/client';

export class ReorderDto {
  @IsEnum(ScopeType)
  scopeType: ScopeType;

  @IsUUID()
  scopeId: string;

  @IsEnum(ViewType)
  viewType: ViewType;

  @IsOptional()
  @IsUUID()
  afterTaskId: string | null;

  @IsOptional()
  @IsUUID()
  beforeTaskId: string | null;
}
