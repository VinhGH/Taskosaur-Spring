import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventsGateway } from '../../../gateway/events.gateway';
import { PrismaService } from '../../../prisma/prisma.service';

export interface UserStatusInfo {
  isOnline: boolean;
  lastSeen?: string;
  socketCount?: number;
}

/**
 * Service to manage user online status
 * Integrates with EventsGateway to track WebSocket connections
 */
@Injectable()
export class UserStatusService implements OnModuleInit {
  private readonly logger = new Logger(UserStatusService.name);
  private eventsGateway: EventsGateway;
  private userLastSeen = new Map<string, string>(); // userId -> ISO timestamp

  constructor(
    private prisma: PrismaService,
    eventsGateway: EventsGateway,
  ) {
    this.eventsGateway = eventsGateway;
  }

  onModuleInit() {
    this.logger.log('UserStatusService initialized with EventsGateway');
  }

  /**
   * Check if a user is currently online
   */
  isUserOnline(userId: string): boolean {
    if (!this.eventsGateway) {
      this.logger.warn('EventsGateway not initialized');
      return false;
    }
    return this.eventsGateway.isUserOnline(userId);
  }

  /**
   * Get detailed status information for a user
   */
  async getUserStatus(userId: string): Promise<UserStatusInfo> {
    const isOnline = this.isUserOnline(userId);
    let lastSeen = this.eventsGateway.getUserLastSeen(userId);

    // If no WebSocket lastSeen, fall back to user's lastLoginAt from database
    if (!lastSeen) {
      // Validate UUID format before querying database
      const uuidRegex =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (uuidRegex.test(userId)) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { lastLoginAt: true },
        });
        lastSeen = user?.lastLoginAt?.toISOString() || new Date().toISOString();
      } else {
        // For invalid UUIDs, return current timestamp
        lastSeen = new Date().toISOString();
      }
    }

    return {
      isOnline,
      lastSeen,
    };
  }

  /**
   * Get status for multiple users at once
   */
  async getUsersStatus(userIds: string[]): Promise<Map<string, UserStatusInfo>> {
    const statusMap = new Map<string, UserStatusInfo>();

    for (const userId of userIds) {
      statusMap.set(userId, await this.getUserStatus(userId));
    }

    return statusMap;
  }

  /**
   * Update last seen timestamp for a user
   */
  updateLastSeen(userId: string): void {
    const timestamp = new Date().toISOString();
    this.userLastSeen.set(userId, timestamp);
    this.logger.debug(`User ${userId} last seen: ${timestamp}`);
  }

  /**
   * Get all online users
   */
  getOnlineUsers(): string[] {
    if (!this.eventsGateway) {
      return [];
    }
    // This would require a new method in EventsGateway to get all connected user IDs
    return [];
  }

  /**
   * Get online users in a specific room (project, workspace, etc.)
   */
  getOnlineUsersInRoom(room: string): string[] {
    if (!this.eventsGateway) {
      return [];
    }
    return this.eventsGateway.getOnlineUsersInRoom(room);
  }

  /**
   * Clean up old lastSeen entries (older than 24 hours)
   */
  cleanupOldEntries(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [userId, timestamp] of this.userLastSeen.entries()) {
      const entryTime = new Date(timestamp).getTime();
      if (now - entryTime > maxAge) {
        this.userLastSeen.delete(userId);
        this.logger.debug(`Cleaned up old lastSeen for user ${userId}`);
      }
    }
  }
}
