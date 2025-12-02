import React from "react";

import { Link } from "react-router";

const NotFound: React.FC = () => {
  return (
    <div className="not-found min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
          Page Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Sorry, the page you are looking for does not exist.
        </p>
        <Link
          to="/"
          className="inline-block mt-6 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
