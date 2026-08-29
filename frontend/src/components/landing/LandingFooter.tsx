import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { SiGithub, SiDiscord } from "react-icons/si";

export function LandingFooter() {
  const { t } = useTranslation("landing");

  const footerLinks = {
    products: [
      { name: t("features.tab_kanban", "Bảng Kanban"), href: "#features" },
      { name: t("features.tab_sprint", "Quản lý Sprint"), href: "#features" },
      { name: t("features.tab_gantt", "Sơ đồ Gantt"), href: "#features" },
      { name: t("features.tab_ai", "Trợ lý AI Task Execution"), href: "#ai-era" },
      { name: "Quy trình làm việc tùy biến", href: "#features" },
    ],
    resources: [
      { name: "Tài liệu hướng dẫn (Docs)", href: "/docs" },
      { name: "Mã nguồn mở GitHub", href: "https://github.com/Taskosaur/Taskosaur" },
      { name: "API Documentation", href: "/api/docs" },
      { name: "Lộ trình phát triển (Roadmap)", href: "#" },
    ],
    community: [
      { name: "GitHub Discussions", href: "https://github.com/Taskosaur/Taskosaur/discussions" },
      { name: "Báo lỗi & Đóng góp (Issues)", href: "https://github.com/Taskosaur/Taskosaur/issues" },
      { name: "Cộng đồng Discord", href: "https://discord.gg/5cpHUSxePp" },
      { name: "Hỗ trợ khách hàng", href: "mailto:support@taskosaur.com" },
    ],
    legal: [
      { name: "Điều khoản dịch vụ", href: "/terms-of-service" },
      { name: "Chính sách bảo mật", href: "/privacy-policy" },
      { name: "Bảo mật hệ thống", href: "/security" },
      { name: "Giấy phép mã nguồn", href: "https://github.com/Taskosaur/Taskosaur/blob/main/LICENSE.md" },
    ],
  };

  return (
    <footer className="bg-white dark:bg-[#070913] border-t border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/taskosaur-logo.svg"
                  alt="Taskosaur Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-bold text-xl text-zinc-950 dark:text-white tracking-tight">
                Taskosaur
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
              {t(
                "footer.desc",
                "Nền tảng quản lý dự án Agile mã nguồn mở tích hợp trợ lý AI thực thi tác vụ tự động. Được thiết kế cho các đội ngũ công nghệ hiện đại."
              )}
            </p>
            <div className="flex items-center gap-4 pt-2 text-zinc-500">
              <a
                href="https://github.com/Taskosaur/Taskosaur"
                target="_blank"
                rel="noreferrer"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <SiGithub className="size-5" />
              </a>
              <a
                href="https://discord.gg/5cpHUSxePp"
                target="_blank"
                rel="noreferrer"
                className="hover:text-indigo-500 transition-colors"
              >
                <SiDiscord className="size-5" />
              </a>
            </div>
          </div>

          {/* Column 1: Products */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-zinc-950 dark:text-white mb-4">
              {t("footer.products", "Sản phẩm")}
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.products.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Resources */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-zinc-950 dark:text-white mb-4">
              {t("footer.resources", "Tài nguyên")}
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.resources.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal & Community */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-zinc-950 dark:text-white mb-4">
              {t("footer.legal", "Pháp lý & Hỗ trợ")}
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-12 mt-12 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} {t("footer.all_rights", "Taskosaur Project. All rights reserved.")}</p>
        </div>
      </div>
    </footer>
  );
}
