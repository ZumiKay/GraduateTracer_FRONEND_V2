import React from "react";
import { Button, Spinner } from "@heroui/react";
import { FiMail, FiLink, FiBarChart } from "react-icons/fi";

interface DashboardHeaderProps {
  onEmailModalOpen: () => void;
  onGenerateLink: () => void;
  formId: string;
  isGeneratingLink: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onEmailModalOpen,
  onGenerateLink,
  formId,
  isGeneratingLink,
}) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold dark:text-gray-100">
          Response Management
        </h2>
      </div>
      <div className="flex gap-2">
        <Button
          color="primary"
          startContent={<FiMail />}
          onPress={onEmailModalOpen}
        >
          Send Links
        </Button>
        <Button
          color="secondary"
          startContent={isGeneratingLink ? <Spinner size="sm" /> : <FiLink />}
          onPress={onGenerateLink}
          isLoading={isGeneratingLink}
          disabled={isGeneratingLink}
        >
          {isGeneratingLink ? "Generating..." : "Generate Link"}
        </Button>
        <Button
          color="success"
          startContent={<FiBarChart />}
          onPress={() => window.open(`/analytics/${formId}`, "_blank")}
        >
          Analytics
        </Button>
      </div>
    </div>
  );
};
