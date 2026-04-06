import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorator/roles.decorator';
import { Role, UserStatus, User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { SettingsService } from '../settings/settings.service';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get system dashboard stats' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  getUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('status') status?: UserStatus,
    @Query('role') role?: Role,
  ) {
    return this.adminService.getUsers(Number(page), Number(limit), search, status, role);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user detail' })
  getUserDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change user role' })
  updateUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user: User,
  ) {
    return this.adminService.updateUserRole(id, dto.role, user.id);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Change user status (activate/deactivate)' })
  updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.adminService.updateUserStatus(id, dto.status, user.id);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user' })
  deleteUser(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.adminService.deleteUser(id, user.id);
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: 'Generate a password reset link for a user' })
  resetUserPassword(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.resetUserPassword(id);
  }

  @Get('organizations')
  @ApiOperation({ summary: 'List all organizations (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false })
  getOrganizations(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.adminService.getOrganizations(Number(page), Number(limit), search);
  }

  @Get('organizations/:id')
  @ApiOperation({ summary: 'Get organization detail' })
  getOrganizationDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getOrganizationDetail(id);
  }

  @Delete('organizations/:id')
  @ApiOperation({ summary: 'Delete an organization' })
  deleteOrganization(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteOrganization(id);
  }

  @Patch('organizations/:id/archive')
  @ApiOperation({ summary: 'Suspend or activate an organization (toggle archive)' })
  toggleOrganizationArchive(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.toggleOrganizationArchive(id);
  }

  @Patch('organizations/:id/transfer-ownership')
  @ApiOperation({ summary: 'Transfer organization ownership to another user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { newOwnerId: { type: 'string', format: 'uuid' } },
      required: ['newOwnerId'],
    },
  })
  transferOrganizationOwnership(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('newOwnerId', ParseUUIDPipe) newOwnerId: string,
  ) {
    return this.adminService.transferOrganizationOwnership(id, newOwnerId);
  }

  // ─── System Configuration ──────────────────────────────────────────

  @Get('config')
  @ApiOperation({ summary: 'Get all system configuration with env source info' })
  @ApiQuery({ name: 'category', required: false })
  async getSystemConfig(@Query('category') category?: string) {
    const [globalSettings, smtpSources] = await Promise.all([
      this.settingsService.getGlobalSettings(category),
      this.adminService.getSmtpConfigWithSource(),
    ]);
    return { settings: globalSettings, smtpSources };
  }

  @Post('config')
  @ApiOperation({ summary: 'Save system configuration settings' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        settings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              value: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              isEncrypted: { type: 'boolean' },
            },
            required: ['key', 'value'],
          },
        },
      },
    },
  })
  async saveSystemConfig(
    @Body()
    body: {
      settings: Array<{
        key: string;
        value: string;
        description?: string;
        category?: string;
        isEncrypted?: boolean;
      }>;
    },
  ) {
    for (const setting of body.settings) {
      // Skip saving masked password values to avoid overwriting real secrets
      if (setting.isEncrypted && setting.value === '••••••••') {
        continue;
      }
      await this.settingsService.set(
        setting.key,
        setting.value,
        undefined, // no userId = global setting
        setting.description,
        setting.category,
        setting.isEncrypted,
      );
    }
    return { success: true };
  }

  @Post('config/test-smtp')
  @ApiOperation({ summary: 'Test SMTP connection and authentication' })
  async testSmtp() {
    return this.adminService.testSmtpConfig();
  }
}
