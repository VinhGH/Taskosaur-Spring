"use client";

import { useTranslation } from "react-i18next";
import { HiLanguage } from "react-icons/hi2";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const { getCurrentUser, updateUser } = useAuth();

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    if (typeof window !== "undefined") {
      localStorage.setItem("i18nextLng", lng);
    }
    const user = getCurrentUser();
    if (user) {
      try {
        await updateUser(user.id, { language: lng });
      } catch {
        // silent fail
      }
    }
  };

  const languages = [
    { code: "en", name: "English" },
    { code: "vi", name: "Tiếng Việt" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "pt", name: "Português" },
    { code: "de", name: "Deutsch" },
  ];

  const currentLang = i18n.language?.split("-")[0] || "en";
  const currentLanguageName = languages.find((l) => l.code === currentLang)?.name || "English";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="header-mode-toggle" title={currentLanguageName}>
          <HiLanguage className="header-mode-toggle-icon" />
          <span className="sr-only">Switch Language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[var(--popover)] border-[var(--border)]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`cursor-pointer ${currentLang === lang.code ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : ""}`}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
