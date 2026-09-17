import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Sparkles,
  Menu,
  X,
  Search,
  Check,
  Zap,
  Github,
  GitPullRequest,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
  Terminal,
  Activity,
  ArrowUpRight,
} from "lucide-react";

// =============================================================================
// Shared Primitives
// =============================================================================

export function TaskosaurLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Image
        src="/taskosaur-logo.svg"
        alt="Taskosaur Logo"
        width={28}
        height={28}
        className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(0,210,255,0.4)]"
      />
    </div>
  );
}

export function PrimaryActionButton({
  label = "Khám phá Taskosaur",
  href = "/register",
  full = false,
  className = "",
}: {
  label?: string;
  href?: string;
  full?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-2.5 rounded-full bg-white text-black font-medium text-sm px-6 py-3 transition-all hover:bg-white/90 active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.2)] ${
        full ? "w-full" : ""
      } ${className}`}
    >
      <Sparkles className="w-4 h-4 text-sky-600 transition-transform group-hover:rotate-12 duration-300" />
      <span>{label}</span>
      <ChevronRight className="w-4 h-4 text-black/60 transition-transform duration-200 group-hover:translate-x-1" />
    </Link>
  );
}

export function SectionEyebrow({
  label,
  tag,
}: {
  label: string;
  tag?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2.5 mb-4">
      <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] shadow-[0_0_8px_#00d2ff]" />
      <span className="text-xs uppercase tracking-widest text-white/70 font-semibold">
        {label}
      </span>
      {tag && (
        <span className="px-2.5 py-0.5 rounded-full border border-white/15 bg-white/[0.04] text-white/60 text-[11px] font-medium">
          {tag}
        </span>
      )}
    </div>
  );
}

const shinyGradientStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, #091020 0%, #0B2551 12.5%, #A4F4FD 32.5%, #00d2ff 50%, #0B2551 67.5%, #091020 87.5%, #091020 100%)",
  backgroundSize: "200% auto",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
  filter: "url(#c3-noise)",
};

// =============================================================================
// Main Cinematic Landing Page
// =============================================================================

export function TaskosaurCinematicLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricingYearly, setPricingYearly] = useState(false);
  const [activeMockupTab, setActiveMockupTab] = useState<"tasks" | "ai" | "workspace">("tasks");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }) +
          " " +
          now.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white selection:bg-[#3D81E3]/30 font-sans">
      {/* -----------------------------------------------------------------------
          Global SVG noise filters
          ----------------------------------------------------------------------- */}
      <svg className="hidden">
        <filter id="c3-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
        </filter>
      </svg>

      {/* -----------------------------------------------------------------------
          Fixed Fullscreen Looping Video Background
          ----------------------------------------------------------------------- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover pointer-events-none opacity-40 md:opacity-50"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4"
        />
        {/* Cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c0c]/80 via-[#0c0c0c]/60 to-[#0c0c0c] pointer-events-none" />
      </div>

      {/* Vertical guide lines (hidden on mobile, visible on md+) */}
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 -translate-x-[calc(50%+36rem)] w-px bg-white/10 z-[5]" />
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 translate-x-[calc(-50%+36rem)] w-px bg-white/10 z-[5]" />

      {/* =======================================================================
          Section 1: Navbar
          ======================================================================= */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-30 max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-4 flex items-center justify-between"
      >
        {/* Left: Taskosaur Logo Mark */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl liquid-glass p-2 flex items-center justify-center transition-transform group-hover:scale-105">
            <TaskosaurLogo className="w-6 h-6" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Taskosaur
          </span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Tính năng", href: "#features" },
            { label: "AI Execution", href: "#cockpit" },
            { label: "Đồng bộ GitHub", href: "#github-sync" },
            { label: "Bảng giá", href: "#pricing" },
            { label: "Tài liệu", href: "/admin/config" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
            >
              <Link
                href={item.href}
                className="text-white/70 text-sm font-medium hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Right Desktop: Login + Primary Action Button */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-white/70 text-sm font-medium hover:text-white px-3 py-1.5 transition-colors"
          >
            Đăng nhập
          </Link>
          <PrimaryActionButton label="Bắt đầu ngay" href="/register" />
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/80 hover:text-white active:scale-95"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Drawer Navigation Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden relative z-20 mx-4 mt-2 liquid-glass rounded-2xl p-6 space-y-4 border border-white/15"
          >
            <div className="flex flex-col gap-3">
              <Link
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/80 text-base font-medium py-2 border-b border-white/10"
              >
                Tính năng cốt lõi
              </Link>
              <Link
                href="#cockpit"
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/80 text-base font-medium py-2 border-b border-white/10"
              >
                AI Task Execution
              </Link>
              <Link
                href="#github-sync"
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/80 text-base font-medium py-2 border-b border-white/10"
              >
                Đồng bộ GitHub
              </Link>
              <Link
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/80 text-base font-medium py-2 border-b border-white/10"
              >
                Bảng giá dịch vụ
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/80 text-base font-medium py-2"
              >
                Đăng nhập tài khoản
              </Link>
            </div>
            <PrimaryActionButton full label="Trải nghiệm miễn phí" href="/register" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* =======================================================================
          Section 2: Hero Section
          ======================================================================= */}
      <section className="relative z-10 pt-16 sm:pt-20 md:pt-28 pb-16 md:pb-24 text-center flex flex-col items-center px-4 sm:px-6">
        {/* Eyebrow Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass border border-white/15 text-xs text-white/80 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">Taskosaur v1.2.0</span>
          <span className="text-white/40">•</span>
          <span className="text-[#A4F4FD]">Autonomous AI Task Execution</span>
        </motion.div>

        {/* Cinematic Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-[1.02] max-w-5xl"
        >
          <span className="block text-white">Dự án của bạn.</span>
          <span className="block animate-shiny pb-2" style={shinyGradientStyle}>
            Tự động hoá với AI.
          </span>
        </motion.h1>

        {/* Paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-6 sm:mt-8 text-white/70 max-w-xl text-base sm:text-lg leading-relaxed px-4"
        >
          Taskosaur là nền tảng quản trị dự án Agile thế hệ mới với trợ lý AI đàm thoại tự động lập kế hoạch Sprint, chia nhỏ tác vụ và đồng bộ GitHub Issues theo thời gian thực.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto px-4"
        >
          <PrimaryActionButton
            label="Khởi động Taskosaur miễn phí"
            href="/register"
            className="w-full sm:w-auto"
          />
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/20 text-white text-sm font-medium px-6 py-3 hover:bg-white/10 active:scale-[0.98] transition-all"
          >
            <span>Trải nghiệm Demo</span>
            <ArrowUpRight className="w-4 h-4 text-white/60" />
          </Link>
        </motion.div>

        {/* Tech Stack Subtext */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-4 text-xs text-white/40 flex items-center gap-2"
        >
          <span>Java 25 Spring Boot</span>
          <span>•</span>
          <span>Next.js 16</span>
          <span>•</span>
          <span>PostgreSQL & Redis</span>
        </motion.div>
      </section>

      {/* =======================================================================
          Section 3: macOS Menu Bar Strip
          ======================================================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="relative z-10 w-full h-10 bg-black/50 backdrop-blur-md border-t border-b border-white/10"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between text-xs">
          {/* Left: Taskosaur logo + App name + Menu actions */}
          <div className="flex items-center gap-3 sm:gap-5">
            <TaskosaurLogo className="w-3.5 h-3.5" />
            <span className="font-bold text-white tracking-tight">Taskosaur</span>
            <div className="hidden sm:flex items-center gap-4 text-white/60">
              <span className="hover:text-white cursor-pointer transition-colors">Workspace</span>
              <span className="hover:text-white cursor-pointer transition-colors">Sprint</span>
              <span className="hidden md:inline hover:text-white cursor-pointer transition-colors">AI Execution</span>
              <span className="hidden md:inline hover:text-white cursor-pointer transition-colors">GitHub Sync</span>
              <span className="hidden lg:inline hover:text-white cursor-pointer transition-colors">Kanban</span>
            </div>
          </div>

          {/* Right: STOMP WebSocket Live indicator + Clock */}
          <div className="flex items-center gap-3 text-white/60">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="hidden sm:inline">STOMP Live</span>
            </div>
            <span className="text-white/20">|</span>
            <span className="font-mono text-[11px]">{currentTime || "Wed 10:45 AM"}</span>
          </div>
        </div>
      </motion.div>

      {/* =======================================================================
          Section 4: Realistic Taskosaur Workspace & AI Cockpit Mockup
          ======================================================================= */}
      <section id="cockpit" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative rounded-2xl overflow-hidden border border-white/15 bg-[#0e1014]/95 backdrop-blur-2xl shadow-2xl"
        >
          {/* Window Title Bar */}
          <div className="h-11 px-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57] border border-black/20" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e] border border-black/20" />
              <span className="w-3 h-3 rounded-full bg-[#28c840] border border-black/20" />
            </div>
            <div className="text-xs text-white/50 font-mono flex items-center gap-2">
              <FolderGit2 className="w-3.5 h-3.5 text-[#00d2ff]" />
              <span>taskosaur / core-platform • Sprint 24</span>
            </div>
            <div className="w-14" /> {/* Spacer */}
          </div>

          {/* Mobile Tab Switcher (Visible on small screens) */}
          <div className="md:hidden flex border-b border-white/10 bg-black/20 p-1.5 text-xs font-medium">
            <button
              onClick={() => setActiveMockupTab("tasks")}
              className={`flex-1 py-1.5 rounded-md transition-colors ${
                activeMockupTab === "tasks" ? "bg-white/15 text-white" : "text-white/60"
              }`}
            >
              📋 Tác vụ (6)
            </button>
            <button
              onClick={() => setActiveMockupTab("ai")}
              className={`flex-1 py-1.5 rounded-md transition-colors ${
                activeMockupTab === "ai" ? "bg-white/15 text-white" : "text-white/60"
              }`}
            >
              🤖 AI Inspector
            </button>
            <button
              onClick={() => setActiveMockupTab("workspace")}
              className={`flex-1 py-1.5 rounded-md transition-colors ${
                activeMockupTab === "workspace" ? "bg-white/15 text-white" : "text-white/60"
              }`}
            >
              ⚡ Dự án
            </button>
          </div>

          {/* Body Cockpit Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[520px]">
            {/* 1. Left Sidebar Navigation */}
            <div
              className={`md:col-span-3 border-r border-white/10 bg-black/30 p-4 flex flex-col justify-between ${
                activeMockupTab === "workspace" ? "block" : "hidden md:flex"
              }`}
            >
              <div className="space-y-4">
                {/* AI Action Button */}
                <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-white text-black text-xs font-semibold px-3 py-2.5 shadow-md hover:bg-white/90 transition-all">
                  <Sparkles className="w-3.5 h-3.5 text-[#3D81E3]" />
                  <span>Tạo Task bằng AI</span>
                </button>

                {/* Main Nav Items */}
                <div className="space-y-1">
                  {[
                    { label: "Active Sprint", count: "6", active: true },
                    { label: "Kanban Board", count: "18" },
                    { label: "AI Co-pilot Chat", badge: "Live" },
                    { label: "Đồng bộ GitHub", badge: "Sync" },
                    { label: "Thành viên dự án", count: "8" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        item.active
                          ? "bg-white/10 text-white"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.count && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/80">
                          {item.count}
                        </span>
                      )}
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00d2ff]/20 text-[#00d2ff] font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Statuses Group */}
                <div className="pt-3 border-t border-white/10">
                  <span className="text-[10px] font-semibold text-white/40 tracking-wider uppercase">
                    Trạng thái Sprint
                  </span>
                  <div className="mt-2 space-y-1.5 text-xs text-white/70">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00d2ff]" />
                      <span>Cần làm (Todo)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#A4F4FD]" />
                      <span>Đang thực hiện</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                      <span>Đang duyệt (Review)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                      <span>Hoàn thành (Done)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Version Footer in Mockup */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
                <span>Taskosaur Client</span>
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-white/70">v1.2.0</span>
              </div>
            </div>

            {/* 2. Middle Column: Task List */}
            <div
              className={`md:col-span-4 border-r border-white/10 bg-black/10 flex flex-col ${
                activeMockupTab === "tasks" ? "block" : "hidden md:flex"
              }`}
            >
              {/* Search Bar Header */}
              <div className="p-3 border-b border-white/10">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60">
                  <Search className="w-3.5 h-3.5 text-white/40" />
                  <input
                    type="text"
                    readOnly
                    value="Tìm kiếm sprint, tác vụ..."
                    className="bg-transparent border-none outline-none text-white/70 text-xs w-full"
                  />
                </div>
              </div>

              {/* Task Items */}
              <div className="divide-y divide-white/5 overflow-y-auto max-h-[460px]">
                {[
                  {
                    id: "TS-104",
                    title: "Đồng bộ GitHub Issue hai chiều",
                    desc: "Tích hợp wizard 3 bước và tự động ánh xạ trạng thái sang Kanban...",
                    time: "9:41 AM",
                    active: true,
                    priority: "High",
                    status: "In Progress",
                  },
                  {
                    id: "TS-102",
                    title: "Tối ưu bộ nhớ Spring Boot 25",
                    desc: "Cấu hình JVM flags và tối ưu hóa tiến trình Docker alpine...",
                    time: "8:12 AM",
                    priority: "Critical",
                    status: "Review",
                  },
                  {
                    id: "TS-098",
                    title: "STOMP WebSocket Real-Time Sync",
                    desc: "Cập nhật kéo thả Kanban tức thời giữa các clients không cần F5...",
                    time: "Hôm qua",
                    priority: "Medium",
                    status: "Done",
                  },
                  {
                    id: "TS-095",
                    title: "AI Task Breakdown BYOK Engine",
                    desc: "Tự động phân tách task lớn thành 5 subtasks kèm checklist...",
                    time: "Hôm qua",
                    priority: "High",
                    status: "Done",
                  },
                  {
                    id: "TS-089",
                    title: "Chế độ Darkmode & Classic Toggle",
                    desc: "Cải thiện độ tương phản giao diện và button tìm kiếm chuẩn WCAG...",
                    time: "T2",
                    priority: "Normal",
                    status: "Done",
                  },
                ].map((task) => (
                  <div
                    key={task.id}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      task.active
                        ? "bg-white/10 border-l-2 border-[#00d2ff]"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-mono text-[#A4F4FD] font-semibold">{task.id}</span>
                      <span className="text-white/40">{task.time}</span>
                    </div>
                    <div className="font-medium text-xs text-white tracking-tight">{task.title}</div>
                    <p className="text-[11px] text-white/50 line-clamp-1 mt-1">{task.desc}</p>
                    <div className="mt-2 flex items-center gap-2 text-[10px]">
                      <span
                        className={`px-1.5 py-0.5 rounded font-medium ${
                          task.priority === "Critical"
                            ? "bg-rose-500/20 text-rose-300"
                            : task.priority === "High"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span className="text-white/40">{task.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Right Column: AI Task Execution Inspector */}
            <div
              className={`md:col-span-5 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto max-h-[520px] ${
                activeMockupTab === "ai" ? "block" : "hidden md:flex"
              }`}
            >
              <div className="space-y-4">
                {/* Header Info */}
                <div className="flex items-start justify-between pb-3 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-sky-500/20 text-[#A4F4FD] text-[10px] font-mono font-semibold">
                        TS-104
                      </span>
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-medium">
                        GitHub Sync #482
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                      Đồng bộ GitHub Issue hai chiều vào Sprint
                    </h3>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00d2ff] to-[#0B2551] flex items-center justify-center text-xs font-bold text-white shadow-md">
                    V
                  </div>
                </div>

                {/* Autonomous AI Reasoning Card */}
                <div className="liquid-glass rounded-xl p-4 border border-[#A4F4FD]/30 bg-gradient-to-b from-[#A4F4FD]/5 to-transparent space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#00d2ff]" />
                      <span className="text-xs font-semibold text-white">
                        Trợ lý AI Task Execution
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Tự động hoá
                    </span>
                  </div>

                  {/* Multi-step Live Reasoning Stepper */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-white/90">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Bước 1: Trích xuất GitHub Issue #482 và nhãn liên quan</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Bước 2: Tự động phân rã 3 subtasks kiến trúc (Controller, Migration, UI)</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#00d2ff] font-medium">
                      <Zap className="w-3.5 h-3.5 text-[#00d2ff] animate-bounce shrink-0" />
                      <span>Bước 3: Phát sóng WebSocket STOMP đồng bộ Kanban tức thì</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-white/60 leading-relaxed pt-2 border-t border-white/10">
                    AI đã hoàn thành phân tích độ phức tạp (Story Points: 5). Kế hoạch Sprint sẵn sàng cho review.
                  </p>
                </div>

                {/* Task Details & Git Branch Integration */}
                <div className="space-y-2 text-xs text-white/70">
                  <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                    <span className="text-white/40">Nhánh Git:</span>
                    <span className="font-mono text-[#A4F4FD] text-[11px]">feat/github-sync-v1.2</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                    <span className="text-white/40">Người phụ trách:</span>
                    <span className="text-white font-medium">VinhGH (Tech Lead)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-white/40">Sprint:</span>
                    <span className="text-white">Sprint 24 (Deadline: 3 ngày)</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-white/40">Cập nhật 2 phút trước</span>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Xác nhận Kế hoạch</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* =======================================================================
          Section 5: Feature Triage (AI Task Triage)
          ======================================================================= */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-28">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
          {/* Left Column: Descriptions & Chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <SectionEyebrow label="AI Triage" tag="AI-native" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05] text-white">
              Tối ưu Backlog <br className="hidden sm:inline" />
              chỉ trong một lần chạm.
            </h2>
            <p className="mt-5 text-white/65 text-base sm:text-lg leading-relaxed max-w-md">
              Taskosaur tự động đọc yêu cầu, phân tích mục tiêu kỹ thuật và điều phối công việc vào đúng vị trí. Đội ngũ của bạn chỉ cần tập trung tạo ra giá trị — mọi thao tác quản trị phức tạp đã có AI lo.
            </p>

            {/* Feature Chips */}
            <div className="mt-8 flex flex-wrap gap-2.5">
              {[
                "Tự động phân loại",
                "Ánh xạ GitHub Issue",
                "Phân rã subtask tức thì",
                "Đồng bộ STOMP",
                "Ước tính Story Points",
              ].map((chip) => (
                <span
                  key={chip}
                  className="text-xs text-white/80 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm"
                >
                  {chip}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Liquid-Glass Triage Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="liquid-glass rounded-2xl p-5 sm:p-6 border border-white/15"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <span className="text-xs font-semibold text-white/70">
                Hôm nay • 38 tác vụ đã xử lý tự động
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>

            {/* Sub-cards */}
            <div className="space-y-3">
              {[
                {
                  title: "Ưu tiên cao (Priority)",
                  count: 4,
                  items: "TS-104: Đồng bộ GitHub • TS-105: Vá bảo mật OIDC",
                  dotColor: "#ffffff",
                },
                {
                  title: "Đang xử lý (In Progress)",
                  count: 6,
                  items: "TS-102: Tuning JVM • TS-103: Dynamic Versioning",
                  dotColor: "#00d2ff",
                },
                {
                  title: "Chờ Review (Under Review)",
                  count: 12,
                  items: "TS-098: STOMP broadcast • TS-099: Prisma migration",
                  dotColor: "#A4F4FD",
                },
                {
                  title: "Hoàn tất (Completed)",
                  count: 16,
                  items: "TS-095: AI Breakdown • TS-089: Darkmode Switcher",
                  dotColor: "#10b981",
                },
              ].map((sub) => (
                <div
                  key={sub.title}
                  className="liquid-glass rounded-xl p-3.5 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: sub.dotColor }}
                      />
                      <span>{sub.title}</span>
                    </div>
                    <span className="text-white/60 font-mono">({sub.count})</span>
                  </div>
                  <p className="text-[11px] text-white/50">{sub.items}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* =======================================================================
          Section 6: LogoCloud (Tech Stack Ecosystem)
          ======================================================================= */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="text-center">
          <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">
            Được xây dựng trên những công nghệ mã nguồn mở hàng đầu thế giới
          </span>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 sm:gap-6 items-center">
            {[
              "GitHub",
              "Spring Boot",
              "Next.js 16",
              "PostgreSQL",
              "Redis",
              "Docker",
              "TypeScript",
              "Tailwind",
            ].map((tech) => (
              <div
                key={tech}
                className="liquid-glass rounded-xl py-3 px-2 text-center text-xs font-semibold text-white/60 hover:text-white border border-white/10 transition-colors"
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =======================================================================
          Section 7: Testimonials
          ======================================================================= */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 border-t border-white/10">
        <div className="text-center max-w-xl mx-auto mb-12">
          <SectionEyebrow label="Khách hàng nói gì" />
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            Được tin dùng bởi các kỹ sư hàng đầu
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote:
                "Taskosaur giúp đội ngũ kỹ thuật của chúng tôi tiết kiệm hơn 4 giờ mỗi tuần trong khâu lập kế hoạch. Khả năng AI thực thi tác vụ trực tiếp mang lại trải nghiệm như đến từ tương lai.",
              author: "Đức Nguyễn",
              role: "Head of Engineering",
              company: "TECHCORP",
            },
            {
              quote:
                "Tính năng đồng bộ GitHub hai chiều kết hợp bảng Kanban WebSocket thời gian thực hoạt động mượt mà ấn tượng. Chúng tôi đã ship Sprint 24 sớm 2 ngày trước deadline.",
              author: "Minh Trần",
              role: "Lead Software Architect",
              company: "FINSCALE",
            },
            {
              quote:
                "Khả năng tự động phân tách tác vụ kỹ thuật chuẩn xác theo ngữ cảnh hệ thống giúp các buổi Sprint Retro và Daily Scrum diễn ra hiệu quả vượt bậc.",
              author: "Sarah Jenkins",
              role: "Senior Product Manager",
              company: "DEVSTREAM",
            },
          ].map((item, idx) => (
            <motion.figure
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="liquid-glass rounded-2xl p-6 border border-white/10 flex flex-col justify-between"
            >
              <blockquote className="text-sm text-white/80 leading-relaxed italic">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 pt-4 border-t border-white/10">
                <div className="text-sm font-semibold text-white">{item.author}</div>
                <div className="text-xs text-white/50">{item.role}</div>
                <div className="text-xs text-[#00d2ff] font-semibold tracking-wider mt-0.5 uppercase">
                  {item.company}
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </section>

      {/* =======================================================================
          Section 8: Cinematic Pricing Section
          ======================================================================= */}
      <section id="pricing" className="c3-pricing-section relative z-10">
        {/* Dedicated SVG noise filter for pricing */}
        <svg className="hidden">
          <filter id="c3-noise-pricing">
            <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves={2} stitchTiles="stitch" />
            <feComponentTransfer>
              <feFuncA type="linear" slope={0.075} />
            </feComponentTransfer>
            <feComposite in2="SourceGraphic" operator="in" result="noise" />
            <feBlend in="SourceGraphic" in2="noise" mode="overlay" />
          </filter>
        </svg>

        {/* Giant Watermark Headline */}
        <div className="c3-watermark-container">
          <div className="c3-watermark-main">
            <span className="c3-watermark-line-1">Dự án của bạn.</span>
            <span className="c3-watermark-line-2">Autonomous</span>
          </div>
        </div>

        {/* Yearly / Monthly Toggle Wrap */}
        <div className="c3-toggle-wrap">
          <span className="text-xs font-medium text-white/70">Thanh toán theo năm (Tiết kiệm 20%)</span>
          <button
            onClick={() => setPricingYearly(!pricingYearly)}
            className={`c3-toggle ${pricingYearly ? "active" : ""}`}
            aria-label="Toggle billing frequency"
          >
            <span className="c3-toggle-knob" />
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div className="c3-grid">
          {/* Plan 1: Community / Open Source */}
          <div className="c3-card">
            <span className="c3-tier-small">Community (Tự host)</span>
            <span className="c3-tier-large">Miễn phí</span>
            <p className="c3-desc">
              Dành cho lập trình viên và nhóm khởi nghiệp muốn triển khai Taskosaur qua Docker trên hạ tầng riêng.
            </p>
            <ul className="c3-list">
              <li>
                <span className="c3-check">
                  <Check className="w-3.5 h-3.5 text-white" />
                </span>
                <span>Tự host không giới hạn dự án & người dùng</span>
              </li>
              <li>
                <span className="c3-check">
                  <Check className="w-3.5 h-3.5 text-white" />
                </span>
                <span>Đồng bộ GitHub Issue một chiều</span>
              </li>
              <li>
                <span className="c3-check">
                  <Check className="w-3.5 h-3.5 text-white" />
                </span>
                <span>Bảng Kanban STOMP thời gian thực</span>
              </li>
              <li>
                <span className="c3-check">
                  <Check className="w-3.5 h-3.5 text-white" />
                </span>
                <span>Cộng đồng hỗ trợ mã nguồn mở</span>
              </li>
            </ul>
            <Link href="/register" className="c3-btn">
              Triển khai ngay
            </Link>
          </div>

          {/* Plan 2: Pro / Team */}
          <div className="c3-card">
            <span className="c3-tier-small">Team Pro</span>
            <span className="c3-tier-large">
              {pricingYearly ? "$99,99/năm" : "$9,99/tháng"}
            </span>
            <p className="c3-desc">
              Dành cho các đội nhóm phát triển sản phẩm linh hoạt cần môi trường quản lý điện toán đám mây trọn gói.
            </p>
            <ul className="c3-list">
              <li>
                <span className="c3-check">
                  <Check className="w-3.5 h-3.5 text-white" />
                </span>
                <span>Tối đa 25 thành viên cộng tác</span>
              </li>
              <li>
                <span className="c3-check">
                  <Check className="w-3.5 h-3.5 text-white" />
                </span>
                <span>Đồng bộ GitHub hai chiều tự động</span>
              </li>
              <li>
                <span className="c3-check">
                  <Check className="w-3.5 h-3.5 text-white" />
                </span>
                <span>Tích hợp khoá AI riêng (BYOK OpenAI & Anthropic)</span>
              </li>
              <li>
                <span className="c3-check">
                  <Check className="w-3.5 h-3.5 text-white" />
                </span>
                <span>Lập kế hoạch Sprint & phân rã tác vụ AI</span>
              </li>
            </ul>
            <Link href="/register" className="c3-btn">
              Bắt đầu dùng thử
            </Link>
          </div>

          {/* Plan 3: Enterprise */}
          <div className="c3-card c3-card-pro">
            <span className="c3-tier-small text-[#A4F4FD]">Enterprise Cloud</span>
            <span className="c3-tier-large">
              {pricingYearly ? "$199,99/năm" : "$19,99/tháng"}
            </span>
            <p className="c3-desc">
              Dành cho các doanh nghiệp và tập đoàn công nghệ với yêu cầu bảo mật, OIDC SSO và cam kết SLA cao nhất.
            </p>
            <ul className="c3-list">
              <li>
                <span className="c3-check bg-[#00d2ff]/30">
                  <Check className="w-3.5 h-3.5 text-[#A4F4FD]" />
                </span>
                <span>Thành viên và không gian làm việc không giới hạn</span>
              </li>
              <li>
                <span className="c3-check bg-[#00d2ff]/30">
                  <Check className="w-3.5 h-3.5 text-[#A4F4FD]" />
                </span>
                <span>Bảo mật Single Sign-On (OIDC & SAML SSO)</span>
              </li>
              <li>
                <span className="c3-check bg-[#00d2ff]/30">
                  <Check className="w-3.5 h-3.5 text-[#A4F4FD]" />
                </span>
                <span>Trợ lý Autonomous AI Agent thực thi chuyên sâu</span>
              </li>
              <li>
                <span className="c3-check bg-[#00d2ff]/30">
                  <Check className="w-3.5 h-3.5 text-[#A4F4FD]" />
                </span>
                <span>Hỗ trợ kỹ thuật 24/7 với cam kết SLA 99.9%</span>
              </li>
            </ul>
            <Link href="/register" className="c3-btn bg-white text-black hover:bg-zinc-100">
              Liên hệ Enterprise
            </Link>
          </div>
        </div>
      </section>

      {/* =======================================================================
          Section 9: Final CTA
          ======================================================================= */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-32">
        <div className="liquid-glass relative overflow-hidden rounded-3xl px-6 sm:px-12 py-16 md:py-24 text-center border border-white/20">
          {/* Radial glow overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(600px circle at 50% 0%, rgba(0, 210, 255, 0.2), transparent 70%)",
            }}
          />

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-white max-w-2xl mx-auto">
            Khép lại sự hỗn loạn. <br />
            Bứt phá tốc độ Sprint.
          </h2>
          <p className="mt-6 text-white/70 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
            Gia nhập cùng hàng ngàn kỹ sư và nhà sáng lập biến quy trình quản lý dự án thành đòn bẩy tăng trưởng — không còn là gánh nặng hành chính.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <PrimaryActionButton label="Bắt đầu với Taskosaur" href="/register" />
            <Link
              href="https://github.com/VinhGH/Taskosaur-Spring"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 text-white text-sm font-medium px-6 py-3 hover:bg-white/10 active:scale-[0.98] transition-all"
            >
              <Github className="w-4 h-4" />
              <span>Xem trên GitHub</span>
              <ChevronRight className="w-4 h-4 text-white/50" />
            </Link>
          </div>
        </div>
      </section>

      {/* =======================================================================
          Footer
          ======================================================================= */}
      <footer className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-white/50">
        <div className="flex items-center gap-3">
          <TaskosaurLogo className="w-5 h-5" />
          <span className="font-semibold text-white">Taskosaur</span>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70 font-mono">
            v1.2.0
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/terms-of-service" className="hover:text-white transition-colors">
            Điều khoản dịch vụ
          </Link>
          <Link href="/privacy-policy" className="hover:text-white transition-colors">
            Chính sách bảo mật
          </Link>
          <Link
            href="https://github.com/VinhGH/Taskosaur-Spring"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </Link>
        </div>
        <div>© 2026 Taskosaur Platform. All rights reserved.</div>
      </footer>
    </div>
  );
}

export default TaskosaurCinematicLanding;
