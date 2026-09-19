// components/ui/chart-wrapper.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartWrapperProps {
  title: string;
  description?: string;
  children: ReactNode;
  config: ChartConfig;
  className?: string;
  extraHeader?: ReactNode;
  icon?: ReactNode;
  chartClassName?: string;
  footer?: ReactNode;
}

export function ChartWrapper({
  title,
  description,
  children,
  config,
  className,
  extraHeader,
  icon,
  chartClassName,
  footer,
}: ChartWrapperProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden border border-border/70 bg-card/95 shadow-xs transition-all duration-200 hover:shadow-sm hover:border-border p-4",
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent group-hover:via-primary/60 transition-all duration-300" />
      <CardHeader className="flex flex-row items-center justify-between p-0 pb-2 space-y-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <div className="p-1 rounded-md bg-primary/10 text-primary shrink-0 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="min-w-0 space-y-0.5">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground truncate">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-[11px] text-muted-foreground line-clamp-1">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
        {extraHeader && <div className="flex items-center gap-2 shrink-0">{extraHeader}</div>}
      </CardHeader>
      <CardContent className="p-0 pt-1">
        <ChartContainer
          config={config}
          className={cn("h-[195px] max-h-[210px] w-full aspect-auto flex justify-center text-xs", chartClassName)}
        >
          {children as React.ReactElement}
        </ChartContainer>
        {footer && <div className="pt-2 border-t border-border/40 mt-2">{footer}</div>}
      </CardContent>
    </Card>
  );
}

