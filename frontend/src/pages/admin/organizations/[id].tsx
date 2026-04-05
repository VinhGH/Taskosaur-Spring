import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

function OrgDetailContent() {
  const router = useRouter();
  const { id } = router.query;
  const [org, setOrg] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transferTarget, setTransferTarget] = useState<string>("");

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    const fetch = async () => {
      try {
        const data = await adminApi.getOrganizationDetail(id);
        setOrg(data);
      } catch (error) {
        console.error("Failed to fetch organization:", error);
        toast.error("Failed to load organization details");
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleToggleArchive = async () => {
    try {
      const updated = await adminApi.toggleOrganizationArchive(org.id);
      setOrg((prev: any) => ({ ...prev, archive: updated.archive }));
      toast.success(`Organization ${updated.archive ? "suspended" : "activated"}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update organization");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete "${org.name}"? This will remove all workspaces, projects, and tasks within it. This action cannot be undone.`)) {
      return;
    }
    try {
      await adminApi.deleteOrganization(org.id);
      toast.success(`Organization "${org.name}" deleted`);
      router.push("/admin/organizations");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete organization");
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferTarget) return;
    if (!window.confirm(`Transfer ownership of "${org.name}" to the selected user? The current owner will be demoted to Manager.`)) {
      return;
    }
    try {
      const updated = await adminApi.transferOrganizationOwnership(org.id, transferTarget);
      setOrg((prev: any) => ({ ...prev, owner: updated.owner }));
      setTransferTarget("");
      toast.success(`Ownership transferred to ${updated.owner.firstName} ${updated.owner.lastName}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to transfer ownership");
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-[var(--card)] border-none shadow-sm">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-12 w-12 rounded-md" />
          <Skeleton className="h-5 w-48" />
        </CardContent>
      </Card>
    );
  }

  if (!org) {
    return <p className="text-sm text-[var(--muted-foreground)]">Organization not found</p>;
  }

  // Members eligible for ownership transfer (exclude current owner)
  const transferCandidates = org.members?.filter(
    (m: any) => m.user.id !== org.owner?.id
  ) || [];

  return (
    <>
      {/* Org Info + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-[var(--card)] border-none shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold mb-4 text-[var(--foreground)]">Organization Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Owner", value: org.owner ? `${org.owner.firstName} ${org.owner.lastName}` : "—", sub: org.owner?.email },
                { label: "Members", value: org._count?.members || 0 },
                { label: "Workspaces", value: org._count?.workspaces || 0 },
                { label: "Created", value: new Date(org.createdAt).toLocaleDateString() },
              ].map((item) => (
                <div key={item.label}>
                  <span className="text-xs text-[var(--muted-foreground)]">{item.label}</span>
                  <p className="text-sm font-medium text-[var(--foreground)]">{item.value}</p>
                  {"sub" in item && item.sub && (
                    <p className="text-xs text-[var(--muted-foreground)]">{item.sub}</p>
                  )}
                </div>
              ))}
            </div>
            {org.description && (
              <p className="text-xs text-[var(--muted-foreground)] mt-4">{org.description}</p>
            )}
          </CardContent>
        </Card>

        {/* Actions Panel */}
        <Card className="bg-[var(--card)] border-none shadow-sm">
          <CardContent className="p-6 space-y-5">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Actions</h3>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-xs text-[var(--muted-foreground)]">Status</label>
              <div className="flex items-center gap-3">
                <Badge className={`text-xs px-2 py-1 rounded-md border ${
                  org.archive
                    ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                    : "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                }`}>
                  {org.archive ? "Suspended" : "Active"}
                </Badge>
                <Button
                  variant="outline"
                  className={`h-7 text-xs border-none transition-all duration-200 ${
                    org.archive
                      ? "bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400"
                      : "bg-[var(--destructive)]/10 hover:bg-[var(--destructive)]/20 text-[var(--destructive)]"
                  }`}
                  onClick={handleToggleArchive}
                >
                  {org.archive ? "Activate" : "Suspend"}
                </Button>
              </div>
            </div>

            {/* Transfer Ownership */}
            {transferCandidates.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs text-[var(--muted-foreground)]">Transfer Ownership</label>
                <Select value={transferTarget} onValueChange={setTransferTarget}>
                  <SelectTrigger className="h-9 border-none bg-[var(--background)] shadow-sm">
                    <SelectValue placeholder="Select new owner" />
                  </SelectTrigger>
                  <SelectContent className="border-none bg-[var(--popover)]">
                    {transferCandidates.map((m: any) => (
                      <SelectItem key={m.user.id} value={m.user.id}>
                        {m.user.firstName} {m.user.lastName} ({m.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {transferTarget && (
                  <Button
                    className="h-9 w-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition-all duration-200 font-medium rounded-lg shadow-none border-none"
                    onClick={handleTransferOwnership}
                  >
                    Transfer
                  </Button>
                )}
              </div>
            )}

            {/* Delete */}
            <div className="space-y-2 pt-3 border-t border-[var(--border)]">
              <label className="text-xs text-[var(--muted-foreground)]">Danger Zone</label>
              <Button
                variant="outline"
                className="h-9 w-full border-none bg-[var(--destructive)]/10 hover:bg-[var(--destructive)]/20 text-[var(--destructive)] transition-all duration-200"
                onClick={handleDelete}
              >
                Delete Organization
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Members ({org.members?.length || 0})</h3>
        <Card className="bg-[var(--card)] border-none shadow-sm">
          <CardContent className="p-0">
            {org.members?.length > 0 ? (
              <div>
                <div className="px-4 py-3 border-b border-[var(--border)]">
                  <div className="grid grid-cols-12 gap-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                    <div className="col-span-5">Member</div>
                    <div className="col-span-3">Role</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Joined</div>
                  </div>
                </div>
                {org.members.map((m: any) => (
                  <div
                    key={m.user.id}
                    className="px-4 py-3 hover:bg-[var(--accent)]/30 cursor-pointer transition-colors border-b border-[var(--border)] last:border-b-0"
                    onClick={() => router.push(`/admin/users/${m.user.id}`)}
                  >
                    <div className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-5 flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-xs font-semibold text-[var(--primary)]">
                          {m.user.firstName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[var(--foreground)] truncate">
                            {m.user.firstName} {m.user.lastName}
                            {m.user.id === org.owner?.id && (
                              <span className="ml-1 text-[10px] text-[var(--primary)]">(Owner)</span>
                            )}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)] truncate">{m.user.email}</p>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <Badge className="text-xs px-2 py-1 rounded-md border-none bg-[var(--accent)] text-[var(--accent-foreground)]">
                          {m.role}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <Badge className={`text-xs px-2 py-1 rounded-md border ${
                          m.user.status === "ACTIVE"
                            ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                            : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                        }`}>
                          {m.user.status}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-xs text-[var(--muted-foreground)]">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-[var(--muted-foreground)]">No members</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Workspaces */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Workspaces ({org.workspaces?.length || 0})</h3>
        {org.workspaces?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {org.workspaces.map((ws: any) => (
              <Card key={ws.id} className="bg-[var(--card)] border-none shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{ws.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{ws.slug}</p>
                  <div className="flex gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                    <span>{ws._count?.projects || 0} projects</span>
                    <span>{ws._count?.members || 0} members</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">No workspaces</p>
        )}
      </div>
    </>
  );
}

export default function AdminOrgDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <AdminLayout
      breadcrumbs={[
        { label: "Organizations", href: "/admin/organizations" },
        { label: typeof id === "string" ? "Organization Details" : "..." },
      ]}
    >
      <OrgDetailContent />
    </AdminLayout>
  );
}
