import React from "react";
import { Card, CardBody, Chip, Skeleton } from "@heroui/react";
import { FiCheckCircle, FiClipboard, FiStar } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import {
  fetchResponseSummary,
  ResponseSummary,
} from "../../../services/responseService";

interface ResponseSummarySectionProps {
  formId: string;
  isQuizForm: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string;
  badgeColor: "success" | "warning" | "primary" | "default";
  isLoading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  colorClass,
  badgeColor,
  isLoading,
}) => (
  <Card className="w-full shadow-xs border border-gray-100 dark:border-gray-700/60">
    <CardBody className="flex flex-row items-center gap-3 p-3 sm:p-4">
      <div className={`text-xl sm:text-2xl shrink-0 ${colorClass}`}>{icon}</div>
      <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
          {label}
        </span>
        {isLoading ? (
          <Skeleton className="h-6 w-10 rounded" />
        ) : (
          <Chip color={badgeColor} size="sm" variant="flat" className="font-semibold w-fit">
            {value}
          </Chip>
        )}
      </div>
    </CardBody>
  </Card>
);

export const ResponseSummarySection: React.FC<ResponseSummarySectionProps> = ({
  formId,
  isQuizForm,
}) => {
  const { data: summary, isLoading } = useQuery<ResponseSummary | null>({
    queryKey: ["responseSummary", formId],
    queryFn: () => fetchResponseSummary(formId),
    staleTime: 30000,
    gcTime: 300000,
    enabled: !!formId,
  });

  const toScore = summary?.toScore ?? 0;
  const completed = summary?.completed ?? 0;
  const submitted = summary?.submitted ?? 0;

  const hasActionable = isQuizForm ? toScore > 0 : submitted > 0;

  return (
    <div className="space-y-2.5 w-full">
      <div className="flex items-center gap-2">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
          Response Overview
        </h3>
        {hasActionable && (
          <Chip color="warning" size="sm" variant="dot">
            Action needed
          </Chip>
        )}
      </div>
      <div
        className={`grid gap-2.5 sm:gap-3.5 w-full ${
          isQuizForm
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2"
        }`}
      >
        <StatCard
          icon={<FiCheckCircle />}
          label="Completed"
          value={completed}
          colorClass="text-green-500"
          badgeColor="success"
          isLoading={isLoading}
        />
        <StatCard
          icon={<FiClipboard />}
          label="Submitted (pending verify)"
          value={submitted}
          colorClass="text-blue-500"
          badgeColor="primary"
          isLoading={isLoading}
        />
        {isQuizForm && (
          <StatCard
            icon={<FiStar />}
            label="Pending score"
            value={toScore}
            colorClass={toScore > 0 ? "text-yellow-500" : "text-gray-400"}
            badgeColor={toScore > 0 ? "warning" : "default"}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};
