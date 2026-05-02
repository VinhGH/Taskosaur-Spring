import { IsString, IsOptional, IsEnum, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum GroupByField {
  STATUS = 'status',
  PRIORITY = 'priority',
  PROJECT = 'project',
  ASSIGNEE = 'assignee',
  TYPE = 'type',
  DUE_DATE = 'dueDate',
  CREATED_AT = 'createdAt',
}

export class GetGroupedTasksDto {
  @ApiProperty({
    description: 'Organization ID (required)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  organizationId: string;

  @ApiProperty({
    description: 'Field to group tasks by',
    enum: GroupByField,
    example: GroupByField.STATUS,
  })
  @IsEnum(GroupByField)
  groupBy: GroupByField;

  @ApiPropertyOptional({ description: 'Filter by workspace IDs (comma-separated)' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'Filter by project IDs (comma-separated)' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Filter by sprint ID' })
  @IsOptional()
  @IsString()
  sprintId?: string;

  @ApiPropertyOptional({ description: 'Filter by priorities (comma-separated)' })
  @IsOptional()
  @IsString()
  priorities?: string;

  @ApiPropertyOptional({ description: 'Filter by status IDs (comma-separated)' })
  @IsOptional()
  @IsString()
  statuses?: string;

  @ApiPropertyOptional({ description: 'Filter by task types (comma-separated)' })
  @IsOptional()
  @IsString()
  types?: string;

  @ApiPropertyOptional({ description: 'Filter by assignee user IDs (comma-separated)' })
  @IsOptional()
  @IsString()
  assigneeIds?: string;

  @ApiPropertyOptional({ description: 'Filter by reporter user IDs (comma-separated)' })
  @IsOptional()
  @IsString()
  reporterIds?: string;

  @ApiPropertyOptional({ description: 'Full-text search query' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Number of tasks per group per page', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limitPerGroup?: number = 20;

  /**
   * Load-more mode: when provided, only tasks for this specific group are returned
   * (using offset-based pagination with `page`).
   */
  @ApiPropertyOptional({
    description:
      "Group key for load-more mode. When set, only this group's tasks are returned " +
      'using the `page` parameter for offset pagination.',
    example: 'no-status',
  })
  @IsOptional()
  @IsString()
  groupKey?: string;

  @ApiPropertyOptional({
    description: 'Page number for load-more within a specific group (1-based, default 1)',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
}
