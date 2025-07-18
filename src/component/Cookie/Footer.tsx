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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {companyName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Empowering educational institutions with comprehensive graduate
              tracking solutions and innovative form management tools.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-full px-3 py-1 shadow-sm">
              <span className="font-medium">Version {version}</span>
              <span>•</span>
              <span>Made with</span>
              <FiHeart className="text-red-500 animate-pulse" />
              <span>for educators</span>
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

        <Divider className="my-8 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            © {currentYear} {companyName}. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
            <Link
              href="/privacy-policy"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-400">•</span>
            <Link
              href="/terms-of-service"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              Terms of Service
            </Link>
            <span className="text-gray-400">•</span>
            <CookieSettingsButton
              variant="light"
              size="sm"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 p-0 min-w-0 h-auto"
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
