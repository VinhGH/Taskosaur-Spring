import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/auth-context";
import AuthRedirect from "@/components/auth/AuthRedirect";
import { ModeToggle } from "@/components/header/ModeToggle";
import { RegisterContent } from "@/components/register/RegisterContent";
import { RegisterForm } from "@/components/register/RegisterForm";
import api from "@/lib/api";

export default function SignUpPage() {
  const { checkOrganizationAndRedirect } = useAuth();
  const router = useRouter();
  const [registrationAllowed, setRegistrationAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    api.get("/auth/registration-status")
      .then((res) => {
        if (res.data?.enabled === false) {
          router.replace("/login");
        } else {
          setRegistrationAllowed(true);
        }
      })
      .catch(() => setRegistrationAllowed(true));
  }, [router]);

  const redirectTo = async () => {
    return await checkOrganizationAndRedirect();
  };

  if (registrationAllowed === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--border)] border-t-[var(--primary)]" />
      </div>
    );
  }

  return (
    <AuthRedirect redirectTo={redirectTo}>
      <div className="signup-container">
        {/* Left Content Section - Exactly 50% */}
        <div className="signup-content-panel">
          <RegisterContent />
        </div>
        <div className="login-form-mode-toggle">
          <ModeToggle />
        </div>
        {/* Right Form Section - Exactly 50% */}
        <div className="signup-form-panel">
          <div className="signup-form-wrapper">
            <RegisterForm />
          </div>
        </div>
      </div>
    </AuthRedirect>
  );
}
