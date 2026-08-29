import React, { useState } from "react";
import {
  HiViewColumns,
  HiRocketLaunch,
  HiChartBar,
  HiChatBubbleLeftRight,
  HiCheckCircle,
  HiSparkles,
  HiCalendar,
  HiUserGroup,
} from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function LandingFeaturesShowcase() {
  const { t } = useTranslation("landing");
  const [activeTab, setActiveTab] = useState<"kanban" | "sprint" | "gantt" | "ai">("kanban");

  const tabs = [
    {
      id: "kanban" as const,
      name: t("features.tab_kanban", "Bảng Kanban"),
      icon: <HiViewColumns className="size-5" />,
      desc: t("features.tab_kanban_desc", "Trực quan hóa luồng công việc với các cột trạng thái tùy biến."),
    },
    {
      id: "sprint" as const,
      name: t("features.tab_sprint", "Quản lý Sprint"),
      icon: <HiRocketLaunch className="size-5" />,
      desc: t("features.tab_sprint_desc", "Lập kế hoạch chu kỳ nước rút, đo lường điểm năng suất velocity."),
    },
    {
      id: "gantt" as const,
      name: t("features.tab_gantt", "Dòng thời gian Gantt"),
      icon: <HiChartBar className="size-5" />,
      desc: t("features.tab_gantt_desc", "Theo dõi tiến độ tổng thể và thời hạn bàn giao dự án."),
    },
    {
      id: "ai" as const,
      name: t("features.tab_ai", "Trợ lý AI Task Execution"),
      icon: <HiChatBubbleLeftRight className="size-5" />,
      desc: t("features.tab_ai_desc", "Hỏi đáp ngữ cảnh và thực thi tác vụ thông minh qua AI."),
    },
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <span>{t("features.badge", "Toàn diện & Linh hoạt")}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {t("features.title", "Mọi đội ngũ đều làm việc tốt hơn cùng")}{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Taskosaur
            </span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300">
            {t(
              "features.desc",
              "Từ lập kế hoạch ý tưởng đến bàn giao sản phẩm cuối cùng. Bộ công cụ quản lý Agile đầy đủ cho lập trình viên, quản lý dự án và các nhà lãnh đạo công nghệ."
            )}
          </p>
        </div>

        {/* Feature Tabs Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-10">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]"
                    : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700/80"
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Feature Display Area with Smooth Right-to-Left Slide */}
        <motion.div
          initial={{ opacity: 0, x: 70 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl p-3 sm:p-4 bg-white/70 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-zinc-900/5 dark:shadow-black/40"
        >
          {/* Content for Kanban Tab */}
          {activeTab === "kanban" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 items-center">
              <div className="lg:col-span-4 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Visual Kanban Workflow
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                  Kéo thả trực quan, tối ưu tiến độ từng tác vụ
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Tùy biến cột trạng thái không giới hạn (Cần làm, Đang làm, Đánh giá, Hoàn thành).
                  Phân loại mức độ ưu tiên, gắn thẻ nhãn màu sắc và lọc tác vụ trong tích tắc.
                </p>
                <div className="space-y-2 pt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <HiCheckCircle className="size-5 text-emerald-500" />
                    <span>Kéo thả mượt mà với hiệu ứng phản hồi tức thì</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HiCheckCircle className="size-5 text-emerald-500" />
                    <span>Tự động đồng bộ thời gian thực qua WebSockets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HiCheckCircle className="size-5 text-emerald-500" />
                    <span>Bộ lọc thông minh theo Thành viên & Thẻ Tag</span>
                  </div>
                </div>
                <div className="pt-4">
                  <Link href="/register">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md">
                      Trải nghiệm Bảng Kanban
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Visual Card Mockup */}
              <div className="lg:col-span-8 bg-zinc-950 rounded-xl p-5 border border-zinc-800 space-y-4 shadow-inner">
                <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-800">
                  <span className="font-semibold text-zinc-200">Dự án: E-Commerce Mobile App</span>
                  <span>14 Tasks Active</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        TASK-201
                      </span>
                      <span className="text-[10px] text-amber-400 font-semibold">Ưu tiên cao</span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-100">
                      Tích hợp Cổng thanh toán VNPay & MoMo
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-400">
                      <span>Phụ trách: Thái Vinh</span>
                      <span>Hạn: 3 ngày tới</span>
                    </div>
                  </div>

                  <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        TASK-202
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold">Đã kiểm thử</span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-100">
                      Tối ưu tốc độ tải trang chủ & Cache Redis
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-400">
                      <span>Phụ trách: AI Agent</span>
                      <span className="text-emerald-400">✓ Sẵn sàng release</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content for Sprint Tab */}
          {activeTab === "sprint" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 items-center">
              <div className="lg:col-span-4 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Agile Sprint Delivery
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                  Kế hoạch chu kỳ Sprint & Đo lường Velocity
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Thiết lập mục tiêu Sprint, quản lý điểm story points, theo dõi biểu đồ Burndown và
                  vận tốc hoàn thành dự án chính xác theo phương pháp luận Scrum & Kanban.
                </p>
                <div className="space-y-2 pt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <HiCheckCircle className="size-5 text-purple-500" />
                    <span>Lập kế hoạch Sprint 1-4 tuần linh hoạt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HiCheckCircle className="size-5 text-purple-500" />
                    <span>Tự động chuyển tiếp Backlog tồn đọng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HiCheckCircle className="size-5 text-purple-500" />
                    <span>Báo cáo hiệu suất hoàn thành tức thì</span>
                  </div>
                </div>
                <div className="pt-4">
                  <Link href="/register">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md">
                      Bắt đầu Sprint của bạn
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Visual Sprint Mockup */}
              <div className="lg:col-span-8 bg-zinc-950 rounded-xl p-5 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Sprint 04: MVP Alpha Launch</h4>
                    <span className="text-xs text-zinc-400">Sep 1, 2026 - Sep 15, 2026 (14 ngày)</span>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Đang chạy (Active)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 text-center">
                    <span className="text-[10px] uppercase text-zinc-400 font-bold block">
                      Tổng Story Points
                    </span>
                    <span className="text-xl font-extrabold text-blue-400">42 pts</span>
                  </div>
                  <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 text-center">
                    <span className="text-[10px] uppercase text-zinc-400 font-bold block">
                      Đã hoàn thành
                    </span>
                    <span className="text-xl font-extrabold text-emerald-400">32 pts</span>
                  </div>
                  <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 text-center">
                    <span className="text-[10px] uppercase text-zinc-400 font-bold block">
                      Tiến độ đạt
                    </span>
                    <span className="text-xl font-extrabold text-purple-400">76%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content for Gantt Tab */}
          {activeTab === "gantt" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 items-center">
              <div className="lg:col-span-4 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  Gantt & Timeline View
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                  Bức tranh toàn cảnh tiến độ dự án
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Trực quan hóa lộ trình sản phẩm (Roadmap), nhận biết các nút thắt cổ chai và kiểm
                  soát chặt chẽ các mốc thời gian quan trọng (Milestones).
                </p>
                <div className="space-y-2 pt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <HiCheckCircle className="size-5 text-cyan-500" />
                    <span>Dòng thời gian tương tác kéo thả mốc bắt đầu/kết thúc</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HiCheckCircle className="size-5 text-cyan-500" />
                    <span>Theo dõi đường găng (Critical Path)</span>
                  </div>
                </div>
                <div className="pt-4">
                  <Link href="/register">
                    <Button className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg shadow-md">
                      Xem Lộ trình Gantt
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Visual Gantt Mockup */}
              <div className="lg:col-span-8 bg-zinc-950 rounded-xl p-5 border border-zinc-800 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>1. Thiết kế Hệ thống & DB Schema</span>
                    <span className="text-emerald-400">100% Hoàn thành</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>2. Xây dựng Spring Boot Backend APIs</span>
                    <span className="text-blue-400">85% Tiến độ</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full w-[85%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>3. Giao diện Next.js & Đổi mới UI/UX</span>
                    <span className="text-purple-400">95% Tiến độ</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full w-[95%]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content for AI Tab */}
          {activeTab === "ai" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 items-center">
              <div className="lg:col-span-4 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  AI Task Execution Agent
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                  Trò chuyện tự nhiên, thực thi tác vụ tức thì
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Chỉ cần mô tả yêu cầu bằng ngôn ngữ tự nhiên tiếng Việt hoặc tiếng Anh. Trợ lý AI
                  Taskosaur sẽ tự động phân tích ngữ cảnh dự án, tạo task, phân bổ người làm và cập
                  nhật trạng thái.
                </p>
                <div className="space-y-2 pt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <HiCheckCircle className="size-5 text-emerald-500" />
                    <span>Tự động phân rã User Story thành Subtasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HiCheckCircle className="size-5 text-emerald-500" />
                    <span>Truy vấn tiến độ dự án bằng câu hỏi thường nhật</span>
                  </div>
                </div>
                <div className="pt-4">
                  <Link href="/register">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md">
                      Trải nghiệm Trợ lý AI
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Visual Chat Mockup */}
              <div className="lg:col-span-8 bg-zinc-950 rounded-xl p-5 border border-zinc-800 space-y-3">
                <div className="flex items-start gap-3 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    U
                  </div>
                  <div className="text-xs space-y-1">
                    <span className="font-semibold text-zinc-300">Product Manager</span>
                    <p className="text-zinc-200">
                      "Hãy tạo cho tôi 3 task để chuẩn bị triển khai hệ thống thanh toán cho Sprint 04."
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-gradient-to-r from-blue-950/40 to-indigo-950/40 p-3 rounded-lg border border-blue-500/30">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-md">
                    <HiSparkles className="size-4 text-amber-300" />
                  </div>
                  <div className="text-xs space-y-2">
                    <span className="font-semibold text-cyan-300 flex items-center gap-1">
                      Taskosaur AI Agent • Vừa xong
                    </span>
                    <p className="text-zinc-200">
                      Đã phân tích yêu cầu và tự động tạo 3 tasks thành công vào Sprint 04:
                    </p>
                    <ul className="list-disc ml-4 space-y-1 text-zinc-300">
                      <li>TASK-205: Thiết kế database schema giao dịch ví</li>
                      <li>TASK-206: Tích hợp Webhook callback bảo mật</li>
                      <li>TASK-207: Viết unit tests kiểm thử hoàn tiền</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
