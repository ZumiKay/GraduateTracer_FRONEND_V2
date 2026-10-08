import React from "react";
import { Card, Chip, Divider } from "@heroui/react";
import { statusColor } from "../../Response.type";

interface RespondentInfoCardProps {
  displayName: string;
  email: string;
  totalScore?: number;
  maxTotalScore?: number;
  submittedDate: string;
  completionStatus: string;
  scoringMethod?: string;
  isQuizForm: boolean;
  getStatusColor: (status: string) => statusColor;
}

const RespondentInfoCard: React.FC<RespondentInfoCardProps> = ({
  displayName,
  email,
  totalScore,
  maxTotalScore,
  submittedDate,
  completionStatus,
  scoringMethod,
  isQuizForm,
  getStatusColor,
}) => {
  return (
    <Card className="shadow-xl border-2 border-indigo-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="p-4 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3 min-w-0">
            <h4 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{displayName}</h4>
            <p className="text-gray-700 flex items-center gap-2 text-sm sm:text-base min-w-0">
              <span className="w-2 h-2 shrink-0 bg-blue-500 rounded-full"></span>
              <span className="break-all min-w-0">{email}</span>
            </p>
          </div>
          <div className="flex flex-col lg:items-end gap-4">
            {isQuizForm &&
              totalScore !== undefined &&
              maxTotalScore !== undefined && (
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl px-4 py-4 sm:px-8 sm:py-5 text-center border-2 border-blue-300 shadow-xl">
                  <div className="text-3xl sm:text-4xl font-black text-white">
                    {totalScore} / {maxTotalScore}
                  </div>
                  <div className="text-sm text-blue-100 font-bold uppercase tracking-wide mt-2">
                    Total Points
                  </div>
                </div>
              )}
            <div className="flex flex-wrap gap-2">
              <Chip
                size="md"
                color={getStatusColor(completionStatus || "default")}
                variant="flat"
                className="font-medium"
              >
                {completionStatus || "Unknown"}
              </Chip>
              {scoringMethod && (
                <Chip
                  size="md"
                  color="warning"
                  variant="flat"
                  className="font-medium"
                >
                  Manually Scored
                </Chip>
              )}
            </div>
          </div>
        </div>
        <Divider className="my-4" />
        <div className="flex flex-wrap items-center gap-x-2 text-sm text-gray-600">
          <span className="font-medium">Submitted:</span>
          <span>{submittedDate}</span>
        </div>
      </div>
    </Card>
  );
};

export default RespondentInfoCard;
