import React, { useMemo } from "react";
import { TimeRange, ViewMode } from "@/types";
import { getViewModeWidth, isWeekend } from "@/utils/gantt";

interface GanttGridProps {
  timeRange: TimeRange;
  viewMode: ViewMode;
  visibleRange: { startIndex: number; endIndex: number };
  leftOffset: number;
}

export const GanttGrid: React.FC<GanttGridProps> = React.memo(({
  timeRange,
  viewMode,
  visibleRange,
  leftOffset,
}) => {
  const cellWidth = getViewModeWidth(viewMode);
  
  const { visibleDays, spacerLeft, spacerRight } = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    const visibleDays = timeRange.days
      .slice(startIndex, endIndex + 1)
      .map((day, i) => ({ day, index: startIndex + i }));
    
    const spacerLeft = startIndex * cellWidth;
    const spacerRight = (timeRange.days.length - 1 - endIndex) * cellWidth;

    return { visibleDays, spacerLeft, spacerRight };
  }, [timeRange.days, visibleRange, cellWidth]);

  return (
    <div 
      className="absolute inset-0 pointer-events-none flex"
      style={{ left: leftOffset, height: "100%", width: `${timeRange.days.length * cellWidth}px` }}
    >
      {spacerLeft > 0 && <div style={{ width: `${spacerLeft}px` }} className="shrink-0 h-full" />}
      {visibleDays.map(({ day, index }) => {
        const isToday = new Date().toDateString() === day.toDateString();
        return (
          <div
            key={index}
            className={`border-r border-[var(--border)] shrink-0 h-full ${
              isWeekend(day) && viewMode === "days"
                ? "bg-[var(--muted)]/30"
                : isToday
                  ? "bg-blue-50/30 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                  : ""
            }`}
            style={{ width: `${cellWidth}px` }}
          >
            {isToday && (
              <div className="w-full h-full border-l-2 border-blue-400/50 dark:border-blue-500/30"></div>
            )}
          </div>
        );
      })}
      {spacerRight > 0 && <div style={{ width: `${spacerRight}px` }} className="shrink-0 h-full" />}
    </div>
  );
});

GanttGrid.displayName = "GanttGrid";
