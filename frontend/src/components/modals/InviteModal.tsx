import { useState, useEffect } from "react";
import ActionButton from "../common/ActionButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { invitationApi } from "@/utils/api/invitationsApi";
import { HiMail } from "react-icons/hi";
import { Input, Label, Select } from "../ui";
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface WorkspaceProject {
  id: string;
  name: string;
  slug: string;
}

const InviteModal = ({
  isOpen,
  onClose,
  onInvite,
  availableRoles,
  projects,
}: {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string, projectIds?: string[]) => void;
  availableRoles: Array<{ id: string; name: string; description: string }>;
  projects?: WorkspaceProject[];
}) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const isEmailValid = email ? invitationApi.validateEmail(email) : true;
  const hasProjects = projects && projects.length > 0;

  useEffect(() => {
    if (hasProjects) {
      setSelectAll(selectedProjectIds.length === projects.length);
    }
  }, [selectedProjectIds, projects, hasProjects]);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked && projects) {
      setSelectedProjectIds(projects.map((p) => p.id));
    } else {
      setSelectedProjectIds([]);
    }
  };

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !isEmailValid) return;

    setInviting(true);
    try {
      onInvite(
        email.trim(),
        role,
        selectedProjectIds.length > 0 ? selectedProjectIds : undefined
      );
      setEmail("");
      setRole("MEMBER");
      setSelectedProjectIds([]);
      setSelectAll(false);
      onClose();
    } catch (error) {
      console.error("Failed to send invitation:", error);
    } finally {
      setInviting(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setRole("MEMBER");
    setSelectedProjectIds([]);
    setSelectAll(false);
    onClose();
  };

  return (
    <div automation-id="invite-modal">
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-[var(--card)] border-none rounded-[var(--card-radius)] shadow-lg max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--foreground)] flex items-center gap-2">
              <HiMail className="w-5 h-5 text-[var(--primary)]" />
              Invite Member to Workspace
            </DialogTitle>
            <DialogDescription className="text-[var(--muted-foreground)]">
              Send an invitation to join this workspace.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label
                htmlFor="invite-email"
                className="text-sm font-medium text-[var(--foreground)]"
              >
                Email Address
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="mt-1 border-none bg-background text-[var(--foreground)]"
                required
              />
              {email && !isEmailValid && (
                <p className="text-xs text-[var(--destructive)] mt-1">
                  Please enter a valid email address
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-[var(--foreground)]">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger
                  className="projects-workspace-button border-none mt-1"
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <SelectValue placeholder="Select a role">
                    {role && <span className="text-[var(--foreground)]">{role}</span>}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="border-none bg-[var(--card)]">
                  {availableRoles.map((r) => (
                    <SelectItem key={r.id} value={r.name} className="hover:bg-[var(--hover-bg)]">
                      <div className="flex flex-col items-start py-1">
                        <span className="font-medium text-[var(--foreground)]">{r.name}</span>
                        <span className="text-xs text-[var(--muted-foreground)] mt-0.5">
                          {r.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!role && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Please select a role for the member
                </p>
              )}
            </div>

            {hasProjects && (
              <div>
                <Label className="text-sm font-medium text-[var(--foreground)]">
                  Grant Project Access
                </Label>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 mb-2">
                  Select which projects this member should have access to
                </p>
                <div className="rounded-lg bg-background max-h-[180px] overflow-y-auto">
                  {/* Select All */}
                  <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[var(--accent)]/30 transition-colors border-b border-[var(--border)]">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] accent-[var(--primary)]"
                    />
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      All Projects ({projects.length})
                    </span>
                  </label>
                  {projects.map((project) => (
                    <label
                      key={project.id}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[var(--accent)]/30 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProjectIds.includes(project.id)}
                        onChange={() => handleProjectToggle(project.id)}
                        className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] accent-[var(--primary)]"
                      />
                      <span className="text-sm text-[var(--foreground)] truncate">
                        {project.name}
                      </span>
                    </label>
                  ))}
                </div>
                {selectedProjectIds.length > 0 && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {selectedProjectIds.length} project{selectedProjectIds.length !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            )}

            <DialogFooter className="flex justify-end gap-3">
              <ActionButton
                secondary
                type="button"
                onClick={handleClose}
                disabled={inviting}
                className="w-20"
              >
                Cancel
              </ActionButton>
              <ActionButton
                primary
                type="submit"
                disabled={inviting || !email.trim() || !isEmailValid || !role}
                className="w-28"
              >
                {inviting ? "Inviting..." : "Send Invite"}
              </ActionButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InviteModal;
