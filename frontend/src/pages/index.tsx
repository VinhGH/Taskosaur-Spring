import React from "react";
import { SEO } from "@/components/common/SEO";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingAIBanner } from "@/components/landing/LandingAIBanner";
import { LandingFeaturesShowcase } from "@/components/landing/LandingFeaturesShowcase";
import { LandingDeepDive } from "@/components/landing/LandingDeepDive";
import { LandingSocialProof } from "@/components/landing/LandingSocialProof";
import { LandingDiscoveryGrid } from "@/components/landing/LandingDiscoveryGrid";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <>
      <SEO
        title="Taskosaur - Nền tảng Quản lý Dự án Agile tích hợp Trợ lý AI Task Execution"
        description="Nền tảng quản lý dự án Agile thế hệ mới với AI Task Execution tự động. Lập kế hoạch Sprint, theo dõi Kanban thời gian thực và bứt phá tốc độ phát triển."
      />
      <div className="min-h-screen bg-white dark:bg-[#090c17] text-zinc-900 dark:text-white selection:bg-blue-500 selection:text-white font-sans scroll-smooth overflow-x-hidden">
        {/* Navigation Bar */}
        <LandingNavbar />

        {/* 1. Hero Section */}
        <LandingHero />

        {/* 2. AI Era Highlight Banner */}
        <LandingAIBanner />

        {/* 3. Interactive Features Tab Showcase */}
        <LandingFeaturesShowcase />

        {/* 4. Deep-dive Matrix */}
        <LandingDeepDive />

        {/* 5. Social Proof & Metrics */}
        <LandingSocialProof />

        {/* 6. Discovery Grid */}
        <LandingDiscoveryGrid />

        {/* 7. Final Call to Action */}
        <LandingCTA />

        {/* 8. Footer */}
        <LandingFooter />
      </div>
    </>
  );
}
