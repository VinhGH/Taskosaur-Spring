import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiChevronRight, HiChevronDown, HiViewGrid } from "react-icons/hi";
import { Workspace } from "@/types";
import { useWorkspace } from "@/contexts/workspace-context";
import { cn } from "@/lib/utils";

interface TreeNode {
  workspace: Workspace;
  children: TreeNode[];
}

interface WorkspaceTreeProps {
  currentWorkspaceSlug?: string | null;
}

export default function WorkspaceTree({ currentWorkspaceSlug }: WorkspaceTreeProps) {
  const { workspaceTree, getWorkspaceTree, getCurrentOrganizationId } = useWorkspace();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const fetchedOrgRef = useRef<string | null>(null);
  const getWorkspaceTreeRef = useRef(getWorkspaceTree);
  getWorkspaceTreeRef.current = getWorkspaceTree;

  const orgId = getCurrentOrganizationId();
  useEffect(() => {
    if (orgId && fetchedOrgRef.current !== orgId) {
      fetchedOrgRef.current = orgId;
      getWorkspaceTreeRef.current(orgId).catch(console.error);
    }
  }, [orgId]);

  // Build tree from flat list
  const tree = useMemo(() => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // Initialize all nodes
    workspaceTree.forEach((ws) => {
      map.set(ws.id, { workspace: ws, children: [] });
    });

    // Build hierarchy
    workspaceTree.forEach((ws) => {
      const node = map.get(ws.id);
      if (!node) return;

      if (ws.parentWorkspaceId && map.has(ws.parentWorkspaceId)) {
        map.get(ws.parentWorkspaceId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [workspaceTree]);

  // Expand parents if a child is selected
  useEffect(() => {
    if (!currentWorkspaceSlug || !workspaceTree.length) return;
    
    const currentWs = workspaceTree.find(w => w.slug === currentWorkspaceSlug);
    if (!currentWs || !currentWs.path) return;

    // The materialized path looks like "/rootId/parentId/currentId"
    // Expand all ancestors in the path
    const ancestors = currentWs.path.split('/').filter(Boolean);
    // Remove the current node itself
    ancestors.pop();

    if (ancestors.length > 0) {
      setExpanded(prev => {
        const next = { ...prev };
        ancestors.forEach(id => {
          next[id] = true;
        });
        return next;
      });
    }
  }, [currentWorkspaceSlug, workspaceTree]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNode = (node: TreeNode, depth = 0) => {
    const ws = node.workspace;
    const isExpanded = !!expanded[ws.id];
    const isCurrent = currentWorkspaceSlug === ws.slug;
    const hasChildren = node.children.length > 0;

    return (
      <div key={ws.id}>
        <Link
          href={`/${ws.slug}`}
          className={cn(
            "layout-sidebar-nav-link",
            isCurrent
              ? "layout-sidebar-nav-link-active"
              : "layout-sidebar-nav-link-inactive"
          )}
          style={{ paddingLeft: `${Math.max(12, depth * 16 + 12)}px` }}
        >
          {/* Chevron toggle */}
          <span
            className={cn(
              "layout-sidebar-nav-link-icon flex-shrink-0",
              !hasChildren && "invisible"
            )}
            onClick={(e) => hasChildren && toggleExpand(ws.id, e)}
          >
            {isExpanded ? (
              <HiChevronDown className="w-3.5 h-3.5" />
            ) : (
              <HiChevronRight className="w-3.5 h-3.5" />
            )}
          </span>

          {/* Icon */}
          <span className="layout-sidebar-nav-link-icon flex-shrink-0">
            <HiViewGrid className="w-4 h-4" />
          </span>

          {/* Name */}
          <span className="layout-sidebar-nav-link-text">{ws.name}</span>
        </Link>
        
        {isExpanded && hasChildren && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!tree.length) {
    return (
      <div className="py-2 px-3 text-xs text-[var(--sidebar-muted)] italic">
        No nested workspaces
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {tree.map(node => renderNode(node))}
    </div>
  );
}
