import React from "react";
import { HiUserGroup, HiMagnifyingGlass, HiChartPie, HiArrowRight } from "react-icons/hi2";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Link from "next/link";

export function LandingDeepDive() {
  const { t } = useTranslation("landing");

  const cards = [
    {
      icon: <HiUserGroup className="size-8 text-blue-500" />,
      title: t("deep_dive.card1_title", "Team Work Graph"),
      subtitle: t("deep_dive.card1_sub", "Mạng lưới kết nối công việc thông minh"),
      description: t(
        "deep_dive.card1_desc",
        "Tự động liên kết các đầu việc phụ thuộc, phân bổ trách nhiệm rõ ràng và loại bỏ các nút thắt ách tắc tiến độ trước khi chúng xảy ra."
      ),
      gradient: "from-blue-500/10 to-indigo-500/10",
      borderColor: "hover:border-blue-500/40",
      tag: "Sự cộng tác",
    },
    {
      icon: <HiMagnifyingGlass className="size-8 text-purple-500" />,
      title: t("deep_dive.card2_title", "AI Semantic Search"),
      subtitle: t("deep_dive.card2_sub", "Truy vấn thông minh theo ngữ nghĩa"),
      description: t(
        "deep_dive.card2_desc",
        "Không cần nhớ mã Task chính xác. Tìm kiếm tài liệu, thảo luận và tiến độ dự án bằng ngôn ngữ tự nhiên chỉ trong tích tắc."
      ),
      gradient: "from-purple-500/10 to-pink-500/10",
      borderColor: "hover:border-purple-500/40",
      tag: "Trí tuệ nhân tạo",
    },
    {
      icon: <HiChartPie className="size-8 text-emerald-500" />,
      title: t("deep_dive.card3_title", "Workload & Analytics"),
      subtitle: t("deep_dive.card3_sub", "Cân bằng năng suất & Phân bổ tải"),
      description: t(
        "deep_dive.card3_desc",
        "Biểu đồ phân bổ khối lượng công việc trực quan theo thời gian thực. Giúp quản lý phát hiện sớm tình trạng quá tải để phân công hợp lý."
      ),
      gradient: "from-emerald-500/10 to-teal-500/10",
      borderColor: "hover:border-emerald-500/40",
      tag: "Phân tích dữ liệu",
    },
  ];

  return (
    <section id="solutions" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {t("deep_dive.badge", "Năng lực mở rộng")}
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {t("deep_dive.title", "Nhiều hơn cả một công cụ quản lý dự án")}
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300">
            {t(
              "deep_dive.desc",
              "Taskosaur cung cấp hệ sinh thái toàn diện kết nối con người, công việc và trí tuệ nhân tạo trong một nền tảng thống nhất duy nhất."
            )}
          </p>
        </div>

        {/* 3 Cards with Smooth Right-to-Left Slide Animation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 70 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className={`rounded-2xl p-8 bg-gradient-to-br ${card.gradient} bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 ${card.borderColor} transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between group`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {card.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {card.tag}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {card.title}
                </h3>
                <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {card.subtitle}
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-zinc-200 dark:border-zinc-800">
                <Link
                  href="/register"
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
                >
                  <span>Khám phá tính năng</span>
                  <HiArrowRight className="size-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
