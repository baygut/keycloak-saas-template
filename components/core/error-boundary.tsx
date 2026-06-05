"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { logClientError } from "@/actions/log-error";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    void logClientError(error.message, errorInfo.componentStack ?? undefined);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback(this.state.error, this.handleReset);
      }
      if (this.props.fallback) {
        return this.props.fallback as ReactNode;
      }
      return (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 dark:border-red-500/30 dark:bg-red-500/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-red-800 dark:text-red-200">
                Component rendering error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                {this.state.error.message ||
                  "An error occurred while rendering this component."}
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={this.handleReset}
              >
                Try again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
