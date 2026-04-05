import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const { getCurrentUser } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    if (user.role === "SUPER_ADMIN") {
      setAuthorized(true);
    } else {
      router.replace("/dashboard");
    }
  }, [getCurrentUser, router]);

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--border)] border-t-[var(--primary)]" />
      </div>
    );
  }

  return <>{children}</>;
}
