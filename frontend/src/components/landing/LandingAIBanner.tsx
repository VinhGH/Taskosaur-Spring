import React, { useState, useEffect } from "react";
import { HiSparkles, HiCpuChip, HiBolt, HiShieldCheck, HiArrowRight, HiCommandLine } from "react-icons/hi2";
import { SiAnthropic, SiGithubcopilot, SiOpenai } from "react-icons/si";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { InteractiveParticleCanvas } from "./InteractiveParticleCanvas";

export function LandingAIBanner() {
  const { t } = useTranslation("landing");
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const pillars = [
    {
      icon: <HiCpuChip className="size-6 text-cyan-400" />,
      title: t("ai_era.pillar1_title", "Embed agents in your existing workflow"),
      vietnameseTitle: t("ai_era.pillar1_sub", "Tích hợp AI Agents vào quy trình"),
      description: t(
        "ai_era.pillar1_desc",
        "Giao việc cho AI Agent yêu thích của bạn trực tiếp từ Taskosaur. Tự động chuyển đổi kế hoạch thành task sẵn sàng thực thi."
      ),
      badge: "Agentic Automation",
      badgeColor: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    },
    {
      icon: <HiBolt className="size-6 text-amber-400" />,
      title: t("ai_era.pillar2_title", "Better outcomes for fewer tokens"),
      vietnameseTitle: t("ai_era.pillar2_sub", "Tối ưu ngữ cảnh & Tiết kiệm token"),
      description: t(
        "ai_era.pillar2_desc",
        "Cung cấp ngữ cảnh dự án chuẩn xác trước khi viết mã. Giúp AI hiểu sâu kiến trúc và sinh giải pháp chính xác hơn."
      ),
      badge: "Context Protocol",
      badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    },
    {
      icon: <HiShieldCheck className="size-6 text-emerald-400" />,
      title: t("ai_era.pillar3_title", "Scale AI responsibly with full control"),
      vietnameseTitle: t("ai_era.pillar3_sub", "Quản trị an toàn & Kiểm soát toàn diện"),
      description: t(
        "ai_era.pillar3_desc",
        "Theo dõi nhật ký thực thi (Audit Trail), phân quyền bảo mật cấp tổ chức để con người và AI cùng tiến nhanh về một hướng."
      ),
      badge: "Enterprise Security",
      badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
  ];

  return (
    <section id="ai-era" className="py-24 bg-[#080a12] text-white relative overflow-hidden">
      {/* 🌟 Interactive Canvas Particle Field (Repels and ripples with mouse movement) */}
      <InteractiveParticleCanvas
        dotSpacing={26}
        repelRadius={150}
        repelStrength={10}
        maxDotSize={2.4}
        className="opacity-70"
      />

      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[400px] bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-purple-600/15 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Jira-style AI Terminal Card */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            {/* Terminal Box */}
            <div className="inline-block rounded-2xl bg-zinc-900/90 border border-zinc-700/80 p-5 shadow-2xl backdrop-blur-xl">
              <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>{t("ai_era.badge", "Taskosaur for the AI era")}</span>
              </div>
              <div className="font-mono text-lg text-cyan-400 mt-2 flex items-center gap-2">
                <span>&gt;</span>
                <span
                  className={`inline-block w-3.5 h-6 bg-cyan-400 ${
                    cursorVisible ? "opacity-100" : "opacity-0"
                  } transition-opacity duration-100`}
                />
              </div>
            </div>

            {/* Works With AI Ecosystem Badges */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">
                {t("ai_era.works_with", "WORKS WITH")}
              </span>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                <span className="px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-300 flex items-center gap-1.5 hover:border-zinc-600 transition-colors">
                  <SiAnthropic className="size-3.5 text-amber-500" /> Claude
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-300 flex items-center gap-1.5 hover:border-zinc-600 transition-colors">
                  <HiCommandLine className="size-3.5 text-blue-400" /> Cursor
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-300 flex items-center gap-1.5 hover:border-zinc-600 transition-colors">
                  <SiOpenai className="size-3.5 text-emerald-400" /> OpenAI Codex
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-300 flex items-center gap-1.5 hover:border-zinc-600 transition-colors">
                  <SiGithubcopilot className="size-3.5 text-purple-400" /> Copilot
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 text-cyan-300 font-medium flex items-center gap-1.5">
                  <HiSparkles className="size-3.5 text-amber-300" /> Any MCP Agent
                </span>
              </div>
            </div>
          </div>

          <div className="max-w-md text-sm text-zinc-400 leading-relaxed">
            <p>
              {t(
                "ai_era.repel_tip",
                "Di chuột trên màn hình để trải nghiệm trường hạt tương tác. Taskosaur kết nối sâu với các mô hình AI tiên tiến nhất giúp biến ý tưởng thành dòng code thực thi."
              )}
            </p>
          </div>
        </div>

        {/* 3 Pillar Cards with Smooth Right-to-Left Slide Animation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map((pillar, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl bg-zinc-900/80 hover:bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/90 p-8 hover:border-cyan-500/40 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-cyan-500/10 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    {pillar.icon}
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${pillar.badgeColor}`}
                  >
                    {pillar.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {pillar.title}
                </h3>
                <h4 className="text-xs font-semibold text-zinc-400">{pillar.vietnameseTitle}</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">{pillar.description}</p>
              </div>
              <div className="pt-6 mt-6 border-t border-zinc-800/80">
                <Link
                  href="/register"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 group/link"
                >
                  <span>Tìm hiểu quy trình MCP</span>
                  <HiArrowRight className="size-3.5 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
