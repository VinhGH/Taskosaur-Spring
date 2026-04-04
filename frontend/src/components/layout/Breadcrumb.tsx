import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb as ShadcnBreadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronRight } from "lucide-react";
import api from "@/lib/api";

// Helper: Convert slug-like text into Title Case
const formatSegment = (segment: string) => {
  return segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

// Helper: Detect if a segment is a UUID
const isUUID = (segment: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
};

// Helper: Extract UUID from taskId (format: uuid-slug)
const extractUuid = (taskId: string) => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = taskId.match(uuidPattern);
  return match ? match[0] : taskId;
};

interface BreadcrumbItem {
  name: string;
  href?: string;
  current: boolean;
}

export default function Breadcrumb() {
  const pathname = usePathname();
  const [currentPath, setCurrentPath] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // Sync with actual window location (handles pushState)
  useEffect(() => {
    const updatePath = () => {
      setCurrentPath(window.location.pathname);
    };
    
    // Initial sync
    updatePath();
    
    // Listen to popstate (back/forward)
    window.addEventListener('popstate', updatePath);
    
    // Monkey-patch history.pushState to detect URL changes
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      updatePath();
    };
    
    return () => {
      window.removeEventListener('popstate', updatePath);
      window.history.pushState = originalPushState;
    };
  }, []);

  // Use currentPath (from window.location) instead of pathname (from Next.js)
  const pathToUse = currentPath || pathname;

  useEffect(() => {
    if (!pathToUse) {
      setBreadcrumbs([]);
      return;
    }

    // Skip breadcrumb for certain paths
    if (
      pathToUse === "/dashboard" ||
      pathToUse === "/dashboard/" ||
      pathToUse === "/tasks" ||
      pathToUse === "/tasks/" ||
      pathToUse === "/settings" ||
      pathToUse === "/settings/"
    ) {
      setBreadcrumbs([]);
      return;
    }

    const segments = pathToUse.split("/").filter((seg) => seg.length > 0);

    // Check if this is a sprint detail page: /[workspace]/[project]/sprints/[sprintId]
    const isSprintDetail = segments.length === 4 &&
                           segments[2] === 'sprints' &&
                           segments[3];

    // Check if this is a task detail page
    // Patterns: /tasks/[slug], /[workspace]/tasks/[slug], /[workspace]/[project]/tasks/[slug]
    const taskSegmentIndex = segments.findIndex((seg, idx) => seg === 'tasks' && idx < segments.length - 1);

    // Handle sprint detail page
    if (isSprintDetail) {
      const sprintIdOrSlug = segments[3];
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sprintIdOrSlug);

      const fetchSprintBreadcrumb = async () => {
        try {
          const sprintResponse = isUUID
            ? await api.get(`/sprints/${encodeURIComponent(sprintIdOrSlug)}`)
            : await api.get(`/sprints/by-slug/${encodeURIComponent(segments[1])}/${encodeURIComponent(sprintIdOrSlug)}`);
          const sprint = sprintResponse.data;

          const items: BreadcrumbItem[] = [];

          // Add workspace
          if (segments[0]) {
            items.push({
              name: formatSegment(segments[0]),
              href: `/${segments[0]}`,
              current: false,
            });
          }

          // Add project
          if (segments[1]) {
            items.push({
              name: formatSegment(segments[1]),
              href: `/${segments[0]}/${segments[1]}`,
              current: false,
            });
          }

          // Add sprint name (current)
          items.push({
            name: sprint?.name || formatSegment(sprintIdOrSlug),
            current: true,
          });

          setBreadcrumbs(items);
        } catch (error) {
          console.error('Failed to fetch sprint data for breadcrumb:', error);
          buildBreadcrumbFromSegments(segments);
        }
      };
      fetchSprintBreadcrumb();
      return;
    }

    if (taskSegmentIndex !== -1 && taskSegmentIndex < segments.length - 1) {
      const taskIdOrSlug = segments[taskSegmentIndex + 1];

      const fetchTaskBreadcrumb = async () => {
        try {
          const response = await api.get(`/tasks/key/${encodeURIComponent(taskIdOrSlug)}`);
          const task = response.data;

          const items: BreadcrumbItem[] = [];

          const urlWorkspace = taskSegmentIndex >= 1 && segments[0] !== 'tasks' ? segments[0] : null;
          const urlProject = taskSegmentIndex >= 2 && segments[1] !== 'tasks' ? segments[1] : null;

          const wsSlug = urlWorkspace || task.project?.workspace?.slug;
          const wsName = task.project?.workspace?.name;

          const pgSlug = urlProject || task.project?.slug;
          const pgName = task.project?.name;

          // Add workspace
          if (wsSlug) {
            items.push({
              name: wsName || formatSegment(wsSlug),
              href: `/${wsSlug}`,
              current: false,
            });
          }

          // Add project
          if (pgSlug && wsSlug) {
            items.push({
              name: pgName || formatSegment(pgSlug),
              href: `/${wsSlug}/${pgSlug}`,
              current: false,
            });
          }

          if (pgSlug && wsSlug) {
            items.push({
              name: 'Tasks',
              href: `/${wsSlug}/${pgSlug}/tasks`,
              current: false,
            });
          }

          // Add task (current)
          const taskSlug = task.slug || taskIdOrSlug;
          items.push({
            name: decodeURIComponent(taskSlug).replace(/-/g, ' '),
            current: true,
          });

          setBreadcrumbs(items);
        } catch (error) {
          console.error('Failed to fetch task data for breadcrumb:', error);
          buildBreadcrumbFromSegments(segments);
        }
      };
      fetchTaskBreadcrumb();
      return;
    }

    // Default: build breadcrumb from URL segments
    buildBreadcrumbFromSegments(segments);
  }, [pathToUse]);

  const buildBreadcrumbFromSegments = (segments: string[]) => {
    const items = segments.map((seg, idx) => {
      const href = "/" + segments.slice(0, idx + 1).join("/");
      const displayName = formatSegment(seg);

      return {
        name: displayName,
        href,
        current: idx === segments.length - 1,
      };
    });

    setBreadcrumbs(items);
  };

  if (
    !pathToUse ||
    pathToUse === "/dashboard" ||
    pathToUse === "/dashboard/" ||
    pathToUse === "/tasks" ||
    pathToUse === "/tasks/" ||
    pathToUse === "/settings" ||
    pathToUse === "/settings/" ||
    breadcrumbs.length === 0
  ) {
    return null;
  }

  return (
    <div className="breadcrumb-container">
      <div className="">
        <ShadcnBreadcrumb>
          <BreadcrumbList className="breadcrumb-nav">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard" className="breadcrumb-link">
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="breadcrumb-separator">
              <ChevronRight className="breadcrumb-separator-icon" />
            </BreadcrumbSeparator>
            {breadcrumbs.map((item, idx) => (
              <React.Fragment key={item.href}>
                <BreadcrumbItem className="breadcrumb-item">
                  {item.current ? (
                    <BreadcrumbPage className="breadcrumb-current">
                      <span className="breadcrumb-current-text">{item.name}</span>
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={item.href} className="breadcrumb-link">
                        <span className="breadcrumb-link-text">{item.name}</span>
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {idx < breadcrumbs.length - 1 && (
                  <BreadcrumbSeparator className="breadcrumb-separator">
                    <ChevronRight className="breadcrumb-separator-icon" />
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </ShadcnBreadcrumb>
      </div>
    </div>
  );
}
