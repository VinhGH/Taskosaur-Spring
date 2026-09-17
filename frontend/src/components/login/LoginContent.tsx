import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useTranslation } from "react-i18next";

export function LoginContent() {
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation("auth");

  return (
    <div className="login-hero-container">
      {/* Main Content */}
      <div className="login-hero-content">
        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="login-brand-header"
        >
          <div>
            <div className="flex items-center">
              <Image
                src="/taskosaur-logo.svg"
                alt="Taskosaur Logo"
                width={50}
                height={50}
                className={`size-6 lg:size-10 ${resolvedTheme === "light" ? " filter invert brightness-200" : ""}`}
              />
              <h1 className="login-brand-title">Taskosaur</h1>
            </div>
          </div>

          <h2 className="login-hero-heading">
            {t("hero.login_heading_1", "Transform your")}
            <br />
            <span className="login-hero-heading-gradient">
              {t("hero.login_heading_2", "team's workflow")}
            </span>
          </h2>

          <p className="login-hero-description">
            {t(
              "hero.login_description",
              "Experience the future of project management with AI-powered tools that adapt to your team's unique workflow and boost productivity."
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
