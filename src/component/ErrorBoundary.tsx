import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@heroui/react";
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from "@heroicons/react/24/outline";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || "An unexpected error occurred.";
      const componentStack = this.state.errorInfo?.componentStack || "";

      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-4">
              <ExclamationTriangleIcon className="w-8 h-8" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              The application encountered an unexpected error. You can try refreshing the page or navigating back to the home screen.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full mb-4">
              <Button
                color="primary"
                variant="solid"
                className="flex-1 font-semibold"
                startContent={<ArrowPathIcon className="w-4 h-4" />}
                onPress={this.handleReload}
              >
                Reload Page
              </Button>
              <Button
                color="default"
                variant="flat"
                className="flex-1 font-semibold"
                startContent={<HomeIcon className="w-4 h-4" />}
                onPress={this.handleGoHome}
              >
                Home / Dashboard
              </Button>
            </div>

            <div className="w-full text-left mt-2 border-t border-gray-100 dark:border-gray-700 pt-3">
              <button
                type="button"
                onClick={this.toggleDetails}
                className="text-xs text-primary font-medium hover:underline focus:outline-none flex items-center justify-between w-full"
              >
                <span>{this.state.showDetails ? "Hide Error Details" : "Show Error Details"}</span>
                <span>{this.state.showDetails ? "▲" : "▼"}</span>
              </button>

              {this.state.showDetails && (
                <div className="mt-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-950 font-mono text-xs overflow-x-auto max-h-60 text-danger border border-danger/20">
                  <p className="font-bold mb-1">{errorMessage}</p>
                  {componentStack && (
                    <pre className="whitespace-pre-wrap text-[11px] text-gray-600 dark:text-gray-400 mt-2">
                      {componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
