import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/common/SEO";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { userApi } from "@/utils/api/userApi";
import ErrorState from "@/components/common/ErrorState";
import UserAvatar from "@/components/ui/avatars/UserAvatar";
import { Loader2 } from "lucide-react";

export default function UserProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await userApi.getPublicProfile(id);
        setProfile(data);
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError("You do not have permission to view this profile.");
        } else if (err.response?.status === 404) {
          setError("User not found.");
        } else {
          setError("An error occurred while loading the profile.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (error) {
    return (
      <div className="dashboard-container px-[1rem]">
        <ErrorState
          error={error}
          onRetry={() => router.push(`/${router.query.workspaceSlug}/members`)}
          retryText="Back to Members"
        />
      </div>
    );
  }

  return (
    <div className="dashboard-container pt-8 pb-12">
      <SEO title={profile ? `${profile.firstName} ${profile.lastName}` : "User Profile"} />

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : profile ? (
        <div className="max-w-6xl mx-auto w-full mt-4">
          <Card className="bg-[var(--card)] border-[var(--border)] overflow-hidden shadow-sm min-h-[500px]">
            <CardHeader className="flex flex-col p-6 pb-4">
              <div className="flex items-center gap-4 mb-2">
                <UserAvatar user={profile} size="xl" className="h-[72px] w-[72px] text-2xl" />
                <div className="flex flex-col">
                  <CardTitle className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                    {profile.firstName} {profile.lastName}
                  </CardTitle>
                  {profile.role && (
                    <div className="mt-1.5 flex">
                      <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-500 rounded-full text-[13px] font-medium tracking-wide">
                        {profile.role.toLowerCase().replace("_", " ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <div className="px-6 py-3 border-y border-[var(--border)] flex justify-between items-center bg-[var(--background)]/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-[var(--foreground)]">Active</span>
              </div>
              <span className="text-sm text-[var(--muted-foreground)]">
                Member since {new Date(profile.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>

            <CardContent className="px-6 py-6 space-y-8">
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-1">
                    <p className="text-[13px] text-[var(--muted-foreground)]">
                      Full name
                    </p>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {profile.firstName} {profile.lastName}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[13px] text-[var(--muted-foreground)]">
                      Email address
                    </p>
                    <a href={`mailto:${profile.email}`} className="text-sm font-medium text-blue-500 hover:underline">
                      {profile.email}
                    </a>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[13px] text-[var(--muted-foreground)]">
                      Mobile number
                    </p>
                    <p className="text-sm text-[var(--foreground)]">
                      {profile.mobileNumber || "Not provided"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[13px] text-[var(--muted-foreground)]">
                      Timezone
                    </p>
                    <p className="text-sm text-[var(--foreground)]">
                      {profile.timezone || "Not set"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                  About
                </h3>
                {profile.bio ? (
                  <div className="text-[var(--foreground)] text-[14.5px] leading-relaxed bg-[var(--muted)]/50 rounded-lg p-5 border border-[var(--border)]">
                    {profile.bio}
                  </div>
                ) : (
                  <div className="text-[var(--muted-foreground)] text-sm italic">
                    No bio provided
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}