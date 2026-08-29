import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import {
  HiArrowRight,
  HiSparkles,
  HiCheckCircle,
  HiLightningBolt,
  HiClock,
  HiUserGroup,
} from "react-icons/hi";
import {
  SiNextdotjs,
  SiSpringboot,
  SiPostgresql,
  SiRedis,
  SiDocker,
  SiTypescript,
  SiTailwindcss,
} from "react-icons/si";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { InteractiveParticleCanvas } from "./InteractiveParticleCanvas";

export function LandingHero() {
  const { t } = useTranslation("landing");
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      router.push(`/register?email=${encodeURIComponent(email)}`);
    } else {
      router.push("/register");
    }
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* 🌟 Interactive Canvas Particle Field */}
      <InteractiveParticleCanvas
        dotSpacing={30}
        repelRadius={160}
        repelStrength={14}
        maxDotSize={2.4}
        className="opacity-60 dark:opacity-80"
      />

      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-blue-500/25 via-indigo-500/20 to-purple-500/25 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Hero Header */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider animate-in fade-in slide-in-from-bottom-2 duration-500">
            <HiSparkles className="size-3.5 text-blue-500 animate-pulse" />
            <span>{t("hero.badge", "Taskosaur 2.0 • Trợ lý AI thực thi tác vụ thế hệ mới")}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.15]">
            {t("hero.title_part1", "Turn plans into")}{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              {t("hero.title_part2", "agent-ready tasks")}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            {t(
              "hero.subtitle",
              "Nền tảng quản lý dự án Agile thế hệ mới với AI Task Execution tự động. Lập kế hoạch Sprint, theo dõi Kanban thời gian thực và giải phóng sức mạnh đội ngũ của bạn."
            )}
          </p>

          {/* Quick CTA Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2"
          >
            <input
              type="email"
              placeholder={t("hero.email_placeholder", "Nhập địa chỉ email công việc...")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full sm:flex-1 h-12 px-4 rounded-xl bg-white/90 dark:bg-[#141824]/90 border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
            />
            <Button
              type="submit"
              className="w-full sm:w-auto h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{t("hero.cta_button", "Bắt đầu ngay")}</span>
              <HiArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </form>

          {/* Small Trust Micro-copy */}
          <div className="flex items-center justify-center gap-6 text-xs text-zinc-500 dark:text-zinc-400 pt-1">
            <span className="flex items-center gap-1.5">
              <HiCheckCircle className="size-4 text-emerald-500" /> {t("hero.free_trial", "Miễn phí trải nghiệm")}
            </span>
            <span className="flex items-center gap-1.5">
              <HiCheckCircle className="size-4 text-emerald-500" /> {t("hero.no_credit_card", "Không cần thẻ tín dụng")}
            </span>
            <span className="flex items-center gap-1.5">
              <HiCheckCircle className="size-4 text-emerald-500" /> {t("hero.fast_setup", "Cài đặt trong 1 phút")}
            </span>
          </div>
        </div>

        {/* Hero Interactive Preview Mockup with Smooth Right-to-Left Slide */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 sm:mt-16 relative mx-auto max-w-5xl"
        >
          {/* Outer Framed Glass Container */}
          <div className="rounded-2xl p-2 sm:p-3 bg-gradient-to-b from-white/60 to-white/20 dark:from-white/10 dark:to-white/5 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-2xl shadow-indigo-950/20 dark:shadow-black/60">
            {/* Inner App Canvas */}
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 text-white overflow-hidden shadow-inner">
              {/* Fake Window Header */}
              <div className="h-10 bg-zinc-950/80 border-b border-zinc-800/80 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-medium text-zinc-400">
                    Taskosaur • Sprint SP01 - Bảng Kanban Trực quan
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    <HiLightningBolt className="size-3 text-amber-400" /> AI Auto-Pilot Active
                  </span>
                </div>
              </div>

              {/* Fake Kanban Board Preview */}
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-950/40">
                {/* Column 1: To Do */}
                <div className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Cần làm (To Do)
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-semibold">
                      3
                    </span>
                  </div>

                  {/* Task Card 1 */}
                  <div className="p-3 rounded-lg bg-zinc-800/70 border border-zinc-700/60 hover:border-blue-500/50 transition-all duration-200 shadow-sm space-y-2 cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        TASK-102
                      </span>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <HiClock className="size-3" /> 2d
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-200 group-hover:text-blue-300 transition-colors">
                      Tích hợp PostgreSQL & Spring Boot API
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex -space-x-1.5">
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-[10px] font-bold flex items-center justify-center ring-1 ring-zinc-900">
                          V
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-medium">Độ ưu tiên cao</span>
                    </div>
                  </div>

                  {/* Task Card 2 */}
                  <div className="p-3 rounded-lg bg-zinc-800/70 border border-zinc-700/60 hover:border-blue-500/50 transition-all duration-200 shadow-sm space-y-2 cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        TASK-104
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-200 group-hover:text-blue-300 transition-colors">
                      Cấu hình WebSockets cho Live Task Sync
                    </p>
                  </div>
                </div>

                {/* Column 2: In Progress */}
                <div className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> Đang xử lý (In Progress)
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-semibold">
                      2
                    </span>
                  </div>

                  {/* Task Card: AI Agent executing */}
                  <div className="p-3 rounded-lg bg-gradient-to-b from-blue-950/40 to-zinc-800/80 border border-blue-500/40 shadow-lg shadow-blue-500/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/30">
                        TASK-098
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 font-semibold flex items-center gap-1 animate-pulse">
                        <HiSparkles className="size-3 text-amber-400" /> AI Agent Running
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-100">
                      Tự động phân tích & Sinh Test cases cho Sprint
                    </p>
                    <div className="w-full bg-zinc-700/50 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full w-[75%] rounded-full animate-pulse" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Tiến độ: 75%</span>
                      <span className="text-cyan-400">Taskosaur Agent</span>
                    </div>
                  </div>
                </div>

                {/* Column 3: Done */}
                <div className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Hoàn thành (Done)
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-semibold">
                      5
                    </span>
                  </div>

                  {/* Task Card Done */}
                  <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/40 opacity-80 hover:opacity-100 transition-opacity space-y-2 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        TASK-085
                      </span>
                      <HiCheckCircle className="size-4 text-emerald-400" />
                    </div>
                    <p className="text-xs font-medium text-zinc-300 line-through">
                      Xây dựng giao diện phân vùng bo góc IntelliJ New UI
                    </p>
                    <span className="text-[10px] text-zinc-500">Hoàn thành hôm nay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tech Stack / Trusted-by Banner */}
        <div className="mt-16 sm:mt-20 text-center space-y-6">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            Được xây dựng trên nền tảng công nghệ mạnh mẽ & tin cậy
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-60 dark:opacity-75 grayscale hover:grayscale-0 transition-all duration-300">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold text-sm">
              <SiNextdotjs className="size-6" /> Next.js
            </div>
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold text-sm">
              <SiSpringboot className="size-6 text-emerald-500" /> Spring Boot
            </div>
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold text-sm">
              <SiPostgresql className="size-6 text-blue-500" /> PostgreSQL
            </div>
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold text-sm">
              <SiRedis className="size-6 text-red-500" /> Redis Queue
            </div>
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold text-sm">
              <SiDocker className="size-6 text-blue-400" /> Docker
            </div>
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold text-sm">
              <SiTypescript className="size-6 text-blue-600" /> TypeScript
            </div>
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold text-sm">
              <SiTailwindcss className="size-6 text-cyan-400" /> Tailwind CSS
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
