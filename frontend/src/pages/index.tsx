import React from "react";
import { SEO } from "@/components/common/SEO";
import { TaskosaurCinematicLanding } from "@/components/landing/TaskosaurCinematicLanding";

export default function LandingPage() {
  return (
    <>
      <SEO
        title="Taskosaur - Nền tảng Quản lý Dự án Agile tích hợp Trợ lý AI Task Execution"
        description="Nền tảng quản lý dự án Agile thế hệ mới với AI Task Execution tự động. Lập kế hoạch Sprint, theo dõi Kanban thời gian thực và bứt phá tốc độ phát triển."
      />
      <TaskosaurCinematicLanding />
    </>
  );
}
