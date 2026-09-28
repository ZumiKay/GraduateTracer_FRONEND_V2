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
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 w-full">
      <div className="flex items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold dark:text-gray-100 tracking-tight">
          Response Management
        </h2>
      </div>
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
        <Button
          color="primary"
          size="sm"
          className="flex-1 sm:flex-none text-xs sm:text-sm font-medium"
          startContent={<FiMail className="shrink-0 text-base" />}
          onPress={onEmailModalOpen}
        >
          Send Links
        </Button>
        <Button
          color="secondary"
          size="sm"
          className="flex-1 sm:flex-none text-xs sm:text-sm font-medium"
          startContent={isGeneratingLink ? <Spinner size="sm" /> : <FiLink className="shrink-0 text-base" />}
          onPress={onGenerateLink}
          isLoading={isGeneratingLink}
          disabled={isGeneratingLink}
        >
          {isGeneratingLink ? "Generating..." : "Generate Link"}
        </Button>
        <Button
          color="success"
          size="sm"
          className="flex-1 sm:flex-none text-xs sm:text-sm font-medium"
          startContent={<FiBarChart className="shrink-0 text-base" />}
          onPress={() => window.open(`/analytics/${formId}`, "_blank")}
        >
          Analytics
        </Button>
      </div>
    </div>
  );
};
