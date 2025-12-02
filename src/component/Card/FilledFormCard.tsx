import React, { memo, useMemo } from "react";
import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { FormDataType, FormTypeEnum } from "../../types/Form.types";
import { FiCheckCircle, FiAward, FiCalendar, FiClock } from "react-icons/fi";

interface FilledFormCardProps {
  data: FormDataType;
  isManage: boolean;
  onClick: () => void;
  isSelect: boolean;
}

const SelectionCheckbox = memo(({ isSelect }: { isSelect: boolean }) => (
  <div className="ml-3">
    <div
      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 shadow-sm ${
        isSelect
          ? "bg-blue-500 border-blue-500 shadow-blue-200"
          : "border-gray-300 hover:border-blue-400 hover:shadow-md bg-white"
      }`}
    >
      {isSelect && (
        <svg
          className="w-4 h-4 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
  </div>
));

SelectionCheckbox.displayName = "SelectionCheckbox";

const FilledFormCard: React.FC<FilledFormCardProps> = ({
  data,
  isManage,
  onClick,
  isSelect,
}) => {
  const isQuiz = data.type === FormTypeEnum.Quiz;

  const formattedDates = useMemo(() => {
    const formatDate = (date: string | Date) => {
      if (!date) return "N/A";
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

    return {
      submitted: data.updatedAt
        ? formatDate(data.updatedAt)
        : data.createdAt
        ? formatDate(data.createdAt)
        : "N/A",
    };
  }, [data.createdAt, data.updatedAt]);

  const cardClassName = useMemo(() => {
    return `h-fit cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 ${
      isSelect
        ? "ring-2 ring-blue-500 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700"
        : "hover:shadow-lg border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
    } ${
      isManage ? "hover:scale-[1.02] select-none" : ""
    } rounded-xl border-2 dark:bg-gray-800`;
  }, [isSelect, isManage]);

  const scorePercentage = useMemo(() => {
    if (
      !isQuiz ||
      !data.submittedResult?.totalScore ||
      !data.submittedResult?.maxScore
    )
      return null;
    return Math.round(
      (data.submittedResult.totalScore / data.submittedResult.maxScore) * 100
    );
  }, [isQuiz, data.submittedResult]);

  const completionStatus = useMemo(() => {
    if (data.submittedResult?.isComplete) return "Completed";
    if (data.submittedResult?.isNonScore) return "No Score";
    return "Submitted";
  }, [data.submittedResult]);

  return (
    <Card className={cardClassName} isPressable onPress={onClick}>
      <CardHeader className="pb-3 px-6 pt-6">
        <div className="flex justify-between items-start w-full">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FiCheckCircle className="text-green-600 dark:text-green-400 text-xl" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
                {data.title || "Untitled Form"}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Chip
                size="sm"
                color="success"
                variant="solid"
                className="text-xs font-medium px-3 py-1 text-white"
              >
                ✓ Filled
              </Chip>
              <Chip
                size="sm"
                color={isQuiz ? "primary" : "default"}
                variant="flat"
                className="text-xs font-medium px-3 py-1"
              >
                {isQuiz ? "Quiz" : "Form"}
              </Chip>
              {isQuiz && data.submittedResult?.totalScore !== undefined && (
                <Chip
                  size="sm"
                  color="secondary"
                  variant="flat"
                  className="text-xs font-medium px-3 py-1"
                  startContent={<FiAward className="w-3 h-3" />}
                >
                  Score: {data.submittedResult.totalScore}/
                  {data.submittedResult.maxScore || "?"}
                </Chip>
              )}
            </div>
          </div>
          {isManage && <SelectionCheckbox isSelect={isSelect} />}
        </div>
      </CardHeader>
      <CardBody className="pt-0 px-6 pb-6">
        <div className="space-y-4">
          {/* Status and Date Info */}
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FiCalendar className="text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status:
                </span>
              </div>
              <Chip
                size="sm"
                color="success"
                variant="flat"
                className="font-medium"
              >
                {completionStatus}
              </Chip>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FiClock className="text-gray-500 dark:text-gray-400" />
              <span className="font-medium">Submitted:</span>
              <span>{formattedDates.submitted}</span>
            </div>
          </div>

          {/* Score Card for Quiz */}
          {isQuiz && data.submittedResult?.totalScore !== undefined && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Your Score
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {data.submittedResult.totalScore}
                    <span className="text-lg text-gray-500 dark:text-gray-400">
                      /{data.submittedResult.maxScore || "?"}
                    </span>
                  </p>
                </div>
                {scorePercentage !== null && (
                  <div className="text-right">
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      {scorePercentage}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Grade
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Response Message */}
          {data.submittedResult?.message && (
            <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <span className="font-semibold">Note:</span>{" "}
                {data.submittedResult.message}
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

FilledFormCard.displayName = "FilledFormCard";

export default memo(FilledFormCard);
