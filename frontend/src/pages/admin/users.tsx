import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin-api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { FilterDropdown, useGenericFilters } from "@/components/common/FilterDropdown";
import Pagination from "@/components/common/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { HiEllipsisVertical, HiXMark, HiEye, HiShieldCheck, HiShieldExclamation, HiNoSymbol, HiCheckCircle, HiKey, HiTrash, HiUsers } from "react-icons/hi2";
import { HiSearch } from "react-icons/hi";
import { ShieldCheck, Flame, CircleDot } from "lucide-react";
import { toast } from "sonner";

// Global user roles — only SUPER_ADMIN and MEMBER are meaningful at system level
const GLOBAL_ROLES = ["SUPER_ADMIN", "MEMBER"];
// All roles for filter display
const ALL_ROLES = ["SUPER_ADMIN", "OWNER", "MANAGER", "MEMBER", "VIEWER"];
const STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"];

const ROLE_OPTIONS = ALL_ROLES.map((r) => ({ id: r, name: r, value: r }));
const STATUS_OPTIONS = STATUSES.map((s) => ({
  id: s,
  name: s,
  value: s,
  color:
    s === "ACTIVE" ? "#22c55e" :
    s === "SUSPENDED" ? "#ef4444" :
    s === "PENDING" ? "#eab308" : "#6b7280",
}));

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case "SUPER_ADMIN":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
    case "OWNER":
      return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800";
    case "MANAGER":
      return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800";
    case "MEMBER":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
    case "VIEWER":
      return "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]";
    default:
      return "bg-[var(--accent)] text-[var(--accent-foreground)]";
  }
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
    case "INACTIVE":
      return "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]";
    case "SUSPENDED":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
    default:
      return "bg-[var(--accent)] text-[var(--accent-foreground)]";
  }
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

function AdminUsersContent() {
  const router = useRouter();
  const { createSection } = useGenericFilters();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedRoles.length === 1) params.role = selectedRoles[0];
      if (selectedStatuses.length === 1) params.status = selectedStatuses[0];
      const data = await adminApi.getUsers(params);
      setUsers(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, selectedRoles, selectedStatuses]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleRole = useCallback((id: string) => {
    setSelectedRoles((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setPage(1);
  }, []);

  const toggleStatus = useCallback((id: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setPage(1);
  }, []);

  const totalActiveFilters = selectedRoles.length + selectedStatuses.length;

  const clearAllFilters = useCallback(() => {
    setSelectedRoles([]);
    setSelectedStatuses([]);
    setPage(1);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchInput("");
    setPage(1);
  }, []);

  const roleFilters = useMemo(
    () => ROLE_OPTIONS.map((r) => ({
      ...r,
      selected: selectedRoles.includes(r.id),
      count: users.filter((u) => u.role === r.id).length,
    })),
    [selectedRoles, users]
  );

  const statusFilters = useMemo(
    () => STATUS_OPTIONS.map((s) => ({
      ...s,
      selected: selectedStatuses.includes(s.id),
      count: users.filter((u) => u.status === s.id).length,
    })),
    [selectedStatuses, users]
  );

  const filterSections = useMemo(
    () => [
      createSection({
        id: "role",
        title: "Role",
        icon: ShieldCheck,
        data: roleFilters,
        selectedIds: selectedRoles,
        searchable: false,
        onToggle: toggleRole,
        onSelectAll: () => setSelectedRoles(ALL_ROLES),
        onClearAll: () => { setSelectedRoles([]); setPage(1); },
      }),
      createSection({
        id: "status",
        title: "Status",
        icon: CircleDot,
        data: statusFilters,
        selectedIds: selectedStatuses,
        searchable: false,
        onToggle: toggleStatus,
        onSelectAll: () => setSelectedStatuses(STATUSES),
        onClearAll: () => { setSelectedStatuses([]); setPage(1); },
      }),
    ],
    [roleFilters, statusFilters, selectedRoles, selectedStatuses, toggleRole, toggleStatus, createSection]
  );

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await adminApi.updateUserRole(userId, role);
      toast.success("User role updated");
      fetchUsers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update role");
    }
  };

  const handleStatusChange = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await adminApi.updateUserStatus(userId, newStatus);
      toast.success(`User ${newStatus === "ACTIVE" ? "activated" : "deactivated"}`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    try {
      const result = await adminApi.resetUserPassword(userId);
      // Copy the reset link to clipboard
      if (result.resetLink) {
        await navigator.clipboard.writeText(window.location.origin + result.resetLink);
        toast.success(`Password reset link for ${userName} copied to clipboard. Valid for 24 hours.`);
      } else {
        toast.success(result.message);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to generate reset link");
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${userName}"? This will deactivate their account and remove them from all organizations.`)) {
      return;
    }
    try {
      await adminApi.deleteUser(userId);
      toast.success(`User "${userName}" removed`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <>
      <p className="text-sm text-[var(--muted-foreground)]">{total} users in the system</p>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
            className="pl-10 rounded-md border border-[var(--border)]"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
            >
              <HiXMark size={16} />
            </button>
          )}
        </div>
        <FilterDropdown
          sections={filterSections}
          title="Filters"
          activeFiltersCount={totalActiveFilters}
          onClearAllFilters={clearAllFilters}
          placeholder="Filter users"
          dropdownWidth="w-56"
          showApplyButton={false}
        />
      </div>

      {/* Users Table */}
      <Card className="bg-[var(--card)] border-none shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <HiUsers className="w-10 h-10 mx-auto text-[var(--muted-foreground)]/50 mb-3" />
              <p className="text-sm font-medium text-[var(--foreground)]">No users found</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {debouncedSearch ? "Try adjusting your search or filters" : "No users in the system yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <div className="grid grid-cols-12 gap-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  <div className="col-span-4">User</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1">Orgs</div>
                  <div className="col-span-2">Joined</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>
              {users.map((user) => (
                <div
                  key={user.id}
                  className="px-4 py-3 hover:bg-[var(--accent)]/30 transition-colors cursor-pointer border-b border-[var(--border)] last:border-b-0"
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                >
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-xs font-semibold text-[var(--primary)] flex-shrink-0">
                        {user.firstName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--foreground)] truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)] truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Badge className={`text-xs px-2 py-1 rounded-md border ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <Badge className={`text-xs px-2 py-1 rounded-md border ${getStatusBadgeClass(user.status)}`}>
                        {user.status}
                      </Badge>
                    </div>
                    <div className="col-span-1 text-xs text-[var(--muted-foreground)]">
                      {user._count?.organizationMembers || 0}
                    </div>
                    <div className="col-span-2 text-xs text-[var(--muted-foreground)]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-[var(--accent)]">
                            <HiEllipsisVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-none bg-[var(--popover)] shadow-lg min-w-[180px] p-1">
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-all duration-150 hover:bg-[var(--accent)]"
                          >
                            <HiEye className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                            <span className="text-sm">View Details</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          {user.role !== "SUPER_ADMIN" && (
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(user.id, "SUPER_ADMIN")}
                              className="flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-all duration-150 hover:bg-[var(--accent)]"
                            >
                              <HiShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                              <span className="text-sm">Promote to Super Admin</span>
                            </DropdownMenuItem>
                          )}
                          {user.role === "SUPER_ADMIN" && (
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(user.id, "MEMBER")}
                              className="flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-all duration-150 hover:bg-[var(--accent)]"
                            >
                              <HiShieldExclamation className="w-3.5 h-3.5 text-orange-500" />
                              <span className="text-sm">Remove Super Admin</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(user.id, user.status)}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-all duration-150 hover:bg-[var(--accent)]"
                          >
                            {user.status === "ACTIVE" ? (
                              <>
                                <HiNoSymbol className="w-3.5 h-3.5 text-[var(--destructive)]" />
                                <span className="text-sm text-[var(--destructive)]">Deactivate</span>
                              </>
                            ) : (
                              <>
                                <HiCheckCircle className="w-3.5 h-3.5 text-green-600" />
                                <span className="text-sm text-green-600">Activate</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleResetPassword(user.id, `${user.firstName} ${user.lastName}`)}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-all duration-150 hover:bg-[var(--accent)]"
                          >
                            <HiKey className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                            <span className="text-sm">Reset Password</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-all duration-150 hover:bg-[var(--destructive)]/10"
                          >
                            <HiTrash className="w-3.5 h-3.5 text-[var(--destructive)]" />
                            <span className="text-sm text-[var(--destructive)]">Remove User</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <AdminUsersContent />
    </AdminLayout>
  );
}
