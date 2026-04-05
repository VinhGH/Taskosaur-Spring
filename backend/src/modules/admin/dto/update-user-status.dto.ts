import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus, description: 'New status for the user' })
  @IsEnum(UserStatus)
  status: UserStatus;
}
