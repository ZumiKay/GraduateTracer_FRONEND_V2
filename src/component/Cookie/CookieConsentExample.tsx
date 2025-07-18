import React, { useEffect } from "react";
import { Card, CardHeader, CardBody, Button, Code } from "@heroui/react";
import { FiActivity, FiTrendingUp, FiUser, FiSettings } from "react-icons/fi";
import {
  useCookieConsent,
  useAnalytics,
  useMarketing,
  useUserPreferences,
} from "../../hooks/useCookieConsent";

/**
 * Example component demonstrating how to use cookie consent hooks
 * This component shows how to track analytics, marketing events, and user preferences
 * based on user consent.
 */
const CookieConsentExample: React.FC = () => {
  const { hasConsent, preferences } = useCookieConsent();
  const { track, trackPageView, trackUserAction, isAnalyticsAllowed } =
    useAnalytics();
  const { trackSignup, trackConversionEvent, isMarketingAllowed } =
    useMarketing();
  const { setTheme, getTheme, setLanguage, getLanguage, isFunctionalAllowed } =
    useUserPreferences();

  // Track page view when component mounts (only if analytics allowed)
  useEffect(() => {
    trackPageView("Cookie Consent Example");
  }, [trackPageView]);

  const handleAnalyticsTest = () => {
    trackUserAction("button_click", "analytics_test", "demo");
    track("demo_event", {
      component: "CookieConsentExample",
      action: "analytics_test",
      value: 1,
    });
  };

  const handleMarketingTest = () => {
    trackSignup({
      source: "demo",
      campaign: "cookie_consent_example",
    });

    trackConversionEvent({
      event_type: "demo_conversion",
      value: 100,
      currency: "USD",
    });
  };

  const handleThemeChange = () => {
    const currentTheme = getTheme();
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);

    // Track theme change if analytics allowed
    trackUserAction("theme_change", "theme_toggle", newTheme);
  };

  const handleLanguageChange = () => {
    const currentLang = getLanguage();
    const newLang = currentLang === "en" ? "es" : "en";
    setLanguage(newLang);

    // Track language change if analytics allowed
    trackUserAction("language_change", "language_toggle", newLang);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FiSettings className="text-xl text-blue-600" />
            <div>
              <h2 className="text-xl font-bold">Cookie Consent Status</h2>
              <p className="text-sm text-gray-600">
                Current consent preferences
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Has given consent:</span>
              <Code color={hasConsent ? "success" : "danger"}>
                {hasConsent ? "Yes" : "No"}
              </Code>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span>Necessary:</span>
                <Code color="success">
                  {preferences.necessary ? "Enabled" : "Disabled"}
                </Code>
              </div>
              <div className="flex items-center justify-between">
                <span>Functional:</span>
                <Code color={preferences.functional ? "success" : "default"}>
                  {preferences.functional ? "Enabled" : "Disabled"}
                </Code>
              </div>
              <div className="flex items-center justify-between">
                <span>Analytics:</span>
                <Code color={preferences.analytics ? "success" : "default"}>
                  {preferences.analytics ? "Enabled" : "Disabled"}
                </Code>
              </div>
              <div className="flex items-center justify-between">
                <span>Marketing:</span>
                <Code color={preferences.marketing ? "success" : "default"}>
                  {preferences.marketing ? "Enabled" : "Disabled"}
                </Code>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Analytics Testing */}
        <Card className={`${!isAnalyticsAllowed ? "opacity-50" : ""}`}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <FiActivity className="text-xl text-purple-600" />
              <div>
                <h3 className="font-semibold">Analytics Testing</h3>
                <p className="text-sm text-gray-600">Track user interactions</p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <p className="text-sm">
                Status:{" "}
                <Code color={isAnalyticsAllowed ? "success" : "danger"}>
                  {isAnalyticsAllowed ? "Enabled" : "Disabled"}
                </Code>
              </p>
              <Button
                color="secondary"
                variant="flat"
                className="w-full"
                onPress={handleAnalyticsTest}
                isDisabled={!isAnalyticsAllowed}
                startContent={<FiActivity />}
              >
                Test Analytics Event
              </Button>
              <p className="text-xs text-gray-500">
                {isAnalyticsAllowed
                  ? "Click to send analytics events to console"
                  : "Enable analytics cookies to use this feature"}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Marketing Testing */}
        <Card className={`${!isMarketingAllowed ? "opacity-50" : ""}`}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <FiTrendingUp className="text-xl text-orange-600" />
              <div>
                <h3 className="font-semibold">Marketing Testing</h3>
                <p className="text-sm text-gray-600">Track conversions</p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <p className="text-sm">
                Status:{" "}
                <Code color={isMarketingAllowed ? "success" : "danger"}>
                  {isMarketingAllowed ? "Enabled" : "Disabled"}
                </Code>
              </p>
              <Button
                color="warning"
                variant="flat"
                className="w-full"
                onPress={handleMarketingTest}
                isDisabled={!isMarketingAllowed}
                startContent={<FiTrendingUp />}
              >
                Test Marketing Event
              </Button>
              <p className="text-xs text-gray-500">
                {isMarketingAllowed
                  ? "Click to send marketing events to console"
                  : "Enable marketing cookies to use this feature"}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Functional Testing */}
        <Card className={`${!isFunctionalAllowed ? "opacity-50" : ""}`}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <FiUser className="text-xl text-green-600" />
              <div>
                <h3 className="font-semibold">Preferences Testing</h3>
                <p className="text-sm text-gray-600">Save user preferences</p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <p className="text-sm">
                Status:{" "}
                <Code color={isFunctionalAllowed ? "success" : "danger"}>
                  {isFunctionalAllowed ? "Enabled" : "Disabled"}
                </Code>
              </p>
              <div className="space-y-2">
                <Button
                  color="success"
                  variant="flat"
                  size="sm"
                  className="w-full"
                  onPress={handleThemeChange}
                  isDisabled={!isFunctionalAllowed}
                  startContent={<FiSettings />}
                >
                  Toggle Theme ({getTheme() || "none"})
                </Button>
                <Button
                  color="success"
                  variant="flat"
                  size="sm"
                  className="w-full"
                  onPress={handleLanguageChange}
                  isDisabled={!isFunctionalAllowed}
                  startContent={<FiSettings />}
                >
                  Toggle Language ({getLanguage() || "none"})
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                {isFunctionalAllowed
                  ? "Click to save preferences in cookies"
                  : "Enable functional cookies to use this feature"}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Integration Guide</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Analytics Integration</h4>
              <Code className="text-sm">
                {`const { trackPageView, trackUserAction } = useAnalytics();
trackPageView("Dashboard");
trackUserAction("button_click", "save_form", "form_123");`}
              </Code>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Marketing Integration</h4>
              <Code className="text-sm">
                {`const { trackSignup, trackConversionEvent } = useMarketing();
trackSignup({ source: "organic", campaign: "homepage" });
trackConversionEvent({ event_type: "purchase", value: 99.99 });`}
              </Code>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. User Preferences</h4>
              <Code className="text-sm">
                {`const { setPreference, getPreference } = useUserPreferences();
setPreference("dashboard_layout", "grid");
const layout = getPreference("dashboard_layout");`}
              </Code>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default CookieConsentExample;
