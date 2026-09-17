import React from "react";
import { SEO } from "@/components/common/SEO";
import { TaskosaurApogeeLanding } from "@/components/landing/TaskosaurApogeeLanding";

export default function LandingPage() {
  return (
    <>
      <SEO
        title="Taskosaur - Bứt phá năng suất dự án với Trợ lý AI thực thi tác vụ"
        description="Nền tảng quản lý dự án Agile thế hệ mới với AI Task Execution tự động. Lập kế hoạch Sprint, theo dõi Kanban thời gian thực và đồng bộ GitHub 2 chiều."
      />
      <TaskosaurApogeeLanding />
    </>
  );
}
