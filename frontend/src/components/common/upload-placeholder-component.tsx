import { NodeViewWrapper, ReactNodeViewProps } from "@tiptap/react";
import { HiOutlinePhoto } from "react-icons/hi2";

export function UploadPlaceholderComponent({
  node,
}: ReactNodeViewProps) {
  const filename = node.attrs.filename || "unknown";

  return (
    <NodeViewWrapper>
      <div className="flex items-center gap-3 p-4 my-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)]/30">
        <div className="relative">
          <HiOutlinePhoto className="size-5 text-[var(--muted-foreground)]" />
          <div className="absolute inset-0 animate-spin">
            <HiOutlinePhoto className="size-5 text-blue-500 opacity-50" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)] truncate">
            Uploading image...
          </p>
          <p className="text-xs text-[var(--muted-foreground)] truncate">
            {filename}
          </p>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
