import React, { ReactNode, useEffect, useState } from "react";
import OrganizationProvider from "@/contexts/organization-context";
import WorkspaceProvider from "@/contexts/workspace-context";
import ProjectProvider from "@/contexts/project-context";
import SprintProvider from "@/contexts/sprint-context";
import TaskProvider from "@/contexts/task-context";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { useLayout } from "@/contexts/layout-context";
import { NotificationProvider } from "@/contexts/notification-context";

interface CommonProvidersProps {
  children: ReactNode;
}

export default function PublicProviders({ children }: CommonProvidersProps) {
  const [mounted, setMounted] = useState(false);
  const { show404 } = useLayout();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <OrganizationProvider>
      <NotificationProvider>
        <WorkspaceProvider>
          <ProjectProvider>
            <SprintProvider>
              <TaskProvider>
                {/* If showing 404, render children without layout */}
                {show404 ? (
                  <>{children}</>
                ) : (
                  <div
                    className="min-h-screen relative flex flex-col h-screen overflow-hidden p-2 md:p-3 bg-gradient-to-br from-[#dbeafe] via-[#ede9fe] to-[#e0e7ff] dark:from-[#111827] dark:via-[#1e1b4b] dark:to-[#0f172a]"
                    style={{ scrollbarGutter: "stable" }}
                  >
                    {/* Vivid Multi-Color Aurora Mesh Lighting System */}
                    {/* Top Left: Electric Indigo/Blue Aurora */}
                    <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vh] bg-blue-500/35 dark:bg-blue-500/40 rounded-full blur-[100px] pointer-events-none -z-10" />

                    {/* Top Right: Vivid Neon Purple/Fuchsia */}
                    <div className="absolute -top-[5%] -right-[10%] w-[50vw] h-[50vh] bg-fuchsia-500/30 dark:bg-purple-500/40 rounded-full blur-[110px] pointer-events-none -z-10" />

                    {/* Center Glow: Vibrant Cyan Flare */}
                    <div className="absolute top-[35%] left-[25%] w-[45vw] h-[45vh] bg-cyan-400/25 dark:bg-cyan-500/25 rounded-full blur-[130px] pointer-events-none -z-10" />

                    {/* Center Right: Glowing Amber Sunset */}
                    <div className="absolute top-[40%] -right-[8%] w-[40vw] h-[45vh] bg-amber-400/30 dark:bg-amber-500/30 rounded-full blur-[110px] pointer-events-none -z-10" />

                    {/* Bottom Left: Vibrant Emerald Mint */}
                    <div className="absolute -bottom-[12%] -left-[5%] w-[50vw] h-[45vh] bg-emerald-400/30 dark:bg-teal-500/30 rounded-full blur-[110px] pointer-events-none -z-10" />

                    {/* Bottom Right: Vivid Coral/Rose */}
                    <div className="absolute -bottom-[10%] right-[10%] w-[45vw] h-[40vh] bg-rose-400/30 dark:bg-rose-500/30 rounded-full blur-[110px] pointer-events-none -z-10" />

                    <div className="flex h-full w-full gap-2.5 md:gap-3 overflow-hidden z-10">
                      <Sidebar />
                      <div className="flex-1 flex flex-col overflow-hidden rounded-xl md:rounded-2xl border border-white/40 dark:border-white/10 bg-[var(--panel)] backdrop-blur-2xl shadow-2xl shadow-indigo-950/20 dark:shadow-black/60">
                        <Header />
                        <div
                          className="flex-1 overflow-y-scroll scrollbar-none"
                          style={{ scrollbarGutter: "stable" }}
                        >
                          {mounted && (
                            <div
                              id="modal-root"
                              className="fixed z-[1000] inset-0 pointer-events-none"
                            />
                          )}
                          <div className="max-w-[96%] mx-auto py-2">{children}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TaskProvider>
            </SprintProvider>
          </ProjectProvider>
        </WorkspaceProvider>
        </NotificationProvider>
      </OrganizationProvider>
    </>
  );
}
