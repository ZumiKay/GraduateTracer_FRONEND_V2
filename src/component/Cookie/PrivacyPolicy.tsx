import React from "react";
import { Card, CardHeader, CardBody, Divider, Link } from "@heroui/react";
import { FiShield, FiInfo, FiMail } from "react-icons/fi";

interface PrivacyPolicyProps {
  companyName?: string;
  contactEmail?: string;
  lastUpdated?: string;
  className?: string;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({
  companyName = "Graduate Tracer",
  contactEmail = "support@graduatetracer.com",
  lastUpdated = new Date().toLocaleDateString(),
  className = "",
}) => {
  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <FiShield className="text-2xl text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Privacy Policy & Cookie Notice
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last updated: {lastUpdated}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              1. Information We Collect
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              {companyName} collects information to provide better services to
              our users. We collect information in the following ways:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>Information you give us (account details, form responses)</li>
              <li>
                Information we get from your use of our services (analytics,
                usage data)
              </li>
              <li>Information from cookies and similar technologies</li>
            </ul>
          </section>

          <Divider />

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              2. How We Use Cookies
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              We use cookies and similar technologies to enhance your experience
              on our website. Our cookies fall into the following categories:
            </p>

            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  <FiShield className="inline mr-2" />
                  Necessary Cookies
                </h3>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  Essential for website functionality, security, and user
                  authentication. These cannot be disabled.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  <FiInfo className="inline mr-2" />
                  Functional Cookies
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Remember your preferences and settings to enhance your
                  experience. Examples: theme preferences, language settings.
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  <FiInfo className="inline mr-2" />
                  Analytics Cookies
                </h3>
                <p className="text-purple-700 dark:text-purple-300 text-sm">
                  Help us understand how visitors interact with our website by
                  collecting and reporting information anonymously.
                </p>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                  <FiInfo className="inline mr-2" />
                  Marketing Cookies
                </h3>
                <p className="text-orange-700 dark:text-orange-300 text-sm">
                  Used to track visitors across websites and display targeted
                  advertisements that are relevant to you.
                </p>
              </div>
            </div>
          </section>

          <Divider />

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              3. Your Rights and Choices
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>Access, update, or delete your personal information</li>
              <li>Opt out of marketing communications</li>
              <li>Control cookie preferences through our cookie banner</li>
              <li>Request data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <Divider />

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              4. Data Security
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We implement appropriate technical and organizational measures to
              protect your personal information against unauthorized access,
              alteration, disclosure, or destruction.
            </p>
          </section>

          <Divider />

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              5. Third-Party Services
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Our website may contain links to third-party websites or services.
              We are not responsible for the privacy practices of these third
              parties. We encourage you to review their privacy policies.
            </p>
          </section>

          <Divider />

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              6. Changes to This Policy
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new Privacy Policy on
              this page and updating the "Last updated" date.
            </p>
          </section>

          <Divider />

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              7. Contact Us
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              If you have any questions about this Privacy Policy or our cookie
              practices, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <FiMail className="text-blue-600" />
                <Link
                  href={`mailto:${contactEmail}`}
                  className="text-blue-600 hover:underline"
                >
                  {contactEmail}
                </Link>
              </div>
            </div>
          </section>
        </CardBody>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
