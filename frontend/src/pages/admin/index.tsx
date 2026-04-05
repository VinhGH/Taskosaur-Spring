import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin-api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import {
  HiUsers,
  HiBuildingOffice2,
  HiSquares2X2,
  HiClipboardDocumentList,
  HiFolder,
  HiArrowTrendingUp,
  HiUserGroup,
  HiCog6Tooth,
  HiEnvelope,
  HiShieldCheck,
  HiUserPlus,
  HiCheckCircle,
  HiXCircle,
} from "react-icons/hi2";

interface DashboardStats {
  totalUsers: number;
  totalOrganizations: number;
  totalWorkspaces: number;
  totalProjects: number;
  totalTasks: number;
  newUsersThisWeek: number;
  newOrgsThisWeek: number;
  newProjectsThisWeek: number;
  newTasksThisWeek: number;
  activeUsers: number;
}

interface ConfigStatus {
  registrationEnabled: boolean;
  smtpConfigured: boolean;
  ssoEnabled: boolean;
}

function StatCard({
  icon: Icon,
  title,
  value,
  subValue,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number;
  subValue?: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`bg-[var(--card)] rounded-lg shadow-sm border-none ${onClick ? "cursor-pointer hover:shadow-lg transition-all duration-200" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-[var(--primary)]" />
          </div>
          {subValue && (
            <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
              <HiArrowTrendingUp className="w-3 h-3" />
              {subValue}
            </span>
          )}
        </div>
        <div className="text-2xl font-bold text-[var(--foreground)]">{value.toLocaleString()}</div>
        <div className="text-sm font-medium text-[var(--muted-foreground)] mt-1">{title}</div>
      </CardContent>
    </Card>
  );
}

function ConfigStatusBadge({ configured, label }: { configured: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {configured ? (
        <HiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
      ) : (
        <HiXCircle className="w-4 h-4 text-[var(--muted-foreground)]" />
      )}
      <span className={`text-xs ${configured ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}>
        {label}
      </span>
    </div>
  );
}

function AdminDashboardContent() {
  const router = useRouter();
  const { getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await adminApi.getDashboard();
        setStats(data);

        // Load config status
        try {
          const config = await adminApi.getConfig();
          const settings = config?.settings || config;
          const settingsMap: Record<string, string> = {};
          if (Array.isArray(settings)) {
            settings.forEach((s: { key: string; value: string | null }) => {
              if (s.value !== null) settingsMap[s.key] = s.value;
            });
          }
          const smtpSources = config?.smtpSources;
          const smtpConfigured = Array.isArray(smtpSources)
            ? smtpSources.some((s: { source: string }) => s.source === "env" || s.source === "db")
            : false;

          setConfigStatus({
            registrationEnabled: settingsMap["registration_enabled"] !== "false",
            smtpConfigured,
            ssoEnabled: settingsMap["sso_enabled"] === "true",
          });
        } catch {
          setConfigStatus(null);
        }
      } catch (error) {
        console.error("Failed to fetch admin dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-[var(--card)] border-none shadow-sm">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-[var(--primary)]/5 to-[var(--primary)]/10 border-none shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Welcome back, {currentUser?.firstName || "Admin"}
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Here&apos;s an overview of your platform. {stats?.activeUsers || 0} active users across {stats?.totalOrganizations || 0} organizations.
              </p>
            </div>
            <button
              onClick={() => router.push("/admin/config")}
              className="text-xs text-[var(--primary)] hover:underline cursor-pointer flex items-center gap-1"
            >
              <HiCog6Tooth className="w-3.5 h-3.5" />
              Configuration
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            icon={HiUsers}
            title="Total Users"
            value={stats.totalUsers}
            subValue={stats.newUsersThisWeek > 0 ? `+${stats.newUsersThisWeek} this week` : undefined}
            onClick={() => router.push("/admin/users")}
          />
          <StatCard
            icon={HiUserGroup}
            title="Active Users"
            value={stats.activeUsers}
          />
          <StatCard
            icon={HiBuildingOffice2}
            title="Organizations"
            value={stats.totalOrganizations}
            subValue={stats.newOrgsThisWeek > 0 ? `+${stats.newOrgsThisWeek} this week` : undefined}
            onClick={() => router.push("/admin/organizations")}
          />
          <StatCard icon={HiSquares2X2} title="Workspaces" value={stats.totalWorkspaces} />
          <StatCard
            icon={HiFolder}
            title="Projects"
            value={stats.totalProjects}
            subValue={stats.newProjectsThisWeek > 0 ? `+${stats.newProjectsThisWeek} this week` : undefined}
          />
          <StatCard
            icon={HiClipboardDocumentList}
            title="Tasks"
            value={stats.totalTasks}
            subValue={stats.newTasksThisWeek > 0 ? `+${stats.newTasksThisWeek} this week` : undefined}
          />
        </div>
      )}

      {/* System Status */}
      {configStatus && (
        <Card className="bg-[var(--card)] border-none shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">System Status</h3>
              <button
                onClick={() => router.push("/admin/config")}
                className="text-xs text-[var(--primary)] hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--accent)]/30">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                  <HiUserPlus className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--foreground)]">Registration</p>
                  <ConfigStatusBadge
                    configured={configStatus.registrationEnabled}
                    label={configStatus.registrationEnabled ? "Enabled" : "Disabled"}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--accent)]/30">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                  <HiEnvelope className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--foreground)]">Email / SMTP</p>
                  <ConfigStatusBadge
                    configured={configStatus.smtpConfigured}
                    label={configStatus.smtpConfigured ? "Configured" : "Not configured"}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--accent)]/30">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                  <HiShieldCheck className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--foreground)]">Single Sign-On</p>
                  <ConfigStatusBadge
                    configured={configStatus.ssoEnabled}
                    label={configStatus.ssoEnabled ? "Enabled" : "Disabled"}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <AdminDashboardContent />
    </AdminLayout>
  );
}
