import Link from "next/link";
import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface EntityCardProps {
  href?: string;
  onClick?: () => void;
  leading: ReactNode;
  heading: ReactNode;
  subheading?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  className?: string;
  role?: string;
}

export function EntityCard({
  href,
  onClick,
  leading,
  heading,
  subheading,
  description,
  role,
  footer,
  className = "",
}: EntityCardProps) {
  const isSafePath = !href || (/^\/[^/]/.test(href) && !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(href));

  const Inner = () => (
    <Card
      onClick={onClick}
      className={`bg-[var(--card)] rounded-xl shadow-xs group hover:shadow-md hover:border-[var(--primary)]/50 transition-all duration-200 border border-[var(--border)] ${onClick || href ? "cursor-pointer" : ""} p-4.5 flex flex-col justify-between min-h-[195px] h-full gap-3 ${className}`}
    >
      {/* Top Row */}
      <div className="flex items-start gap-3 w-full">
        {leading}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors leading-snug line-clamp-2">
            {heading}
          </div>
          {subheading && (
            <div className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-1">{subheading}</div>
          )}
        </div>
        {role && (
          <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] text-[11px] font-medium shrink-0">
            {role
              ?.replace("_", " ")
              .toLowerCase()
              .replace(/\b\w/g, (l) => l.toUpperCase())}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="text-xs text-[var(--muted-foreground)] line-clamp-2 leading-relaxed flex-1">
        {description || "No description provided"}
      </div>

      {/* Footer */}
      {footer && (
        <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] mt-auto pt-2.5 border-t border-[var(--border)]/40 w-full">
          {footer}
        </div>
      )}
    </Card>
  );

  return href && isSafePath ? (
    <Link href={href} style={{ textDecoration: "none" }}>
      <Inner />
    </Link>
  ) : (
    <Inner />
  );
}
