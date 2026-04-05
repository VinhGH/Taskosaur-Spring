import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { authApi } from "@/utils/api/authApi";

export default function SetupChecker({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "ready" | "redirecting">("checking");
  const router = useRouter();

  useEffect(() => {
    const checkSetupStatus = async () => {
      // Skip setup check on routes that don't need it
      const skipRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/terms-of-service", "/privacy-policy", "/public/"];
      const shouldSkip = skipRoutes.some(route => router.pathname.startsWith(route));

      if (shouldSkip) {
        setStatus("ready");
        return;
      }

      // Already on setup page — just render it
      if (router.pathname === "/setup") {
        setStatus("ready");
        return;
      }

      try {
        const { exists } = await authApi.checkUsersExist();
        if (!exists) {
          // No users exist — redirect to setup
          setStatus("redirecting");
          router.replace("/setup");
          return;
        }
      } catch (error) {
        // API failed — could be fresh install with DB issues
        // Try the dedicated setup check endpoint as fallback
        try {
          const setupStatus = await authApi.checkSetupStatus();
          if (setupStatus?.required) {
            setStatus("redirecting");
            router.replace("/setup");
            return;
          }
        } catch {
          // Both checks failed — assume setup is needed if no auth token exists
          const hasToken = typeof window !== "undefined" && (
            localStorage.getItem("access_token") ||
            document.cookie.includes("access_token")
          );
          if (!hasToken) {
            setStatus("redirecting");
            router.replace("/setup");
            return;
          }
        }
      }

      setStatus("ready");
    };

    checkSetupStatus();
  }, [router.pathname]);

  if (status !== "ready") {
    return (
      <div className="setup-checker-loading-container">
        <div className="setup-checker-loading-content">
          <div className="setup-checker-loading-spinner"></div>
          <p className="setup-checker-loading-text">Checking system status...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
