import { IsNotEmpty, IsEnum, IsOptional, IsUUID, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateProjectMemberDto {
  @ApiProperty({
    description: 'User ID to add to the project',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description: 'Role to assign (default: MEMBER)',
    enum: Role,
    required: false,
    example: Role.MEMBER,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}

export class InviteProjectMemberDto {
  @ApiProperty({
    description: 'Email of the user to invite',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description: 'Role to assign (default: MEMBER)',
    enum: Role,
    required: false,
    example: Role.MEMBER,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
