"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Classic } from "@/components/ui/classic";
import Tooltip from "../common/ToolTip";

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";
  const isBrowser = typeof window !== "undefined";
  let hideThemeLabel = false;
  if (isBrowser) {
    const path = window.location.pathname;
    hideThemeLabel = path === "/login/" || path === "/register/";
  }

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Tooltip content="Toggle theme" position="bottom" color="primary">
      <Classic
        toggled={mounted ? isDark : undefined}
        onClick={handleToggle}
        aria-label="Toggle theme"
        className="header-mode-toggle inline-flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-[16px] outline-none max-[530px]:w-auto max-[530px]:px-2 max-[530px]:gap-2"
      >
        {!hideThemeLabel && (
          <span className="hidden max-[530px]:inline-block text-sm font-medium">Theme</span>
        )}
      </Classic>
    </Tooltip>
  );
}
