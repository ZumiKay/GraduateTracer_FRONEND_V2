import React, { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Switch,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Link,
  Chip,
} from "@heroui/react";
import { FiSettings, FiShield, FiInfo, FiCheck } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import {
  getCookieConsent,
  setCookieConsentToStorage,
} from "../../utils/cookieUtils";
import {
  setConsentPreferences,
  setCookieConsent,
  updateConsentPreferences,
  closeCookieModal,
} from "../../redux/cookieConsent.store";

export interface CookieConsentProps {
  // Optional props for customization
  className?: string;
  position?: "bottom" | "top" | "bottom-left" | "bottom-right";
  companyName?: string;
  privacyPolicyUrl?: string;
}

export type CookieCategory =
  | "necessary"
  | "functional"
  | "analytics"
  | "marketing";

export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieConsent: React.FC<CookieConsentProps> = ({
  className = "",
  position = "bottom",
  companyName = "Graduate Tracer",
  privacyPolicyUrl = "#",
}) => {
  const dispatch = useDispatch();
  const cookieState = useSelector((state: RootState) => state.cookieConsent);
  const { hasConsent, preferences, isModalOpen } = cookieState;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showBanner, setShowBanner] = useState(false);

  // Handle modal open/close from Redux state
  useEffect(() => {
    if (isModalOpen && !isOpen) {
      setTimeout(() => onOpen(), 100); // Small delay to ensure proper rendering
    } else if (!isModalOpen && isOpen) {
      onClose();
    }
  }, [isModalOpen, isOpen, onOpen, onClose]);

  // Custom close handler to update Redux state
  const handleModalClose = () => {
    console.log("Modal closing via handleModalClose");
    dispatch(closeCookieModal());
  };

  useEffect(() => {
    const consentData = getCookieConsent();
    if (consentData) {
      dispatch(setCookieConsent(consentData.hasConsent));
      dispatch(setConsentPreferences(consentData.preferences));
    } else {
      // Show banner if no consent has been given
      setShowBanner(true);
    }
  }, [dispatch]);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };

    dispatch(setCookieConsent(true));
    dispatch(setConsentPreferences(allAccepted));
    setCookieConsentToStorage(true, allAccepted);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };

    dispatch(setCookieConsent(true));
    dispatch(setConsentPreferences(onlyNecessary));
    setCookieConsentToStorage(true, onlyNecessary);
    setShowBanner(false);
  };

  const handleCustomize = () => {
    onOpen();
  };

  const handleSavePreferences = () => {
    dispatch(setCookieConsent(true));
    setCookieConsentToStorage(true, preferences);
    setShowBanner(false);
    handleModalClose();
  };

  const handleTogglePreference = (category: CookieCategory) => {
    if (category === "necessary") return; // Necessary cookies cannot be disabled

    dispatch(
      updateConsentPreferences({
        ...preferences,
        [category]: !preferences[category],
      })
    );
  };

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "top-0 left-0 right-0";
      case "bottom":
        return "bottom-0 left-0 right-0";
      case "bottom-left":
        return "bottom-4 left-4 max-w-md";
      case "bottom-right":
        return "bottom-4 right-4 max-w-md";
      default:
        return "bottom-0 left-0 right-0";
    }
  };

  const cookieCategories = [
    {
      key: "necessary" as CookieCategory,
      title: "Necessary",
      description: "Essential for website functionality and security",
      icon: <FiShield className="text-green-600" />,
      required: true,
    },
    {
      key: "functional" as CookieCategory,
      title: "Functional",
      description: "Enhance user experience and remember preferences",
      icon: <FiSettings className="text-blue-600" />,
      required: false,
    },
    {
      key: "analytics" as CookieCategory,
      title: "Analytics",
      description: "Help us understand how visitors interact with our website",
      icon: <FiInfo className="text-purple-600" />,
      required: false,
    },
    {
      key: "marketing" as CookieCategory,
      title: "Marketing",
      description: "Used to track visitors and display targeted advertisements",
      icon: <FiSettings className="text-orange-600" />,
      required: false,
    },
  ];

  return (
    <>
      {/* Cookie Consent Banner */}
      {showBanner && !hasConsent && (
        <div
          className={`fixed ${getPositionClasses()} z-[9999] p-4 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 shadow-lg ${className}`}
        >
          <Card className="w-full">
            <CardBody className="py-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <FiSettings className="text-2xl text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    We use cookies
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    We use cookies to enhance your experience, analyze site
                    usage, and personalize content. By continuing to use our
                    site, you agree to our use of cookies.{" "}
                    <Link
                      href={privacyPolicyUrl}
                      className="text-blue-600 hover:underline"
                      isExternal
                    >
                      Learn more
                    </Link>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      color="primary"
                      size="sm"
                      onPress={handleAcceptAll}
                      startContent={<FiCheck />}
                    >
                      Accept All
                    </Button>
                    <Button
                      variant="bordered"
                      size="sm"
                      onPress={handleRejectAll}
                    >
                      Reject All
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      onPress={handleCustomize}
                      startContent={<FiSettings />}
                    >
                      Customize
                    </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Cookie Preferences Modal - Always render so it can be opened from footer */}
      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-h-[90vh]",
          body: "py-6",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center space-x-2">
              <FiSettings className="text-xl text-blue-600" />
              <span>Cookie Preferences</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
              Manage your cookie preferences for {companyName}
            </p>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {cookieCategories.map((category) => (
                <div key={category.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">{category.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {category.title}
                          </h4>
                          {category.required && (
                            <Chip size="sm" color="success" variant="flat">
                              Required
                            </Chip>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={preferences[category.key]}
                      onValueChange={() => handleTogglePreference(category.key)}
                      isDisabled={category.required}
                      color="primary"
                    />
                  </div>
                  <div className="border-b border-gray-200 dark:border-gray-700"></div>
                </div>
              ))}

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  About Cookie Management
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  You can change your cookie preferences at any time by clicking
                  the cookie settings button in the footer or by visiting our{" "}
                  <Link
                    href={privacyPolicyUrl}
                    className="underline"
                    isExternal
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleModalClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSavePreferences}
              startContent={<FiCheck />}
            >
              Save Preferences
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CookieConsent;
