import React from "react";
import { Button } from "@heroui/react";
import { FiSettings } from "react-icons/fi";
import { useDispatch } from "react-redux";
import { openCookieModal } from "../../redux/cookieConsent.store";

interface CookieSettingsButtonProps {
  variant?:
    | "solid"
    | "bordered"
    | "light"
    | "flat"
    | "faded"
    | "shadow"
    | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

const CookieSettingsButton: React.FC<CookieSettingsButtonProps> = ({
  variant = "light",
  size = "sm",
  className = "",
  children = "Cookie Settings",
}) => {
  const dispatch = useDispatch();

  const handleOpenCookieSettings = () => {
    console.log("Cookie settings button clicked - dispatching openCookieModal");
    // Open the cookie settings modal
    dispatch(openCookieModal());
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} transition-all duration-200`}
      onPress={handleOpenCookieSettings}
      startContent={<FiSettings className="text-inherit" />}
    >
      {children}
    </Button>
  );
};

export default CookieSettingsButton;
