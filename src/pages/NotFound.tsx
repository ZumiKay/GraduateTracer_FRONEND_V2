import React from "react";
import { Link } from "react-router";

const NotFound: React.FC = () => {
  return (
    <div className="inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center flex flex-col items-center gap-6">
        {/* Big 404 */}
        <div className="relative select-none">
          <span className="text-[10rem] sm:text-[14rem] font-black leading-none bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">
            404
          </span>
          <span className="absolute inset-0 flex items-center justify-center text-[10rem] sm:text-[14rem] font-black leading-none text-indigo-500/10 blur-2xl select-none pointer-events-none">
            404
          </span>
        </div>

        {/* Divider */}
        <div className="w-16 h-1 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500" />

        {/* Text */}
        <div className="flex flex-col gap-2 max-w-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Page Not Found
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* CTA */}
        <Link
          to="/"
          className="mt-2 inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"
            />
          </svg>
          Go to Homepage
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
