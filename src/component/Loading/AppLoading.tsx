import { memo } from "react";

/**
 * Full-screen loading component for app initialization
 * Shows a modern, animated loading screen while session is being verified
 */
export const AppLoading = memo(() => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-8 animate-fade-in">
        {/* Logo or Brand Area */}
        <div className="relative">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary animate-spin w-24 h-24" />

          {/* Inner pulsing circle */}
          <div className="absolute inset-0 m-3 rounded-full bg-primary/10 animate-pulse" />

          {/* Center icon/text */}
          <div className="w-24 h-24 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        </div>

        {/* Loading text with animated dots */}
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Graduate Tracer
          </h2>
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <span className="text-sm">Loading</span>
            <div className="flex gap-1">
              <span className="animate-bounce animation-delay-0">.</span>
              <span className="animate-bounce animation-delay-200">.</span>
              <span className="animate-bounce animation-delay-400">.</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-progress" />
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes progress {
          0% {
            width: 0%;
            transform: translateX(0);
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }

        .animation-delay-0 {
          animation-delay: 0ms;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </div>
  );
});

AppLoading.displayName = "AppLoading";

/**
 * Compact loading component for page transitions
 */
export const PageLoading = memo(() => (
  <div className="flex items-center justify-center h-48">
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-primary"></div>
      <div className="absolute inset-0 m-2 rounded-full bg-primary/5 animate-pulse"></div>
    </div>
  </div>
));

PageLoading.displayName = "PageLoading";
