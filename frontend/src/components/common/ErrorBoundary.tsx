import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, LayoutDashboard, Home, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Taskosaur ErrorBoundary] Uncaught client-side exception:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  handleGoDashboard = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
  };

  handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const text = `Taskosaur Client Error:\nMessage: ${error?.message}\nStack: ${error?.stack}\nComponent Stack: ${errorInfo?.componentStack}`;
    navigator.clipboard.writeText(text);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, copied, showDetails } = this.state;

      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#dbeafe] via-[#ede9fe] to-[#e0e7ff] dark:from-[#0f172a] dark:via-[#1e1b4b] dark:to-[#111827] text-[var(--foreground)]">
          {/* Ambient Glows */}
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative w-full max-w-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center z-10 animate-fadeIn">
            {/* Warning Icon with Glow */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-lg">
                <AlertTriangle className="w-10 h-10 stroke-[2.2]" />
              </div>
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
              Đã xảy ra sự cố ngoài ý muốn
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 leading-relaxed">
              Taskosaur đã bắt giữ lỗi hiển thị để bảo vệ phiên làm việc của bạn. Hãy thử tải lại trang hoặc quay về trang chủ.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center w-full mb-6">
              <Button
                onClick={this.handleReload}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 px-5 gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Tải lại trang
              </Button>
              <Button
                variant="outline"
                onClick={this.handleGoDashboard}
                className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Vào Bảng điều khiển
              </Button>
              <Button
                variant="ghost"
                onClick={this.handleGoHome}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground gap-2"
              >
                <Home className="w-4 h-4" />
                Trang chủ
              </Button>
            </div>

            {/* Collapsible Technical Details for Debugging */}
            {error && (
              <div className="w-full border-t border-gray-200 dark:border-gray-800/80 pt-4 text-left">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <button
                    type="button"
                    onClick={this.toggleDetails}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    <span>{showDetails ? "Ẩn thông tin kỹ thuật" : "Xem chi tiết lỗi kỹ thuật"}</span>
                  </button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={this.handleCopyError}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Đã sao chép" : "Sao chép lỗi"}</span>
                  </Button>
                </div>

                {showDetails && (
                  <div className="rounded-lg bg-gray-950 p-3.5 text-xs font-mono text-rose-300 overflow-x-auto max-h-56 scrollbar-thin scrollbar-thumb-gray-800 shadow-inner">
                    <p className="font-bold text-rose-400 mb-1">{error.toString()}</p>
                    {error.stack && (
                      <pre className="text-gray-400 whitespace-pre-wrap text-[11px] leading-relaxed">
                        {error.stack}
                      </pre>
                    )}
                    {errorInfo?.componentStack && (
                      <pre className="text-gray-500 whitespace-pre-wrap text-[11px] leading-relaxed mt-2 border-t border-gray-800 pt-2">
                        {errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
