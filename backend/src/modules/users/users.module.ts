import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { UserStatusService } from './services/user-status.service';
import { GatewayModule } from '../../gateway/gateway.module';
import { S3Module } from '../storage/s3.module';

@Module({
  imports: [PrismaModule, GatewayModule, S3Module],
  controllers: [UsersController],
  providers: [UsersService, UserStatusService],
  exports: [UsersService, UserStatusService],
})
export class UsersModule {}
