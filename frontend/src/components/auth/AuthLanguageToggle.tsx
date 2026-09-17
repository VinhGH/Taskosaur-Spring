"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "vi", label: "VI", name: "Tiếng Việt" },
  { code: "ja", label: "JA", name: "日本語" },
  { code: "es", label: "ES", name: "Español" },
  { code: "fr", label: "FR", name: "Français" },
  { code: "de", label: "DE", name: "Deutsch" },
  { code: "pt", label: "PT", name: "Português" },
];

export function AuthLanguageToggle() {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentLangCode = (i18n.language || "en").split("-")[0];
  const currentLang = LANGUAGES.find((l) => l.code === currentLangCode) || LANGUAGES[0];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    try {
      localStorage.setItem("i18nextLng", code);
    } catch {}
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-2.5 flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 transition-colors"
          aria-label="Select language"
        >
          <Globe className="w-3.5 h-3.5 opacity-70" />
          <span>{currentLang.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 bg-[var(--popover)] border-[var(--border)] p-1">
        {LANGUAGES.map((lang) => {
          const isSelected = lang.code === currentLangCode;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="flex items-center justify-between text-xs py-1.5 px-2 cursor-pointer rounded-md font-medium"
            >
              <span>{lang.name}</span>
              {isSelected && <Check className="w-3.5 h-3.5 text-[var(--primary)]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
