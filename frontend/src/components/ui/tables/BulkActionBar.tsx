import { Trash2, X, CheckCircle, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onClear: () => void;
  onAllDeleteSelect: () => void;
  totalTask?: number;
  currentTaskCount?: number;
  allDelete?: boolean;
  excludedCount?: number;
  availableStatuses?: any[];
  onStatusUpdate?: (statusId: string) => void;
  userRole?: string | null;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onDelete,
  onClear,
  onAllDeleteSelect,
  totalTask,
  currentTaskCount,
  allDelete,
  excludedCount = 0,
  availableStatuses = [],
  onStatusUpdate,
  userRole,
}) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState<string | null>(null);

  const canDelete = userRole && ["SUPER_ADMIN", "OWNER", "MANAGER"].includes(userRole);
  const canUpdateStatus = userRole && ["SUPER_ADMIN", "OWNER", "MANAGER", "MEMBER", "DEVELOPER"].includes(userRole);

  if (selectedCount === 0 && !allDelete) return null;
  const finalSelectedCount = allDelete ? (totalTask ?? 0) - excludedCount : selectedCount;
  if (finalSelectedCount === 0) return null;

  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = () => {
    onDelete();
    setShowDeleteConfirmation(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const handleStatusSelect = (statusId: string) => {
    setSelectedStatusId(statusId);
  };

  const handleConfirmStatus = () => {
    if (onStatusUpdate && selectedStatusId) {
      onStatusUpdate(selectedStatusId);
    }
    setSelectedStatusId(null);
  };

  const handleCancelStatus = () => {
    setSelectedStatusId(null);
  };

  const selectedStatus = availableStatuses.find((s) => s.id === selectedStatusId);

  const allSelected = currentTaskCount && selectedCount >= currentTaskCount;
  return (
    <>
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-8 fade-in duration-300">
        <div className="bg-[var(--card)]/90 backdrop-blur-md border border-[var(--border)] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] px-1.5 py-1.5 flex items-center gap-2">
          {/* Selection Info */}
          <div className="flex items-center px-3 py-1.5 gap-2 border-r border-[var(--border)]">
            <div className="flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold h-5 w-5 rounded-md shadow-sm">
              {finalSelectedCount}
            </div>
            <span className="text-xs font-medium text-[var(--foreground)] pr-1">
              {finalSelectedCount === 1 ? "Task" : "Tasks"} selected
            </span>

            {(allSelected || allDelete) && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAllDeleteSelect();
                }}
                className="text-[11px] text-primary hover:text-primary/80 font-bold bg-primary/5 hover:bg-primary/10 px-2 py-1 rounded-md transition-all uppercase tracking-tight"
              >
                {!allDelete ? `Select all ${totalTask}` : "Clear Selection"}
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {onStatusUpdate && canUpdateStatus && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 gap-2 hover:bg-primary/[0.08] text-[var(--foreground)] font-medium transition-all group"
                  >
                    <CheckCircle className="size-4 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-xs">Update Status</span>
                    <ChevronDown className="size-3.5 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="center" 
                  sideOffset={12}
                  className="w-[220px] p-1.5 bg-[var(--card)]/95 backdrop-blur-sm border-[var(--border)] rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
                >
                  <div className="px-2 py-2 mb-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70 border-b border-[var(--border)]/50">
                    Change Status to
                  </div>
                  <div className="max-h-[280px] overflow-y-auto pr-1 space-y-0.5 custom-scrollbar">
                    {availableStatuses.map((status) => (
                      <DropdownMenuItem
                        key={status.id}
                        onClick={() => handleStatusSelect(status.id)}
                        className={cn(
                          "flex items-center justify-between gap-3 px-2.5 py-2.5 rounded-lg border border-transparent cursor-pointer transition-all",
                          "hover:bg-primary/5 hover:border-primary/20",
                          "group"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-2.5 h-2.5 rounded-full ring-4 ring-offset-0 ring-primary/0 group-hover:ring-primary/10 transition-all"
                            style={{ 
                              backgroundColor: status.color || "#cbd5e1",
                              boxShadow: `0 0 8px ${status.color || "#cbd5e1"}40`
                            }}
                          />
                          <span className="text-sm font-medium">{status.name}</span>
                        </div>
                        <Check className="size-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </DropdownMenuItem>
                    ))}
                  </div>
                  {availableStatuses.length === 0 && (
                    <div className="px-2 py-3 text-center text-xs text-muted-foreground italic bg-muted/30 rounded-lg">
                      No statuses available
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className="h-9 px-3 gap-2 text-destructive hover:bg-destructive/10 font-medium transition-all group"
              >
                <Trash2 className="size-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs">Delete</span>
              </Button>
            )}

            <div className="h-6 w-px bg-[var(--border)] mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-9 w-9 p-0 hover:bg-muted/50 rounded-lg transition-all"
            >
              <X className="size-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Permanently Delete Tasks?"
        message={`This will permanently remove ${finalSelectedCount} selected ${
          finalSelectedCount === 1 ? "task" : "tasks"
        }. This action is destructive and cannot be reversed.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
      />

      {selectedStatusId && (
        <ConfirmationModal
          isOpen={!!selectedStatusId}
          onClose={handleCancelStatus}
          onConfirm={handleConfirmStatus}
          title="Update Task Status"
          message={`Confirm switching ${finalSelectedCount} ${
            finalSelectedCount === 1 ? "task" : "tasks"
          } to the "${selectedStatus?.name}" status.`}
          confirmText={`Update to ${selectedStatus?.name}`}
          cancelText="Cancel"
          type="info"
        />
      )}
    </>
  );
};

