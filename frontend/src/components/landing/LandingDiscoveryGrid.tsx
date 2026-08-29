import React from "react";
import { HiArrowRight, HiSparkles, HiViewBoards, HiLockClosed, HiRefresh } from "react-icons/hi";
import { motion } from "framer-motion";
import Link from "next/link";

export function LandingDiscoveryGrid() {
  const cards = [
    {
      badge: "Workflow Studio",
      title: "Tùy biến Quy trình làm việc không giới hạn",
      desc: "Tạo riêng bộ trạng thái làm việc (To Do, In Process, Code Review, QA, Done) theo từng đặc thù dự án.",
      bg: "from-purple-600 to-indigo-700",
      textColor: "text-white",
      icon: <HiViewBoards className="size-6 text-purple-200" />,
      tag: "Feature Spotlight",
    },
    {
      badge: "Modern UI/UX",
      title: "Giao diện Phân vùng Bo góc IntelliJ New UI",
      desc: "Bố cục chia cột độc lập, giảm thiểu xao nhãng và tạo không gian tập trung tối đa cho lập trình viên.",
      bg: "from-zinc-900 to-zinc-950 dark:from-zinc-800 dark:to-zinc-900",
      textColor: "text-white",
      icon: <HiSparkles className="size-6 text-cyan-300" />,
      tag: "Design System",
    },
    {
      badge: "Persistence",
      title: "Bảo mật & Tự động ghi nhớ phiên 30 ngày",
      desc: "Không lo bị ngắt kết nối giữa chừng với cơ chế tự làm mới Token qua HttpOnly Cookie và Remember Me tiện lợi.",
      bg: "from-emerald-600 to-teal-700",
      textColor: "text-white",
      icon: <HiLockClosed className="size-6 text-emerald-200" />,
      tag: "Security",
    },
    {
      badge: "Multi-Platform",
      title: "Đồng bộ Đa sắc màu Aurora cho 2 Theme",
      desc: "Ánh sáng khuếch tán đa tầng linh hoạt, tự động cân bằng tương phản dịu mắt ở cả Dark Mode và Light Mode.",
      bg: "from-amber-600 to-orange-700",
      textColor: "text-white",
      icon: <HiRefresh className="size-6 text-amber-200" />,
      tag: "Vibrancy",
    },
  ];

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Cập nhật mới nhất
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Khám phá những cải tiến vượt trội
          </h2>
        </div>

        {/* 4 Discovery Cards with Smooth Right-to-Left Slide Animation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 80 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={`rounded-2xl p-6 bg-gradient-to-b ${c.bg} ${c.textColor} shadow-xl hover:scale-[1.03] transition-all duration-300 flex flex-col justify-between min-h-[320px] group`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                    {c.icon}
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md">
                    {c.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold leading-snug group-hover:underline">{c.title}</h3>
                <p className="text-xs opacity-85 leading-relaxed">{c.desc}</p>
              </div>

              <div className="pt-4 border-t border-white/15">
                <Link
                  href="/register"
                  className="text-xs font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all"
                >
                  <span>Khám phá ngay</span>
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
