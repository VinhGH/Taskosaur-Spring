import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Send,
  Check,
  Github,
  MessageSquare,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from "lucide-react";

// =============================================================================
// Constants
// =============================================================================

const BAR_HEIGHTS = [
  23, 40, 53, 40, 33, 14, 7, 17, 75, 65,
  88, 75, 65, 47, 33, 88, 4, 7, 9, 14,
  95, 65, 79, 37, 7, 40, 17, 20, 62, 47,
  92, 72,
];

// =============================================================================
// Animate Helper Component
// =============================================================================

interface AnimateProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "scale";
}

function Animate({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: AnimateProps) {
  const directionClasses: Record<string, string> = {
    up: "animate-fade-up",
    down: "animate-fade-down",
    left: "animate-fade-left",
    right: "animate-fade-right",
    scale: "animate-fade-scale",
  };

  const directionClass = directionClasses[direction] || "animate-fade-up";

  return (
    <div
      className={`opacity-0 ${directionClass} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Taskosaur Logo Primitive
// =============================================================================

function TaskosaurLogo({ className = "w-[28px] h-[28px] sm:w-[32px] sm:h-[32px]" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Image
        src="/taskosaur-logo.svg"
        alt="Taskosaur Logo"
        width={32}
        height={32}
        className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(0,210,255,0.4)]"
      />
    </div>
  );
}

// =============================================================================
// Sprint Velocity & AI Stat Card (RevenueCard pattern)
// =============================================================================

function VelocityCard() {
  const maxHeight = Math.max(...BAR_HEIGHTS);

  return (
    <Animate
      delay={900}
      direction="scale"
      className="w-full max-w-[405px] mx-auto lg:mx-0"
    >
      <div className="w-full rounded-[24px] sm:rounded-[33px] bg-[rgba(17,16,15,0.35)] backdrop-blur-[20px] p-5 sm:p-8 pb-5 sm:pb-6 border border-white/10 shadow-2xl">
        {/* 1. Label */}
        <p className="text-white text-[16px] sm:text-[20px] font-[450] leading-[20px] mb-3 sm:mb-4 flex items-center justify-between">
          <span>Sprint Velocity & AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </p>

        {/* 2. Amount */}
        <p className="mb-2 sm:mb-3">
          <span className="text-white text-[28px] sm:text-[46px] font-[450] leading-[1]">
            14,205
          </span>
          <span className="text-white/20 text-[28px] sm:text-[46px] font-[450] leading-[1]">
            .00
          </span>
        </p>

        {/* 3. Delta Row */}
        <div className="flex items-center gap-[10px] mb-6 sm:mb-8">
          <span className="px-[6px] py-[7px] bg-white/20 rounded-[6px] text-white text-[12px] sm:text-[14px] font-[450] leading-[14px]">
            +32.4%
          </span>
          <span className="text-white/80 text-[12px] sm:text-[14px] font-[450] leading-[14px] opacity-70">
            so với Sprint trước (10.7K pts)
          </span>
        </div>

        {/* 4. Chart Block */}
        <div className="relative">
          {/* (a) Bars */}
          <div className="flex items-end gap-[1.5px] h-[80px] sm:h-[100px]">
            {BAR_HEIGHTS.map((h, i) => {
              const isProjected = i >= 28;
              const heightPercent = (h / maxHeight) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-[0.5px] animate-bar-grow origin-bottom"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: isProjected
                      ? "rgba(255,255,255,0.1)"
                      : "white",
                    animationDelay: `${1100 + i * 30}ms`,
                  }}
                />
              );
            })}
          </div>

          {/* (b) Vertical Gridlines */}
          <div className="absolute inset-0 pointer-events-none">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-white/10"
                style={{ left: `${((i + 1) / 5) * 100}%` }}
              />
            ))}
          </div>

          {/* (c) Time Axis Labels */}
          <div className="flex justify-between mt-3">
            {["10:00", "12:00", "14:00", "16:00", "16:00"].map((label, i) => (
              <span
                key={i}
                className="text-[9px] sm:text-[10px] font-[450] leading-[10px] text-white/80"
                style={{ opacity: i >= 3 ? 0.4 : 1 }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Animate>
  );
}

// =============================================================================
// Navigation Header + Mobile Menu
// =============================================================================

function Nav() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navLinks = [
    { label: "Tính năng", href: "#features" },
    { label: "AI Execution", href: "#ai-execution" },
    { label: "Quy trình", href: "#workflow" },
    { label: "Đồng bộ GitHub", href: "#github-sync" },
    { label: "Liên hệ", href: "#contact" },
  ];

  return (
    <>
      <nav className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] pt-[20px] sm:pt-[30px] flex items-center justify-between relative z-50">
        {/* (i) Logo */}
        <Animate delay={0} direction="down">
          <Link href="/" className="flex items-center gap-2.5 group">
            <TaskosaurLogo />
            <span className="text-white text-[22px] sm:text-[26px] font-[450] leading-none tracking-[-0.02em]">
              Taskosaur
            </span>
          </Link>
        </Animate>

        {/* (ii) Center Nav Pill (Desktop >= 1024px) */}
        <Animate delay={100} direction="down" className="hidden lg:block">
          <div className="h-[52px] px-6 flex items-center gap-[30px] bg-[rgba(10,7,7,0.35)] rounded-[11px] backdrop-blur-[17px] border border-white/[0.08]">
            <a
              href="#features"
              className="flex items-center gap-[5px] text-white/80 text-[14px] font-[450] leading-[14px] hover:text-white transition-colors"
            >
              <span>Tính năng</span>
              <ChevronDown className="w-[10px] h-[10px] opacity-80" />
            </a>
            <a
              href="#ai-execution"
              className="text-white/80 text-[14px] font-[450] leading-[14px] hover:text-white transition-colors"
            >
              AI Execution
            </a>
            <a
              href="#workflow"
              className="text-white/80 text-[14px] font-[450] leading-[14px] hover:text-white transition-colors"
            >
              Quy trình
            </a>
            <a
              href="#github-sync"
              className="text-white/80 text-[14px] font-[450] leading-[14px] hover:text-white transition-colors"
            >
              Đồng bộ GitHub
            </a>
            <a
              href="#contact"
              className="text-white/80 text-[14px] font-[450] leading-[14px] hover:text-white transition-colors"
            >
              Liên hệ
            </a>
          </div>
        </Animate>

        {/* (iii) Right Auth Pill (Desktop >= 1024px) */}
        <Animate delay={200} direction="down" className="hidden lg:block">
          <div className="h-[52px] p-[3px] bg-[rgba(0,0,0,0.35)] rounded-[13px] backdrop-blur-[17px] flex items-center gap-[5px] border border-white/[0.08]">
            <Link
              href="/login"
              className="h-[46px] px-6 rounded-[11px] text-white text-[14px] font-[450] leading-[14px] hover:bg-white/5 transition-colors flex items-center justify-center"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="h-[46px] px-6 bg-[#E9E9E9] rounded-[11px] text-[#0A0707] text-[14px] font-[450] leading-[14px] hover:bg-white transition-colors flex items-center justify-center font-medium"
            >
              Trải nghiệm ngay
            </Link>
          </div>
        </Animate>

        {/* (iv) Mobile Hamburger Button (< 1024px) */}
        <Animate delay={100} direction="down" className="lg:hidden">
          <button
            className="w-[44px] h-[44px] flex items-center justify-center rounded-[11px] bg-[rgba(10,7,7,0.35)] backdrop-blur-[17px] border border-white/10 transition-colors hover:bg-white/10"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <div className="relative w-5 h-5">
              <Menu
                className={`w-5 h-5 text-white absolute inset-0 transition-all duration-300 ease-out ${
                  isOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
                }`}
              />
              <X
                className={`w-5 h-5 text-white absolute inset-0 transition-all duration-300 ease-out ${
                  isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
                }`}
              />
            </div>
          </button>
        </Animate>
      </nav>

      {/* (v) Mobile Menu Overlay (Sibling of nav) */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? "visible" : "invisible"
        }`}
      >
        {/* Backdrop */}
        <div
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 bg-[#080A19]/90 backdrop-blur-[24px] transition-opacity duration-500 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Panel */}
        <div
          className={`absolute top-[76px] sm:top-[86px] left-4 right-4 sm:left-6 sm:right-6 bg-[rgba(17,16,15,0.75)] backdrop-blur-[30px] rounded-[20px] border border-white/[0.08] p-6 sm:p-8 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] origin-top ${
            isOpen
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-4 scale-[0.97]"
          }`}
        >
          <div className="flex flex-col gap-1">
            {navLinks.map((item, i) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                style={{ transitionDelay: isOpen ? `${100 + i * 50}ms` : "0ms" }}
                className={`flex items-center justify-between px-4 py-3.5 rounded-[12px] text-white/90 text-[17px] font-[450] hover:bg-white/[0.06] transition-all duration-300 ${
                  isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"
                }`}
              >
                <span>{item.label}</span>
                {item.label === "Tính năng" && (
                  <ChevronDown className="w-4 h-4 opacity-50" />
                )}
              </a>
            ))}
          </div>

          <div className="h-px bg-white/10 my-5" />

          <div
            className="flex flex-col gap-3 transition-all duration-300"
            style={{ transitionDelay: isOpen ? "350ms" : "0ms" }}
          >
            <Link
              href="/register"
              onClick={() => setIsOpen(false)}
              className="w-full h-[50px] bg-[#E9E9E9] rounded-[12px] text-[#0A0707] text-[15px] font-[450] flex items-center justify-center transition-colors hover:bg-white"
            >
              Trải nghiệm ngay
            </Link>
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="w-full h-[50px] rounded-[12px] border border-white/30 text-white text-[15px] font-[450] flex items-center justify-center transition-colors hover:bg-white/5"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

// =============================================================================
// Core Feature Cards Section
// =============================================================================

function FeatureSection() {
  return (
    <section id="features" className="relative z-10 w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] py-16 sm:py-24 border-t border-white/10">
      <div className="max-w-[620px] mb-12 sm:mb-16">
        <span className="text-[12px] uppercase tracking-widest text-[#00d2ff] font-semibold block mb-3">
          Nền tảng Quản trị Hiện đại
        </span>
        <h2 className="text-white text-[32px] sm:text-[44px] md:text-[50px] font-normal leading-[1.05] tracking-tight">
          Bộ công cụ toàn diện cho các nhóm kỹ thuật bứt phá
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {[
          {
            icon: Sparkles,
            title: "Autonomous AI Task Execution",
            desc: "Trợ lý đàm thoại tự động hiểu ngữ cảnh codebase, lập kế hoạch Sprint, chia nhỏ nhiệm vụ kỹ thuật và chỉ định người phụ trách chính xác theo ngôn ngữ tự nhiên.",
          },
          {
            icon: Zap,
            title: "Cộng tác STOMP Thời Gian Thực",
            desc: "Bảng điều khiển Kanban sử dụng kết nối WebSocket STOMP với Spring Boot, phát sóng trạng thái thẻ tức thì giữa mọi thành viên mà không cần tải lại trang.",
          },
          {
            icon: Github,
            title: "Đồng Bộ GitHub Issue 2 Chiều",
            desc: "Tích hợp wizard đồng bộ chuyên sâu, tự động kéo và chuyển đổi GitHub Issues thành thẻ công việc kèm theo nhãn, phân bổ thời gian và liên kết commit.",
          },
        ].map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={idx}
              className="rounded-[24px] sm:rounded-[28px] bg-[rgba(17,16,15,0.45)] backdrop-blur-[20px] p-6 sm:p-8 border border-white/10 flex flex-col justify-between hover:border-white/20 transition-colors group"
            >
              <div>
                <div className="w-12 h-12 rounded-[14px] bg-white/10 border border-white/15 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6 text-[#00d2ff]" />
                </div>
                <h3 className="text-white text-[20px] sm:text-[22px] font-[450] leading-[1.2] mb-3">
                  {feat.title}
                </h3>
                <p className="text-white/70 text-[14px] sm:text-[15px] font-[450] leading-[1.6]">
                  {feat.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// =============================================================================
// AI Execution & Workflow Section
// =============================================================================

function WorkflowSection() {
  return (
    <section id="workflow" className="relative z-10 w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] py-16 sm:py-24 border-t border-white/10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 sm:mb-16">
        <div className="max-w-[620px]">
          <span className="text-[12px] uppercase tracking-widest text-[#00d2ff] font-semibold block mb-3">
            Quy trình Tinh gọn
          </span>
          <h2 className="text-white text-[32px] sm:text-[44px] md:text-[50px] font-normal leading-[1.05] tracking-tight">
            Vận hành dự án chỉ với 3 bước đơn giản
          </h2>
        </div>
        <p className="text-white/60 text-[15px] sm:text-[16px] max-w-[420px] font-[450] leading-relaxed">
          Loại bỏ mọi thao tác thủ công rườm rà. Taskosaur giúp đội ngũ của bạn đồng bộ mục tiêu từ ý tưởng cho đến sản phẩm thực tế.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {[
          {
            step: "01",
            title: "Khởi tạo Workspace & Kết nối GitHub",
            desc: "Tạo dự án nhanh chóng, kết nối kho lưu trữ GitHub bằng Personal Access Token để kéo issues vào Kanban.",
          },
          {
            step: "02",
            title: "Lập kế hoạch Sprint bằng Trợ lý AI",
            desc: "Đàm thoại tự nhiên với AI để ước tính Story Points, tạo subtasks kiến trúc và lên lịch phát hành.",
          },
          {
            step: "03",
            title: "Điều phối Kanban & Bứt phá Tiến độ",
            desc: "Theo dõi trạng thái kéo thả theo thời gian thực qua STOMP và tận hưởng tiến độ được cập nhật liên tục.",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="rounded-[24px] bg-[rgba(17,16,15,0.4)] backdrop-blur-[20px] p-6 sm:p-8 border border-white/10 relative"
          >
            <span className="text-white/20 font-mono text-[32px] sm:text-[40px] font-bold block mb-4">
              {item.step}
            </span>
            <h3 className="text-white text-[18px] sm:text-[20px] font-[450] leading-[1.3] mb-3">
              {item.title}
            </h3>
            <p className="text-white/70 text-[14px] font-[450] leading-[1.6]">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// =============================================================================
// Architecture & Security Section
// =============================================================================

function ArchitectureSection() {
  return (
    <section id="ai-execution" className="relative z-10 w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] py-16 sm:py-24 border-t border-white/10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div>
          <span className="text-[12px] uppercase tracking-widest text-[#00d2ff] font-semibold block mb-3">
            Kiến trúc Bền bỉ & Bảo mật
          </span>
          <h2 className="text-white text-[32px] sm:text-[44px] md:text-[50px] font-normal leading-[1.05] tracking-tight mb-6">
            Được xây dựng cho tốc độ tối đa và quyền riêng tư tuyệt đối
          </h2>
          <p className="text-white/70 text-[16px] sm:text-[18px] font-[450] leading-relaxed mb-8">
            Taskosaur kết hợp sức mạnh của Java 25 Spring Boot và Next.js 16, đảm bảo độ trễ siêu thấp và khả năng mở rộng không giới hạn cho hệ thống doanh nghiệp.
          </p>

          <div className="space-y-4">
            {[
              "Mô hình BYOK (Bring Your Own Key): Khoá API của bạn không bao giờ rời khỏi hệ thống",
              "Dễ dàng tự triển khai qua Docker Compose chỉ với một câu lệnh",
              "Hệ cơ sở dữ liệu PostgreSQL 16 và bộ nhớ đệm Redis 7 siêu tốc",
              "Hỗ trợ đa ngôn ngữ đầy đủ: Tiếng Việt, Tiếng Anh và Tiếng Nhật",
            ].map((text, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#00d2ff] shrink-0 mt-0.5" />
                <span className="text-white/80 text-[14px] sm:text-[15px] font-[450]">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] sm:rounded-[36px] bg-[rgba(17,16,15,0.45)] backdrop-blur-[20px] p-6 sm:p-10 border border-white/10 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <span className="text-white font-[450] text-[16px]">Bảo mật & Quyền riêng tư</span>
            </div>
            <span className="text-[12px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Active
            </span>
          </div>

          <div className="space-y-4 text-white/70 text-[14px] font-[450] leading-relaxed">
            <p>
              Mã nguồn và dữ liệu công việc của tổ chức được lưu trữ an toàn trong vùng chứa cơ sở dữ liệu độc lập. Không bên thứ ba nào có thể đọc hoặc sử dụng dữ liệu của bạn để huấn luyện mô hình.
            </p>
            <div className="p-4 rounded-[16px] bg-black/40 border border-white/10 font-mono text-[12px] text-[#A4F4FD] space-y-1">
              <div>$ docker compose -f docker-compose.prod.yml up -d</div>
              <div className="text-emerald-400">✓ Taskosaur Spring Boot 25 API: Online (Port 3000)</div>
              <div className="text-emerald-400">✓ Taskosaur Next.js 16 Web: Online (Port 3001)</div>
              <div className="text-emerald-400">✓ PostgreSQL 16 & Redis 7: Connected</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Contact & Consultation Section (Requested by user)
// =============================================================================

function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" className="relative z-10 w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] py-16 sm:py-24 border-t border-white/10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Left Column: Direct Info */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <span className="text-[12px] uppercase tracking-widest text-[#00d2ff] font-semibold block mb-3">
              Liên hệ & Tư vấn Giải pháp
            </span>
            <h2 className="text-white text-[32px] sm:text-[44px] font-normal leading-[1.05] tracking-tight mb-6">
              Sẵn sàng đồng hành cùng dự án của bạn
            </h2>
            <p className="text-white/70 text-[15px] sm:text-[16px] font-[450] leading-relaxed mb-8">
              Bạn cần tư vấn triển khai hạ tầng On-premise, tích hợp AI cho quy trình công ty hoặc thảo luận về giải pháp riêng? Hãy để lại thông tin, đội ngũ Taskosaur sẽ phản hồi trong 24 giờ làm việc.
            </p>

            <div className="space-y-4 text-[14px] text-white/80 font-[450]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-[#00d2ff]" />
                </div>
                <div>
                  <div className="text-white/40 text-[11px] uppercase tracking-wider">Email hỗ trợ</div>
                  <div className="text-white">support@taskosaur.com</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                  <Github className="w-4 h-4 text-[#00d2ff]" />
                </div>
                <div>
                  <div className="text-white/40 text-[11px] uppercase tracking-wider">Mã nguồn mở</div>
                  <a
                    href="https://github.com/VinhGH/Taskosaur-Spring"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:underline"
                  >
                    github.com/VinhGH/Taskosaur-Spring
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-white/50 text-[13px]">
            Cam kết phản hồi nhanh chóng • Hỗ trợ triển khai kỹ thuật 1:1
          </div>
        </div>

        {/* Right Column: Glassmorphic Contact Form */}
        <div className="lg:col-span-7">
          <div className="rounded-[24px] sm:rounded-[32px] bg-[rgba(17,16,15,0.45)] backdrop-blur-[20px] p-6 sm:p-10 border border-white/10">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-white text-[24px] font-[450]">
                  Đã gửi thông tin thành công!
                </h3>
                <p className="text-white/70 text-[15px] max-w-[380px] mx-auto">
                  Cảm ơn bạn đã quan tâm đến Taskosaur. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-[13px] font-[450] mb-2">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={formState.name}
                      onChange={(e) =>
                        setFormState({ ...formState, name: e.target.value })
                      }
                      className="w-full h-[48px] px-4 rounded-[12px] bg-black/40 border border-white/15 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-[#00d2ff] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 text-[13px] font-[450] mb-2">
                      Email làm việc
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={formState.email}
                      onChange={(e) =>
                        setFormState({ ...formState, email: e.target.value })
                      }
                      className="w-full h-[48px] px-4 rounded-[12px] bg-black/40 border border-white/15 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-[#00d2ff] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 text-[13px] font-[450] mb-2">
                    Tổ chức / Tên công ty
                  </label>
                  <input
                    type="text"
                    placeholder="Công ty hoặc tổ chức của bạn"
                    value={formState.company}
                    onChange={(e) =>
                      setFormState({ ...formState, company: e.target.value })
                    }
                    className="w-full h-[48px] px-4 rounded-[12px] bg-black/40 border border-white/15 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-[#00d2ff] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-[13px] font-[450] mb-2">
                    Nội dung yêu cầu
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Mô tả nhu cầu quản trị dự án, quy mô đội ngũ hoặc câu hỏi của bạn..."
                    value={formState.message}
                    onChange={(e) =>
                      setFormState({ ...formState, message: e.target.value })
                    }
                    className="w-full p-4 rounded-[12px] bg-black/40 border border-white/15 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-[#00d2ff] transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto h-[50px] px-8 bg-[#E9E9E9] rounded-[12px] text-[#0A0707] text-[15px] font-[450] hover:bg-white transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <span>Gửi yêu cầu tư vấn</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Clean Footer (NO VERSION NUMBER)
// =============================================================================

function Footer() {
  return (
    <footer className="relative z-10 w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] py-10 sm:py-14 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 text-[13px] text-white/60">
      <div className="flex items-center gap-3">
        <TaskosaurLogo className="w-6 h-6" />
        <span className="text-white font-[450] text-[16px]">Taskosaur</span>
      </div>

      <div className="flex items-center gap-6 sm:gap-8 flex-wrap justify-center">
        <a href="#features" className="hover:text-white transition-colors">
          Tính năng
        </a>
        <a href="#workflow" className="hover:text-white transition-colors">
          Quy trình
        </a>
        <a href="#contact" className="hover:text-white transition-colors">
          Liên hệ
        </a>
        <Link href="/terms-of-service" className="hover:text-white transition-colors">
          Điều khoản dịch vụ
        </Link>
        <Link href="/privacy-policy" className="hover:text-white transition-colors">
          Chính sách bảo mật
        </Link>
        <a
          href="https://github.com/VinhGH/Taskosaur-Spring"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
        >
          GitHub
        </a>
      </div>

      <div>© 2026 Taskosaur Platform. All rights reserved.</div>
    </footer>
  );
}

// =============================================================================
// Main Export: Apogee-Style Taskosaur Landing Page
// =============================================================================

export function TaskosaurApogeeLanding() {
  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-[#080A19] font-sans text-white selection:bg-white/20">
      {/* Background Video */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <video
          className="w-full h-full object-cover"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_092641_de52eb87-daf2-41db-92cb-7a56eae012a5.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        {/* Subtle vignette gradient for optimal text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080A19]/50 via-transparent to-[#080A19]/90 pointer-events-none" />
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* 1. Header Navigation */}
        <Nav />

        {/* 2. Hero Section */}
        <div className="flex-1 flex items-center py-8 sm:py-16">
          <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-12">
            {/* Copy Block (Left Column) */}
            <div className="max-w-[593px]">
              {/* 1. Headline */}
              <Animate delay={300} direction="up">
                <h1 className="text-white text-[36px] sm:text-[52px] md:text-[64px] lg:text-[72px] font-normal leading-[0.95] mb-5 sm:mb-8 tracking-tight">
                  Bứt phá năng suất dự án lên tầm cao mới
                </h1>
              </Animate>

              {/* 2. Subhead */}
              <Animate delay={500} direction="up">
                <p className="text-white/80 text-[16px] sm:text-[18px] md:text-[20px] font-[450] leading-[1.3] max-w-[420px] mb-7 sm:mb-10">
                  Trợ lý AI đàm thoại tự động lập kế hoạch Sprint, chia nhỏ tác vụ và đồng bộ GitHub theo thời gian thực.
                </p>
              </Animate>

              {/* 3. CTA Buttons */}
              <Animate delay={700} direction="up">
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <Link
                    href="/register"
                    className="h-[46px] sm:h-[51px] px-5 sm:px-[27px] bg-[#E9E9E9] rounded-[12px] text-[#0A0707] text-[14px] sm:text-[15.5px] font-[450] leading-[15.5px] transition-opacity hover:opacity-90 inline-flex items-center justify-center font-medium shadow-lg"
                  >
                    Khởi động miễn phí
                  </Link>

                  <a
                    href="#contact"
                    className="h-[46px] sm:h-[51px] px-5 sm:px-[27px] rounded-[12px] border border-white text-white text-[14px] sm:text-[15.5px] font-[450] leading-[15.5px] transition-opacity hover:opacity-80 inline-flex items-center justify-center font-medium"
                  >
                    Liên hệ đội ngũ
                  </a>
                </div>
              </Animate>
            </div>

            {/* Velocity Stat Card (Right Column) */}
            <VelocityCard />
          </div>
        </div>

        {/* 3. Core Features Showcase */}
        <FeatureSection />

        {/* 4. Workflow Section */}
        <WorkflowSection />

        {/* 5. Technical Architecture & Security */}
        <ArchitectureSection />

        {/* 6. Contact & Consultation Section */}
        <ContactSection />

        {/* 7. Clean Footer (No Version) */}
        <Footer />
      </div>
    </div>
  );
}

export default TaskosaurApogeeLanding;
