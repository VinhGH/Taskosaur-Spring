import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, IsUUID, IsOptional, IsBoolean, IsString } from 'class-validator';

export class BulkUpdateTasksStatusDto {
  @ApiPropertyOptional({
    description: 'Array of task IDs to update',
    example: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one task ID must be provided' })
  @IsUUID('4', { each: true, message: 'Each task ID must be a valid UUID' })
  taskIds?: string[];

  @ApiPropertyOptional({ description: 'Project ID', example: 'project-123' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Workspace ID', example: 'workspace-123' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'Organization ID', example: 'org-123' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({
    description: 'Update all tasks under the given filters',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  all?: boolean;

  @ApiPropertyOptional({
    description: 'Array of task IDs to exclude from update when "all" is true',
    example: ['550e8400-e29b-41d4-a716-446655440002'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each excluded task ID must be a valid UUID' })
  excludedIds?: string[];

  @ApiPropertyOptional({
    description: 'Status ID to update to. If not provided, will look for DONE category status.',
  })
  @IsOptional()
  @IsUUID('4')
  statusId?: string;

  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by statuses (comma separated)' })
  @IsOptional()
  @IsString()
  statuses?: string;

  @ApiPropertyOptional({ description: 'Filter by priorities (comma separated)' })
  @IsOptional()
  @IsString()
  priorities?: string;

  @ApiPropertyOptional({ description: 'Filter by types (comma separated)' })
  @IsOptional()
  @IsString()
  types?: string;

  @ApiPropertyOptional({ description: 'Filter by assignees (comma separated)' })
  @IsOptional()
  @IsString()
  assignees?: string;

  @ApiPropertyOptional({ description: 'Filter by reporters (comma separated)' })
  @IsOptional()
  @IsString()
  reporters?: string;

  @ApiPropertyOptional({ description: 'Filter by sprint ID' })
  @IsOptional()
  @IsUUID('4')
  sprintId?: string;
}
