import React from "react";
import { useUserStatus } from "@/hooks/useUserStatus";
import { formatLastSeen } from "@/hooks/useUserStatus";
export interface UserStatusIndicatorProps {
  userId: string;
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * UserStatusIndicator Component
 *
 * Displays an icon indicating whether a user is online or offline.
 *
 * Features:
 * - Green check circle for online users
 * - Gray minus circle for offline users
 * - Tooltip with last seen time
 * - Multiple size options
 *
 * @example
 * ```tsx
 * <UserStatusIndicator userId="user-uuid" showTooltip />
 * ```
 */
export const UserStatusIndicator: React.FC<UserStatusIndicatorProps> = ({
  userId,
  showTooltip = true,
  size = "md",
  className = "",
}) => {
  const { isOnline, lastSeen, loading } = useUserStatus(userId);

  const dotSizes = {
    sm: { dot: "w-2 h-2", ping: "w-2 h-2", container: "w-4 h-4" },
    md: { dot: "w-2.5 h-2.5", ping: "w-2.5 h-2.5", container: "w-5 h-5" },
    lg: { dot: "w-3 h-3", ping: "w-3 h-3", container: "w-6 h-6" },
  };

  const s = dotSizes[size];

  if (loading) {
    return (
      <span
        className={`${s.dot} rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse ${className}`}
        aria-label="Loading status"
      />
    );
  }

  const indicator = isOnline ? (
    <span className={`relative inline-flex items-center justify-center ${s.container} ${className}`}>
      <span className={`animate-ping absolute ${s.ping} rounded-full bg-green-400 opacity-50`} />
      <span className={`relative ${s.dot} rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]`} />
    </span>
  ) : (
    <span className={`relative inline-flex items-center justify-center ${s.container} ${className}`}>
      <span className={`${s.dot} rounded-full border-2 border-gray-400 dark:border-gray-500 bg-transparent`} />
    </span>
  );

  if (showTooltip) {
    return (
      <div className="relative group inline-flex items-center">
        {indicator}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
          {isOnline ? "Online" : formatLastSeen(lastSeen)}
        </div>
      </div>
    );
  }

  return indicator;
};

/**
 * UserStatusBadge Component
 * 
 * Displays a badge with text indicating user's online status.
 * 
 * @example
 * ```tsx
 * <UserStatusBadge userId="user-uuid" />
 * ```
 */
export const UserStatusBadge: React.FC<{ userId: string; className?: string }> = ({
  userId,
  className = "",
}) => {
  const { isOnline, lastSeen, loading } = useUserStatus(userId);

  if (loading) {
    return (
      <span className="text-xs text-gray-500 animate-pulse">Loading...</span>
    );
  }

  return (
    <span

    >
      {isOnline ? "Online" : formatLastSeen(lastSeen)}
    </span>
  );
};

/**
 * UserAvatarWithStatus Component
 *
 * Combines user avatar with online status indicator icon.
 *
 * @example
 * ```tsx
 * <UserAvatarWithStatus
 *   userId="user-uuid"
 *   avatarUrl="https://..."
 *   userName="John Doe"
 * />
 * ```
 */
export const UserAvatarWithStatus: React.FC<{
  userId: string;
  avatarUrl?: string | null;
  userName?: string;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  className?: string;
}> = ({
  userId,
  avatarUrl,
  userName,
  size = "md",
  showStatus = true,
  className = "",
}) => {
  const { isOnline } = useUserStatus(userId);

  const avatarSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const statusSizes = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
  };

  const statusPosition = {
    sm: "-bottom-0.5 -right-0.5",
    md: "-bottom-0.5 -right-0.5",
    lg: "-bottom-1 -right-1",
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <img
        src={avatarUrl || "/default-avatar.png"}
        alt={userName || "User"}
        className={`${avatarSizes[size]} rounded-full object-cover`}
      />
      {showStatus && (
        <span
          className={`absolute ${statusPosition[size]} ${statusSizes[size]
              } ${isOnline ? "bg-green-500" : "bg-gray-400"
          } rounded-full ring-2 ${isOnline ? "ring-green-300 dark:ring-green-700" : "ring-gray-300 dark:ring-gray-600"
          }`}
          aria-label={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  );
};
