import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UpdateProjectMemberDto {
  @ApiProperty({
    description: 'New role to assign',
    enum: Role,
    required: false,
    example: Role.MEMBER,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
