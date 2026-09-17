import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
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
  Globe,
  Mail,
  ArrowRight,
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
// Animate Helper Component (Apogee forwards keyframes)
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
// Language Switcher Component (Glass Pill)
// =============================================================================

const SUPPORTED_LANGUAGES = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
];

function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { i18n } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const currentLang = i18n.language?.split("-")[0] || "vi";

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("i18nextLng", code);
    }
    setDropdownOpen(false);
  };

  const currentObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="h-[40px] px-3.5 rounded-[11px] bg-[rgba(10,7,7,0.35)] backdrop-blur-[17px] border border-white/10 hover:border-white/20 text-white text-[13px] font-[450] flex items-center gap-2 transition-all"
        aria-label="Select Language"
      >
        <Globe className="w-3.5 h-3.5 text-[#00d2ff]" />
        <span>{currentObj.flag}</span>
        <span className="uppercase tracking-wider font-semibold text-[11px]">{currentObj.code}</span>
        <ChevronDown className="w-3 h-3 text-white/60" />
      </button>

      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-36 rounded-[14px] bg-[rgba(17,16,15,0.9)] backdrop-blur-[24px] border border-white/15 p-1.5 z-50 shadow-2xl space-y-1"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-xs font-[450] transition-colors ${
                  currentLang === lang.code
                    ? "bg-white/15 text-white font-medium"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
                {currentLang === lang.code && <Check className="w-3.5 h-3.5 text-[#00d2ff]" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Bilingual Dictionary for Landing Page
// =============================================================================

const TEXTS = {
  vi: {
    nav: {
      features: "Tính năng",
      aiExecution: "AI Execution",
      workflow: "Quy trình",
      githubSync: "Đồng bộ GitHub",
      contact: "Liên hệ",
      login: "Đăng nhập",
      getStarted: "Trải nghiệm ngay",
    },
    hero: {
      title: "Bứt phá năng suất dự án lên tầm cao mới",
      subhead: "Trợ lý AI đàm thoại tự động lập kế hoạch Sprint, chia nhỏ tác vụ và đồng bộ GitHub theo thời gian thực.",
      ctaPrimary: "Khởi động miễn phí",
      ctaSecondary: "Liên hệ đội ngũ",
    },
    stat: {
      title: "Tốc độ Sprint & AI Tối ưu",
      vsPrevious: "so với Sprint trước (10.7K pts)",
    },
    features: {
      eyebrow: "Nền tảng Quản trị Hiện đại",
      title: "Bộ công cụ toàn diện cho các nhóm kỹ thuật bứt phá",
      feat1Title: "Autonomous AI Task Execution",
      feat1Desc: "Trợ lý đàm thoại tự động hiểu ngữ cảnh codebase, lập kế hoạch Sprint, chia nhỏ nhiệm vụ kỹ thuật và chỉ định người phụ trách chính xác theo ngôn ngữ tự nhiên.",
      feat2Title: "Cộng tác STOMP Thời Gian Thực",
      feat2Desc: "Bảng điều khiển Kanban sử dụng kết nối WebSocket STOMP với Spring Boot, phát sóng trạng thái thẻ tức thì giữa mọi thành viên mà không cần tải lại trang.",
      feat3Title: "Đồng Bộ GitHub Issue 2 Chiều",
      feat3Desc: "Tích hợp wizard đồng bộ chuyên sâu, tự động kéo và chuyển đổi GitHub Issues thành thẻ công việc kèm theo nhãn, phân bổ thời gian và liên kết commit.",
    },
    workflow: {
      eyebrow: "Quy trình Tinh gọn",
      title: "Vận hành dự án chỉ với 3 bước đơn giản",
      desc: "Loại bỏ mọi thao tác thủ công rườm rà. Taskosaur giúp đội ngũ của bạn đồng bộ mục tiêu từ ý tưởng cho đến sản phẩm thực tế.",
      step1Title: "Khởi tạo Workspace & Kết nối GitHub",
      step1Desc: "Tạo dự án nhanh chóng, kết nối kho lưu trữ GitHub bằng Personal Access Token để kéo issues vào Kanban.",
      step2Title: "Lập kế hoạch Sprint bằng Trợ lý AI",
      step2Desc: "Đàm thoại tự nhiên với AI để ước tính Story Points, tạo subtasks kiến trúc và lên lịch phát hành.",
      step3Title: "Điều phối Kanban & Bứt phá Tiến độ",
      step3Desc: "Theo dõi trạng thái kéo thả theo thời gian thực qua STOMP và tận hưởng tiến độ được cập nhật liên tục.",
    },
    architecture: {
      eyebrow: "Kiến trúc Bền bỉ & Bảo mật",
      title: "Được xây dựng cho tốc độ tối đa và quyền riêng tư tuyệt đối",
      desc: "Taskosaur kết hợp sức mạnh của Java 25 Spring Boot và Next.js 16, đảm bảo độ trễ siêu thấp và khả năng mở rộng không giới hạn cho hệ thống doanh nghiệp.",
      points: [
        "Mô hình BYOK (Bring Your Own Key): Khoá API của bạn không bao giờ rời khỏi hệ thống",
        "Dễ dàng tự triển khai qua Docker Compose chỉ với một câu lệnh",
        "Hệ cơ sở dữ liệu PostgreSQL 16 và bộ nhớ đệm Redis 7 siêu tốc",
        "Hỗ trợ đa ngôn ngữ đầy đủ: Tiếng Việt, Tiếng Anh và Tiếng Nhật",
      ],
      boxTitle: "Bảo mật & Quyền riêng tư",
      boxDesc: "Mã nguồn và dữ liệu công việc của tổ chức được lưu trữ an toàn trong vùng chứa cơ sở dữ liệu độc lập. Không bên thứ ba nào có thể đọc hoặc sử dụng dữ liệu của bạn để huấn luyện mô hình.",
    },
    contact: {
      eyebrow: "Liên hệ & Tư vấn Giải pháp",
      title: "Sẵn sàng đồng hành cùng dự án của bạn",
      desc: "Bạn cần tư vấn triển khai hạ tầng On-premise, tích hợp AI cho quy trình công ty hoặc thảo luận về giải pháp riêng? Hãy để lại thông tin, đội ngũ Taskosaur sẽ phản hồi qua taskosaurvn@gmail.com trong 24 giờ làm việc.",
      emailLabel: "Email hỗ trợ chính thức",
      openSourceLabel: "Kho mã nguồn mở",
      nameLabel: "Họ và tên",
      emailInputLabel: "Email làm việc",
      companyLabel: "Tổ chức / Tên công ty",
      messageLabel: "Nội dung yêu cầu",
      submitBtn: "Gửi yêu cầu tư vấn",
      successTitle: "Đã gửi thông tin thành công!",
      successDesc: "Cảm ơn bạn đã quan tâm đến Taskosaur. Chúng tôi sẽ phản hồi sớm nhất qua hòm thư taskosaurvn@gmail.com.",
      guarantee: "Cam kết phản hồi nhanh chóng qua taskosaurvn@gmail.com • Hỗ trợ triển khai kỹ thuật 1:1",
    },
    footer: {
      terms: "Điều khoản dịch vụ",
      privacy: "Chính sách bảo mật",
      rights: "© 2026 Taskosaur Platform. All rights reserved.",
    },
  },
  en: {
    nav: {
      features: "Features",
      aiExecution: "AI Execution",
      workflow: "Workflow",
      githubSync: "GitHub Sync",
      contact: "Contact",
      login: "Login",
      getStarted: "Get Started",
    },
    hero: {
      title: "Elevate your project velocity to new heights",
      subhead: "Autonomous conversational AI agent that plans sprints, breaks down tasks, and syncs GitHub in real time.",
      ctaPrimary: "Get started free",
      ctaSecondary: "Talk with the team",
    },
    stat: {
      title: "Sprint Velocity & AI",
      vsPrevious: "vs. previous sprint (10.7K pts)",
    },
    features: {
      eyebrow: "Modern Project Platform",
      title: "Comprehensive toolkit for fast-moving engineering teams",
      feat1Title: "Autonomous AI Task Execution",
      feat1Desc: "Conversational agent that understands architectural context, plans sprints, decomposes tasks, and assigns assignees via natural language.",
      feat2Title: "Real-Time STOMP Collaboration",
      feat2Desc: "Interactive Kanban board powered by WebSocket STOMP and Spring Boot, broadcasting updates instantly across all team members.",
      feat3Title: "Bidirectional GitHub Issue Sync",
      feat3Desc: "Comprehensive sync wizard that imports issues into Kanban, tracks pull requests, commits, and bidirectional status mappings.",
    },
    workflow: {
      eyebrow: "Streamlined Workflow",
      title: "Operate projects in just 3 simple steps",
      desc: "Eliminate repetitive manual tasks. Taskosaur aligns your team from initial brainstorm to shipped product.",
      step1Title: "Create Workspace & Connect GitHub",
      step1Desc: "Spin up workspaces quickly and link GitHub repositories via Personal Access Token to ingest issues into Kanban.",
      step2Title: "Sprint Planning with AI Co-pilot",
      step2Desc: "Converse naturally with AI to estimate Story Points, generate architectural subtasks, and schedule milestones.",
      step3Title: "Coordinate Kanban & Accelerate Velocity",
      step3Desc: "Track drag-and-drop workflows in real-time over STOMP and enjoy uninterrupted developer momentum.",
    },
    architecture: {
      eyebrow: "Resilient Architecture & Security",
      title: "Built for peak throughput and absolute privacy",
      desc: "Taskosaur combines Java 25 Spring Boot and Next.js 16 for ultra-low latency and enterprise-grade scalability.",
      points: [
        "BYOK (Bring Your Own Key) architecture: Your AI keys never leave your secure domain",
        "Deploy in seconds with a single Docker Compose command",
        "PostgreSQL 16 persistence and Redis 7 ultra-fast caching layer",
        "Comprehensive multi-language localization: English, Vietnamese, and Japanese",
      ],
      boxTitle: "Security & Confidentiality",
      boxDesc: "Your codebase context and proprietary tasks are securely isolated in dedicated containers. No third party ever trains on your data.",
    },
    contact: {
      eyebrow: "Contact & Consultation",
      title: "Ready to accelerate your team's velocity",
      desc: "Need guidance on on-premise deployments, custom AI integration, or enterprise support? Reach out and our engineering team will respond via taskosaurvn@gmail.com within 24 hours.",
      emailLabel: "Official Support Email",
      openSourceLabel: "Open-Source Repository",
      nameLabel: "Full Name",
      emailInputLabel: "Work Email",
      companyLabel: "Organization / Company",
      messageLabel: "Message / Inquiries",
      submitBtn: "Send Inquiry",
      successTitle: "Inquiry Sent Successfully!",
      successDesc: "Thank you for reaching out to Taskosaur. We will get back to you promptly via taskosaurvn@gmail.com.",
      guarantee: "Prompt response via taskosaurvn@gmail.com • 1-on-1 technical onboarding support",
    },
    footer: {
      terms: "Terms of Service",
      privacy: "Privacy Policy",
      rights: "© 2026 Taskosaur Platform. All rights reserved.",
    },
  },
  ja: {
    nav: {
      features: "機能",
      aiExecution: "AI実行",
      workflow: "ワークフロー",
      githubSync: "GitHub同期",
      contact: "お問い合わせ",
      login: "ログイン",
      getStarted: "無料で始める",
    },
    hero: {
      title: "プロジェクトの生産性を新たな高みへ",
      subhead: "スプリント計画、タスク自動分解、GitHub同期をリアルタイムで実行する自律型AIアシスタント。",
      ctaPrimary: "今すぐ無料体験",
      ctaSecondary: "チームに相談する",
    },
    stat: {
      title: "スプリントベロシティ & AI",
      vsPrevious: "前スプリント比 (10.7K pts)",
    },
    features: {
      eyebrow: "次世代アジャイル基盤",
      title: "高速に進化する開発チームのための包括的ツールキット",
      feat1Title: "自律型AIタスク実行",
      feat1Desc: "自然言語の対話でコードベースの文脈を理解し、スプリント計画やタスクの細分化、担当者の割り当てを自動化。",
      feat2Title: "STOMPによるリアルタイム協調",
      feat2Desc: "Spring Boot WebSocket STOMPによるカンバンボードで、ページのリロードなしにメンバー間で即座に同期。",
      feat3Title: "GitHub Issue双方向同期",
      feat3Desc: "高度な連携ウィザードでGitHub Issueを自動取得し、ラベルや進捗、コミットを双方向で同期。",
    },
    workflow: {
      eyebrow: "合理化されたワークフロー",
      title: "わずか3ステップでプロジェクトを始動",
      desc: "面倒な手作業を排除。Taskosaurが構想からリリースまでチームの目標をシームレスに同期します。",
      step1Title: "ワークスペース作成とGitHub連携",
      step1Desc: "GitHubリポジトリを連携してIssueをカンバンボードに自動インポート。",
      step2Title: "AIアシスタントによるスプリント計画",
      step2Desc: "自然言語で対話しながらストーリーポイントの見積もりやタスク分解を実施。",
      step3Title: "カンバン運用とベロシティ加速",
      step3Desc: "STOMP経由のリアルタイムなドラッグ＆ドロップでスムーズに進捗を管理。",
    },
    architecture: {
      eyebrow: "高信頼アーキテクチャ & セキュリティ",
      title: "最高速度と厳格なプライバシーを両立",
      desc: "Java 25 Spring BootとNext.js 16を融合し、超低レイテンシと堅牢なスケーラビリティを実現。",
      points: [
        "BYOKモデル：お客様のAPIキーが外部に漏洩することはありません",
        "Docker Composeによるワンコマンド即時セルフホスト対応",
        "PostgreSQL 16と高速インメモリRedis 7を標準採用",
        "日本語、英語、ベトナム語に完全対応",
      ],
      boxTitle: "セキュリティ & 機密保持",
      boxDesc: "お客様のタスクデータは独立した環境で保護され、AIモデルの学習に使用されることは一切ありません。",
    },
    contact: {
      eyebrow: "お問い合わせ & ご相談",
      title: "プロジェクトの成功を全力で支援します",
      desc: "オンプレミス導入、自社ワークフローへのAI統合など、何でもお気軽にご相談ください。24時間以内にtaskosaurvn@gmail.comよりご連絡いたします。",
      emailLabel: "公式サポートメール",
      openSourceLabel: "オープンソースリポジトリ",
      nameLabel: "お名前",
      emailInputLabel: "職場メールアドレス",
      companyLabel: "会社名 / 組織名",
      messageLabel: "お問い合わせ内容",
      submitBtn: "お問い合わせを送信",
      successTitle: "送信が完了しました！",
      successDesc: "Taskosaurへのお問い合わせありがとうございます。taskosaurvn@gmail.comより折り返しご連絡いたします。",
      guarantee: "taskosaurvn@gmail.comより迅速にご返信 • 1対1の技術導入サポート",
    },
    footer: {
      terms: "利用規約",
      privacy: "プライバシーポリシー",
      rights: "© 2026 Taskosaur Platform. All rights reserved.",
    },
  },
};

// =============================================================================
// Flower Blooming Animation Variants ("bung toả như hoa ra")
// =============================================================================

const flowerBloomContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const bloomPetalLeft = {
  hidden: { opacity: 0, scale: 0.7, x: 28, y: 45, rotate: -5 },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 14,
      mass: 0.9,
    },
  },
};

const bloomPetalCenter = {
  hidden: { opacity: 0, scale: 0.65, y: 55, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 85,
      damping: 13,
      mass: 0.8,
    },
  },
};

const bloomPetalRight = {
  hidden: { opacity: 0, scale: 0.7, x: -28, y: 45, rotate: 5 },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 14,
      mass: 0.9,
    },
  },
};

// =============================================================================
// Sprint Velocity & AI Stat Card (Apogee Card)
// =============================================================================

function VelocityCard({ texts }: { texts: typeof TEXTS["vi"] }) {
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
          <span>{texts.stat.title}</span>
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
            {texts.stat.vsPrevious}
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

function Nav({ texts }: { texts: typeof TEXTS["vi"] }) {
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
    { label: texts.nav.features, href: "#features" },
    { label: texts.nav.aiExecution, href: "#ai-execution" },
    { label: texts.nav.workflow, href: "#workflow" },
    { label: texts.nav.githubSync, href: "#github-sync" },
    { label: texts.nav.contact, href: "#contact" },
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
          <div className="h-[52px] px-6 flex items-center gap-[28px] bg-[rgba(10,7,7,0.35)] rounded-[11px] backdrop-blur-[17px] border border-white/[0.08]">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-white/80 text-[14px] font-[450] leading-[14px] hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </Animate>

        {/* (iii) Right Actions Pill & Language Switcher (Desktop >= 1024px) */}
        <Animate delay={200} direction="down" className="hidden lg:flex items-center gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Auth Pill */}
          <div className="h-[52px] p-[3px] bg-[rgba(0,0,0,0.35)] rounded-[13px] backdrop-blur-[17px] flex items-center gap-[5px] border border-white/[0.08]">
            <Link
              href="/login"
              className="h-[46px] px-6 rounded-[11px] text-white text-[14px] font-[450] leading-[14px] hover:bg-white/5 transition-colors flex items-center justify-center"
            >
              {texts.nav.login}
            </Link>
            <Link
              href="/register"
              className="h-[46px] px-6 bg-[#E9E9E9] rounded-[11px] text-[#0A0707] text-[14px] font-[450] leading-[14px] hover:bg-white transition-colors flex items-center justify-center font-medium"
            >
              {texts.nav.getStarted}
            </Link>
          </div>
        </Animate>

        {/* (iv) Mobile Right Bar (< 1024px) */}
        <Animate delay={100} direction="down" className="lg:hidden flex items-center gap-2">
          <LanguageSwitcher />
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
          className={`absolute top-[76px] sm:top-[86px] left-4 right-4 sm:left-6 sm:right-6 bg-[rgba(17,16,15,0.85)] backdrop-blur-[30px] rounded-[20px] border border-white/[0.08] p-6 sm:p-8 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] origin-top ${
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
              className="w-full h-[50px] bg-[#E9E9E9] rounded-[12px] text-[#0A0707] text-[15px] font-[450] flex items-center justify-center transition-colors hover:bg-white font-medium"
            >
              {texts.nav.getStarted}
            </Link>
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="w-full h-[50px] rounded-[12px] border border-white/30 text-white text-[15px] font-[450] flex items-center justify-center transition-colors hover:bg-white/5"
            >
              {texts.nav.login}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

// =============================================================================
// Core Feature Cards Section (With Flower Blooming Animation)
// =============================================================================

function FeatureSection({ texts }: { texts: typeof TEXTS["vi"] }) {
  const features = [
    {
      icon: Sparkles,
      title: texts.features.feat1Title,
      desc: texts.features.feat1Desc,
      variant: bloomPetalLeft,
    },
    {
      icon: Zap,
      title: texts.features.feat2Title,
      desc: texts.features.feat2Desc,
      variant: bloomPetalCenter,
    },
    {
      icon: Github,
      title: texts.features.feat3Title,
      desc: texts.features.feat3Desc,
      variant: bloomPetalRight,
    },
  ];

  return (
    <section id="features" className="relative z-10 w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] py-16 sm:py-24 border-t border-white/10">
      {/* Blooming Background Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-radial from-[#00d2ff]/10 via-transparent to-transparent pointer-events-none blur-3xl" />

      <div className="max-w-[620px] mb-12 sm:mb-16">
        <span className="text-[12px] uppercase tracking-widest text-[#00d2ff] font-semibold block mb-3">
          {texts.features.eyebrow}
        </span>
        <h2 className="text-white text-[32px] sm:text-[44px] md:text-[50px] font-normal leading-[1.05] tracking-tight">
          {texts.features.title}
        </h2>
      </div>

      {/* 🌸 Flower Blooming Cards Grid */}
      <motion.div
        variants={flowerBloomContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
      >
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <motion.div
              key={idx}
              variants={feat.variant}
              whileHover={{ scale: 1.025, y: -6, transition: { duration: 0.25 } }}
              className="rounded-[24px] sm:rounded-[28px] bg-[rgba(17,16,15,0.45)] backdrop-blur-[20px] p-6 sm:p-8 border border-white/10 flex flex-col justify-between hover:border-white/25 transition-all shadow-xl hover:shadow-[0_15px_35px_rgba(0,210,255,0.12)] group"
            >
              <div>
                <div className="w-12 h-12 rounded-[14px] bg-white/10 border border-white/15 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6 text-[#00d2ff]" />
                </div>
                <h3 className="text-white text-[20px] sm:text-[22px] font-[450] leading-[1.2] mb-3">
                  {feat.title}
                </h3>
                <p className="text-white/70 text-[14px] sm:text-[15px] font-[450] leading-[1.6]">
                  {feat.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

// =============================================================================
// AI Execution & Workflow Section (With Blooming Stagger)
// =============================================================================

function WorkflowSection({ texts }: { texts: typeof TEXTS["vi"] }) {
  const steps = [
    {
      step: "01",
      title: texts.workflow.step1Title,
      desc: texts.workflow.step1Desc,
      variant: bloomPetalLeft,
    },
    {
      step: "02",
      title: texts.workflow.step2Title,
      desc: texts.workflow.step2Desc,
      variant: bloomPetalCenter,
    },
    {
      step: "03",
      title: texts.workflow.step3Title,
      desc: texts.workflow.step3Desc,
      variant: bloomPetalRight,
    },
  ];

  return (
    <section id="workflow" className="relative z-10 w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] py-16 sm:py-24 border-t border-white/10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 sm:mb-16">
        <div className="max-w-[620px]">
          <span className="text-[12px] uppercase tracking-widest text-[#00d2ff] font-semibold block mb-3">
            {texts.workflow.eyebrow}
          </span>
          <h2 className="text-white text-[32px] sm:text-[44px] md:text-[50px] font-normal leading-[1.05] tracking-tight">
            {texts.workflow.title}
          </h2>
        </div>
        <p className="text-white/60 text-[15px] sm:text-[16px] max-w-[420px] font-[450] leading-relaxed">
          {texts.workflow.desc}
        </p>
      </div>

      {/* 🌸 Flower Blooming Steps Grid */}
      <motion.div
        variants={flowerBloomContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
      >
        {steps.map((item, idx) => (
          <motion.div
            key={idx}
            variants={item.variant}
            whileHover={{ scale: 1.025, y: -6, transition: { duration: 0.25 } }}
            className="rounded-[24px] bg-[rgba(17,16,15,0.4)] backdrop-blur-[20px] p-6 sm:p-8 border border-white/10 relative hover:border-white/20 transition-all shadow-xl"
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
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

// =============================================================================
// Architecture & Security Section
// =============================================================================

function ArchitectureSection({ texts }: { texts: typeof TEXTS["vi"] }) {
  return (
    <section id="ai-execution" className="relative z-10 w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] py-16 sm:py-24 border-t border-white/10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div>
          <span className="text-[12px] uppercase tracking-widest text-[#00d2ff] font-semibold block mb-3">
            {texts.architecture.eyebrow}
          </span>
          <h2 className="text-white text-[32px] sm:text-[44px] md:text-[50px] font-normal leading-[1.05] tracking-tight mb-6">
            {texts.architecture.title}
          </h2>
          <p className="text-white/70 text-[16px] sm:text-[18px] font-[450] leading-relaxed mb-8">
            {texts.architecture.desc}
          </p>

          <div className="space-y-4">
            {texts.architecture.points.map((text, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#00d2ff] shrink-0 mt-0.5" />
                <span className="text-white/80 text-[14px] sm:text-[15px] font-[450]">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Blooming Architecture Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: 2 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 80, damping: 14 }}
          className="rounded-[28px] sm:rounded-[36px] bg-[rgba(17,16,15,0.45)] backdrop-blur-[20px] p-6 sm:p-10 border border-white/10 space-y-6 shadow-2xl"
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <span className="text-white font-[450] text-[16px]">{texts.architecture.boxTitle}</span>
            </div>
            <span className="text-[12px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Active
            </span>
          </div>

          <div className="space-y-4 text-white/70 text-[14px] font-[450] leading-relaxed">
            <p>{texts.architecture.boxDesc}</p>
            <div className="p-4 rounded-[16px] bg-black/40 border border-white/10 font-mono text-[12px] text-[#A4F4FD] space-y-1">
              <div>$ docker compose -f docker-compose.prod.yml up -d</div>
              <div className="text-emerald-400">✓ Taskosaur Spring Boot 25 API: Online (Port 3000)</div>
              <div className="text-emerald-400">✓ Taskosaur Next.js 16 Web: Online (Port 3001)</div>
              <div className="text-emerald-400">✓ PostgreSQL 16 & Redis 7: Connected</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// =============================================================================
// Contact & Consultation Section (With taskosaurvn@gmail.com)
// =============================================================================

function ContactSection({ texts }: { texts: typeof TEXTS["vi"] }) {
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
        {/* Left Column: Direct Info with taskosaurvn@gmail.com */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <span className="text-[12px] uppercase tracking-widest text-[#00d2ff] font-semibold block mb-3">
              {texts.contact.eyebrow}
            </span>
            <h2 className="text-white text-[32px] sm:text-[44px] font-normal leading-[1.05] tracking-tight mb-6">
              {texts.contact.title}
            </h2>
            <p className="text-white/70 text-[15px] sm:text-[16px] font-[450] leading-relaxed mb-8">
              {texts.contact.desc}
            </p>

            <div className="space-y-5 text-[14px] text-white/80 font-[450]">
              <a
                href="mailto:taskosaurvn@gmail.com"
                className="flex items-center gap-3 group hover:text-[#00d2ff] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 group-hover:bg-[#00d2ff]/20 flex items-center justify-center transition-colors">
                  <Mail className="w-4 h-4 text-[#00d2ff]" />
                </div>
                <div>
                  <div className="text-white/40 text-[11px] uppercase tracking-wider">{texts.contact.emailLabel}</div>
                  <div className="text-white group-hover:text-[#00d2ff] transition-colors font-medium">
                    taskosaurvn@gmail.com
                  </div>
                </div>
              </a>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Github className="w-4 h-4 text-[#00d2ff]" />
                </div>
                <div>
                  <div className="text-white/40 text-[11px] uppercase tracking-wider">{texts.contact.openSourceLabel}</div>
                  <a
                    href="https://github.com/VinhGH/Taskosaur-Spring"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-[#00d2ff] transition-colors hover:underline"
                  >
                    github.com/VinhGH/Taskosaur-Spring
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-white/50 text-[13px]">
            {texts.contact.guarantee}
          </div>
        </div>

        {/* Right Column: Blooming Contact Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.75, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 85, damping: 14 }}
          className="lg:col-span-7"
        >
          <div className="rounded-[24px] sm:rounded-[32px] bg-[rgba(17,16,15,0.45)] backdrop-blur-[20px] p-6 sm:p-10 border border-white/10 shadow-2xl">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-white text-[24px] font-[450]">
                  {texts.contact.successTitle}
                </h3>
                <p className="text-white/70 text-[15px] max-w-[420px] mx-auto leading-relaxed">
                  {texts.contact.successDesc}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-[13px] font-[450] mb-2">
                      {texts.contact.nameLabel}
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
                      {texts.contact.emailInputLabel}
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
                    {texts.contact.companyLabel}
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
                    {texts.contact.messageLabel}
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
                  className="w-full sm:w-auto h-[50px] px-8 bg-[#E9E9E9] rounded-[12px] text-[#0A0707] text-[15px] font-[450] hover:bg-white transition-colors flex items-center justify-center gap-2 font-medium shadow-lg active:scale-95"
                >
                  <span>{texts.contact.submitBtn}</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// =============================================================================
// Clean Footer (NO VERSION NUMBER)
// =============================================================================

function Footer({ texts }: { texts: typeof TEXTS["vi"] }) {
  return (
    <footer className="relative z-10 w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] py-10 sm:py-14 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 text-[13px] text-white/60">
      <div className="flex items-center gap-3">
        <TaskosaurLogo className="w-6 h-6" />
        <span className="text-white font-[450] text-[16px]">Taskosaur</span>
      </div>

      <div className="flex items-center gap-6 sm:gap-8 flex-wrap justify-center">
        <a href="#features" className="hover:text-white transition-colors">
          {texts.nav.features}
        </a>
        <a href="#workflow" className="hover:text-white transition-colors">
          {texts.nav.workflow}
        </a>
        <a href="#contact" className="hover:text-white transition-colors">
          {texts.nav.contact}
        </a>
        <Link href="/terms-of-service" className="hover:text-white transition-colors">
          {texts.footer.terms}
        </Link>
        <Link href="/privacy-policy" className="hover:text-white transition-colors">
          {texts.footer.privacy}
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

      <div>{texts.footer.rights}</div>
    </footer>
  );
}

// =============================================================================
// Main Export: Apogee-Style Taskosaur Landing Page
// =============================================================================

export function TaskosaurApogeeLanding() {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language?.split("-")[0] || "vi") as "vi" | "en" | "ja";
  const texts = TEXTS[currentLang] || TEXTS.vi;

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
        {/* 1. Header Navigation with Language Switcher */}
        <Nav texts={texts} />

        {/* 2. Hero Section */}
        <div className="flex-1 flex items-center py-8 sm:py-16">
          <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-12">
            {/* Copy Block (Left Column) */}
            <div className="max-w-[593px]">
              {/* 1. Headline */}
              <Animate delay={300} direction="up">
                <h1 className="text-white text-[36px] sm:text-[52px] md:text-[64px] lg:text-[72px] font-normal leading-[0.95] mb-5 sm:mb-8 tracking-tight">
                  {texts.hero.title}
                </h1>
              </Animate>

              {/* 2. Subhead */}
              <Animate delay={500} direction="up">
                <p className="text-white/80 text-[16px] sm:text-[18px] md:text-[20px] font-[450] leading-[1.3] max-w-[420px] mb-7 sm:mb-10">
                  {texts.hero.subhead}
                </p>
              </Animate>

              {/* 3. CTA Buttons */}
              <Animate delay={700} direction="up">
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <Link
                    href="/register"
                    className="h-[46px] sm:h-[51px] px-5 sm:px-[27px] bg-[#E9E9E9] rounded-[12px] text-[#0A0707] text-[14px] sm:text-[15.5px] font-[450] leading-[15.5px] transition-opacity hover:opacity-90 inline-flex items-center justify-center font-medium shadow-lg"
                  >
                    {texts.hero.ctaPrimary}
                  </Link>

                  <a
                    href="#contact"
                    className="h-[46px] sm:h-[51px] px-5 sm:px-[27px] rounded-[12px] border border-white text-white text-[14px] sm:text-[15.5px] font-[450] leading-[15.5px] transition-opacity hover:opacity-80 inline-flex items-center justify-center font-medium"
                  >
                    {texts.hero.ctaSecondary}
                  </a>
                </div>
              </Animate>
            </div>

            {/* Velocity Stat Card (Right Column) */}
            <VelocityCard texts={texts} />
          </div>
        </div>

        {/* 3. Core Features Showcase (With Flower Blooming Animation) */}
        <FeatureSection texts={texts} />

        {/* 4. Workflow Section (With Flower Blooming Animation) */}
        <WorkflowSection texts={texts} />

        {/* 5. Technical Architecture & Security */}
        <ArchitectureSection texts={texts} />

        {/* 6. Contact & Consultation Section (With taskosaurvn@gmail.com) */}
        <ContactSection texts={texts} />

        {/* 7. Clean Footer (No Version) */}
        <Footer texts={texts} />
      </div>
    </div>
  );
}

export default TaskosaurApogeeLanding;
