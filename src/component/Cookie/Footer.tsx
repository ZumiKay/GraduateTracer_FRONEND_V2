import React from "react";
import { Link, Divider } from "@heroui/react";
import { FiHeart, FiShield, FiMail } from "react-icons/fi";
import CookieSettingsButton from "./CookieSettingsButton";

interface FooterProps {
  companyName?: string;
  version?: string;
  contactEmail?: string;
  className?: string;
}

const Footer: React.FC<FooterProps> = ({
  companyName = "Graduate Tracer",
  version = "1.0.0",
  contactEmail = "support@graduatetracer.com",
  className = "",
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`mt-auto bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
          {/* Company Info */}
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              {companyName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Empowering educational institutions with comprehensive graduate
              tracking solutions and innovative form management tools.
            </p>
            <div className="inline-flex flex-wrap items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-full px-3 py-1 shadow-sm">
              <span className="font-medium">v{version}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                Made with <FiHeart className="text-red-500 animate-pulse" />
              </span>
              <span className="hidden sm:inline">for educators</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Links
            </h3>
            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform"
              >
                📊 Dashboard
              </Link>
              <Link
                href="/privacy-policy"
                className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform"
              >
                <FiShield className="inline mr-2" />
                Privacy Policy
              </Link>
              <Link
                href={`mailto:${contactEmail}`}
                className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 hover:translate-x-1 transform"
              >
                <FiMail className="inline mr-2" />
                Contact Support
              </Link>
            </div>
          </div>

          {/* Privacy & Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Privacy & Settings
            </h3>
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <CookieSettingsButton
                  variant="light"
                  size="sm"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 justify-start p-0 min-w-0 h-auto"
                >
                  🍪 Manage Cookie Preferences
                </CookieSettingsButton>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Click above to change your cookie preferences at any time.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Divider className="my-5 sm:my-7 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-0">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium text-center sm:text-left">
            © {currentYear} {companyName}. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <Link
              href="/privacy-policy"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-300 dark:text-gray-600 select-none">|</span>
            <Link
              href="/terms-of-service"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              Terms of Service
            </Link>
            <span className="text-gray-300 dark:text-gray-600 select-none">|</span>
            <CookieSettingsButton
              variant="light"
              size="sm"
              className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 p-0 min-w-0 h-auto"
            >
              Cookie Settings
            </CookieSettingsButton>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
