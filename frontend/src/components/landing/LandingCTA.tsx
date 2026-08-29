import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { HiArrowRight, HiSparkles } from "react-icons/hi";
import { InteractiveParticleCanvas } from "./InteractiveParticleCanvas";

export function LandingCTA() {
  const { t } = useTranslation("landing");

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-zinc-950 text-white">
      {/* 🌟 Interactive Canvas Particle Field */}
      <InteractiveParticleCanvas
        dotSpacing={28}
        repelRadius={150}
        repelStrength={9}
        maxDotSize={2.2}
        className="opacity-50"
      />

      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
          <HiSparkles className="size-3.5" /> {t("cta.badge", "Sẵn sàng bứt phá hiệu suất?")}
        </div>

        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          {t("cta.title", "Ship faster with")}{" "}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
            {t("cta.title_highlight", "AI agents in Taskosaur")}
          </span>
        </h2>

        <p className="text-base sm:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          {t(
            "cta.desc",
            "Tham gia cùng hàng ngàn lập trình viên và nhà quản lý đang tối ưu hóa chu kỳ phát triển sản phẩm mỗi ngày. Hoàn toàn miễn phí để bắt đầu."
          )}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/register">
            <Button className="h-13 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-xl shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 flex items-center gap-2 group cursor-pointer">
              <span>{t("cta.start_free", "Bắt đầu miễn phí ngay")}</span>
              <HiArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <Link href="/login">
            <Button
              variant="outline"
              className="h-13 px-8 border-zinc-700 hover:bg-zinc-800 text-white font-semibold text-base rounded-xl cursor-pointer"
            >
              {t("cta.login", "Đăng nhập tài khoản")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
