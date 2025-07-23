import React from "react";
import { Card, CardBody } from "@heroui/react";

interface FormStateCardProps {
  type: "loading" | "closed" | "success" | "error";
  title: string;
  message: string;
  subMessage?: string;
  icon: string;
}

export const FormStateCard: React.FC<FormStateCardProps> = ({
  type,
  title,
  message,
  subMessage,
  icon,
}) => {
  const getCardClass = () => {
    switch (type) {
      case "closed":
        return "form-closed-card";
      case "success":
        return "form-success-card";
      default:
        return "";
    }
  };

  const getTitleClass = () => {
    switch (type) {
      case "closed":
        return "form-closed-title";
      case "success":
        return "form-success-title";
      default:
        return "";
    }
  };

  const getTextClass = () => {
    switch (type) {
      case "closed":
        return "form-closed-text";
      case "success":
        return "form-success-text";
      default:
        return "";
    }
  };

  const getSubTextClass = () => {
    switch (type) {
      case "closed":
        return "form-closed-subtext";
      case "success":
        return "form-success-subtext";
      default:
        return "";
    }
  };

  return (
    <Card className={getCardClass()}>
      <CardBody className="text-center p-8">
        <div className="text-6xl mb-4">{icon}</div>
        <h2 className={`text-2xl font-bold mb-4 ${getTitleClass()}`}>
          {title}
        </h2>
        <p className={`mb-4 ${getTextClass()}`}>{message}</p>
        {subMessage && (
          <p className={`text-sm ${getSubTextClass()}`}>{subMessage}</p>
        )}
      </CardBody>
    </Card>
  );
};
