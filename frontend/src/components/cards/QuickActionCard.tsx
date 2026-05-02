import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  href: string;
  className?: string;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon,
  title,
  href,
  className,
}) => {
  const isSafePath = /^\/[^/]/.test(href) && !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(href);

  const Content = (
    <Card className={`group quickactioncard-container ${className}`}>
      <CardContent className="quickactioncard-content">
        <div className="quickactioncard-icon">
          <div className="text-white">{icon}</div>
        </div>
        <h3 className="quickactioncard-title">{title}</h3>
      </CardContent>
    </Card>
  );

  return isSafePath ? (
    <Link href={href}>
      {Content}
    </Link>
  ) : (
    <div className="opacity-50 cursor-not-allowed">
      {Content}
    </div>
  );
};
