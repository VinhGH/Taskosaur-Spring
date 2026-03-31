import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrganizationChartsService } from './organizations-charts.service';
import { AuthModule } from '../auth/auth.module';
import { AccessControlService } from 'src/common/access-control.utils';
import { UniversalSearchService } from './universal-search.service';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [PrismaModule, AuthModule, ActivityLogModule],
  controllers: [OrganizationsController],
  providers: [
    OrganizationsService,
    OrganizationChartsService,
    AccessControlService,
    UniversalSearchService,
  ],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
