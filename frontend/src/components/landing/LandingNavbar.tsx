import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { ModeToggle } from "@/components/header/ModeToggle";
import { LanguageToggle } from "@/components/header/LanguageToggle";
import { Button } from "@/components/ui/button";
import { HiMenu, HiX, HiSparkles, HiArrowRight } from "react-icons/hi";

export function LandingNavbar() {
  const { t } = useTranslation("landing");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: t("nav.features", "Tính năng"), href: "#features" },
    { name: t("nav.ai_era", "Kỷ nguyên AI"), href: "#ai-era" },
    { name: t("nav.solutions", "Quy trình Agile"), href: "#solutions" },
    { name: t("nav.social_proof", "Khách hàng"), href: "#social-proof" },
    { name: t("nav.pricing", "Bảng giá"), href: "#pricing" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 dark:bg-[#0c0f1d]/85 backdrop-blur-xl border-b border-black/5 dark:border-white/10 shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
            <Image
              src="/taskosaur-logo.svg"
              alt="Taskosaur Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700 dark:from-white dark:via-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
              Taskosaur
            </span>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase -mt-1 flex items-center gap-1">
              <HiSparkles className="size-2.5" /> AI Agile Platform
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <LanguageToggle />
          <ModeToggle />

          <Link href="/login">
            <Button
              variant="ghost"
              className="text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800/60 rounded-lg px-4 cursor-pointer"
            >
              {t("nav.login", "Đăng nhập")}
            </Button>
          </Link>

          <Link href="/register">
            <Button className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 px-5 flex items-center gap-2 group cursor-pointer">
              <span>{t("nav.get_started", "Bắt đầu miễn phí")}</span>
              <HiArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex sm:hidden items-center gap-2">
          <LanguageToggle />
          <ModeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2"
          >
            {mobileMenuOpen ? <HiX className="size-6" /> : <HiMenu className="size-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white/95 dark:bg-[#0c0f1d]/95 backdrop-blur-2xl border-b border-zinc-200 dark:border-zinc-800 px-6 py-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-zinc-700 dark:text-zinc-200 py-1"
              >
                {link.name}
              </a>
            ))}
          </nav>
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full justify-center">
                {t("nav.login", "Đăng nhập")}
              </Button>
            </Link>
            <Link href="/register" className="w-full">
              <Button className="w-full justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
                {t("nav.get_started", "Bắt đầu miễn phí")}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
