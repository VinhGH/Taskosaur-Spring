import Link from "next/link";
import { HiClock, HiChatBubbleLeft } from "react-icons/hi2";
import { InfoPanel } from "@/components/common/InfoPanel";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTimeForDisplay } from "@/utils/date";

export interface ActivityFeedItem {
  id: string;
  user: {
    name?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    id?: string;
  };
  action?: string;
  description: string;
  type: string;
  entityType?: string;
  entityId?: string;
  taskSlug?: string | null;
  projectSlug?: string | null;
  workspaceSlug?: string | null;
  createdAt: string | Date;
  metadata?: { comment?: string } & Record<string, unknown>;
  newValue?: {
    title?: string;
    taskId?: string;
    task?: {
      id?: string;
      [key: string]: unknown;
    };
    user?: {
      id?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      [key: string]: unknown;
    };
    member?: {
      user?: {
        id?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    entity?: {
      id?: string;
      name?: string;
      slug?: string;
      type?: string;
      [key: string]: unknown;
    };
  } & Record<string, unknown>;
}

interface ActivityFeedPanelProps {
  title: string;
  subtitle?: string;
  activities: any[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onClearFilter?: () => void;
  emptyMessage?: string;
  workspaceSlug?: string;
}

function getEntityLink(activity: ActivityFeedItem, fallbackWorkspaceSlug?: string): string {
  if (!activity.entityType) return "#";

  const entityType = activity.entityType.toLowerCase();
  const wsSlug = activity.workspaceSlug || fallbackWorkspaceSlug;

  // For task attachments, use slug-based URL if available
  if (entityType === "task attachment" || entityType === "task attchment") {
    if (wsSlug && activity.projectSlug && activity.taskSlug) {
      return `/${wsSlug}/${activity.projectSlug}/tasks/${activity.taskSlug}`;
    }
  }

  if (!activity.entityId) return "#";

  switch (entityType) {
    case "task":
      if (wsSlug && activity.projectSlug && activity.taskSlug) {
        return `/${wsSlug}/${activity.projectSlug}/tasks/${activity.taskSlug}`;
      }
      return "#";
    case "project":
      if (wsSlug && activity.projectSlug) {
        return `/${wsSlug}/${activity.projectSlug}`;
      }
      return "#";
    case "workspace":
      if (wsSlug) {
        return `/${wsSlug}`;
      }
      return "#";
    case "organization":
      return `/dashboard`;
    case "user":
      return `/users/${activity.entityId}`;
    default:
      return "#";
  }
}

function normalizeActivity(activity: any): ActivityFeedItem {
  const user = activity.user || {};
  const newValue = activity.newValue || {};

  const userName =
    user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown User";

  const description = activity.description || newValue?.title || "Activity";

  const entityType = (activity.entityType || "").toLowerCase();

  // Resolve slugs from API response first, then fall back to newValue contents
  let taskSlug = activity.taskSlug || null;
  let projectSlug = activity.projectSlug || null;
  const workspaceSlug = activity.workspaceSlug || null;

  if (!taskSlug && entityType === "task") {
    taskSlug = newValue.slug || newValue.key || null;
  }
  if (!projectSlug) {
    if (entityType === "project") {
      projectSlug = newValue.slug || null;
    } else if (entityType === "task") {
      projectSlug = newValue.project?.slug || null;
    }
  }

  return {
    id: activity.id || "",
    type: (activity.type || "").toLowerCase(),
    description,
    entityType: activity.entityType || null,
    entityId: activity.entityId || null,
    taskSlug,
    projectSlug,
    workspaceSlug,
    createdAt: activity.createdAt || "",
    user: {
      name: userName,
      avatar: user.avatar || null,
      id: user.id || null,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    action: activity.description || description,
    metadata: activity.metadata || {},
    newValue,
  };
}

export function ActivityFeedPanel({
  title,
  subtitle,
  activities,
  isLoading,
  error,
  onRetry,
  onClearFilter,
  emptyMessage = "No activity yet",
  workspaceSlug: fallbackWorkspaceSlug,
}: ActivityFeedPanelProps) {
  const normalizedActivities = activities.map(normalizeActivity);

  if (isLoading) {
    return (
      <InfoPanel title={title} subtitle={subtitle}>
        <div className="activity-loading-container">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="activity-loading-item">
              <div className="activity-loading-avatar" />
              <div className="activity-loading-content">
                <div className="activity-loading-title" />
                <div className="activity-loading-subtitle" />
              </div>
            </div>
          ))}
        </div>
      </InfoPanel>
    );
  }

  if (normalizedActivities.length === 0) {
    return (
      <InfoPanel title={title} subtitle={subtitle}>
        <div className="activity-empty-container">
          <div className="activity-empty-icon-container">
            <HiClock className="activity-empty-icon" />
          </div>
          <p className="activity-empty-title">{emptyMessage}</p>
          <p className="activity-empty-description">
            Recent activity will appear here once things start moving.
          </p>
          {onClearFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilter}
              className="activity-empty-button"
            >
              Show All Activities
            </Button>
          )}
        </div>
      </InfoPanel>
    );
  }

  return (
    <InfoPanel title={title} subtitle={subtitle}>
      <div className="activity-feed-container">
        {normalizedActivities.map((activity) => (
          <div key={activity.id} className="activity-feed-item">
            <Avatar className="activity-feed-avatar">
              <AvatarFallback className="activity-feed-avatar-fallback">
                {activity?.user?.name
                  ?.split(" ")
                  .map((n) => n.charAt(0))
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Details */}
            <div className="activity-content-container">
              <div className="activity-content-main">
                <span className="activity-content-user-name">
                  {activity?.user?.name ? activity.user.name : "Unknown User"}
                </span>
                <span className="activity-content-action">
                  {activity.type === "invitation_sent" ? (
                    <>
                      Sent invitation to{" "}
                      <span className="activity-content-user-name">
                        {activity.newValue?.user?.firstName && activity.newValue?.user?.lastName
                          ? `${activity.newValue.user.firstName} ${activity.newValue.user.lastName}`
                          : activity.newValue?.member?.user?.firstName &&
                              activity.newValue?.member?.user?.lastName
                            ? `${activity.newValue.member.user.firstName} ${activity.newValue.member.user.lastName}`
                            : activity.newValue?.user?.email ||
                              activity.newValue?.member?.user?.email ||
                              "Unknown User"}
                      </span>{" "}
                      to join {activity.newValue?.entity?.type || "organization/workspace/project"}
                    </>
                  ) : (
                    activity.action
                  )}
                </span>
                {activity.entityId && activity.type !== "invitation_sent" && (() => {
                  const href = getEntityLink(activity, fallbackWorkspaceSlug);
                  const label = `View ${activity.entityType?.replace(/\s*Att[a]?chment$/i, "")}`;
                  const isSafePath = /^\/[^/]/.test(href) && !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(href);
                  if (href !== "#" && isSafePath) {
                    return (
                      <span>
                        <Link href={href} className="activity-content-link">
                          {label}
                        </Link>
                      </span>
                    );
                  }
                  return (
                    <span>
                      <button
                        className="activity-content-link"
                        onClick={() =>
                          toast.error(`Unable to navigate to this ${activity.entityType?.toLowerCase() || "item"}. The details may have been deleted or are no longer accessible.`)
                        }
                      >
                        {label}
                      </button>
                    </span>
                  );
                })()}
              </div>

              {/* Meta row */}
              <div className="activity-meta-row">
                <div className="activity-meta-timestamp">
                  <HiClock className="activity-meta-timestamp-icon" />
                  <span className="activity-meta-timestamp-text">
                    {formatDateTimeForDisplay(activity.createdAt)}
                  </span>
                </div>
              </div>

              {/* Optional comment bubble */}
              {activity.metadata?.comment && (
                <div className="activity-comment-container">
                  <div className="activity-comment-content">
                    <HiChatBubbleLeft className="activity-comment-icon" />
                    <p className="activity-comment-text">{activity.metadata.comment}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </InfoPanel>
  );
}
