import React from "react";
import { HiStar } from "react-icons/hi";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export function LandingSocialProof() {
  const { t } = useTranslation("landing");

  const stats = [
    { value: "10,000+", label: t("social_proof.stat1_label", "Tác vụ đã khởi tạo & hoàn thành"), color: "text-blue-600 dark:text-blue-400" },
    { value: "99.9%", label: t("social_proof.stat2_label", "Độ ổn định & khả dụng hệ thống"), color: "text-emerald-600 dark:text-emerald-400" },
    { value: "3.5x", label: t("social_proof.stat3_label", "Tăng tốc độ bàn giao chu kỳ Sprint"), color: "text-purple-600 dark:text-purple-400" },
    { value: "4.9/5", label: t("social_proof.stat4_label", "Điểm đánh giá trải nghiệm người dùng"), color: "text-amber-500" },
  ];

  const testimonials = [
    {
      quote:
        "Taskosaur đã thay đổi hoàn toàn cách chúng tôi vận hành Sprint. Khả năng tự động hóa và giao diện phân vùng bo góc hiện đại giúp đội ngũ lập trình tập trung cao độ.",
      name: "Nguyễn Văn Hùng",
      role: "Lead Software Architect @ FinTech Corp",
      avatar: "H",
      avatarBg: "bg-blue-600",
    },
    {
      quote:
        "Trợ lý AI Task Execution trên Taskosaur tiết kiệm cho tôi ít nhất 5 giờ mỗi tuần trong việc viết mô tả task và phân rã công việc cho team.",
      name: "Trần Mai Phương",
      role: "Senior Product Manager @ SaaS Studio",
      avatar: "P",
      avatarBg: "bg-purple-600",
    },
    {
      quote:
        "Khả năng chuyển đổi mượt mà giữa Dark Mode và Light Mode với nền Aurora phát sáng mang lại cảm giác làm việc rất phấn khích mỗi ngày.",
      name: "Lê Hoàng Long",
      role: "Engineering Manager @ TechNext",
      avatar: "L",
      avatarBg: "bg-emerald-600",
    },
  ];

  return (
    <section id="social-proof" className="py-24 relative overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats Grid with Smooth Right-to-Left Slide */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center mb-20">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="p-6 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2 hover:scale-[1.03] transition-transform duration-200"
            >
              <div className={`text-3xl sm:text-4xl lg:text-5xl font-black ${stat.color} tracking-tight`}>
                {stat.value}
              </div>
              <p className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {t("social_proof.badge", "Khách hàng nói gì về chúng tôi")}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {t("social_proof.title", "Được tin dùng bởi các chuyên gia công nghệ")}
          </h2>
        </div>

        {/* Testimonial Cards with Smooth Right-to-Left Slide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 70 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="p-8 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-lg shadow-zinc-900/5 dark:shadow-black/20 flex flex-col justify-between space-y-6 hover:border-blue-500/40 transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <HiStar key={i} className="size-4" />
                  ))}
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div
                  className={`w-10 h-10 rounded-full ${t.avatarBg} text-white font-bold text-sm flex items-center justify-center shadow-md`}
                >
                  {t.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{t.name}</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
