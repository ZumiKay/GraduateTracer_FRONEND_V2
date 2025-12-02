import React, { memo, useMemo } from "react";
import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { FormDataType, FormTypeEnum } from "../../types/Form.types";

interface FormCardProps {
  data: FormDataType;
  type: FormTypeEnum;
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
          : "border-gray-300 hover:border-blue-400 hover:shadow-md bg-white dark:bg-gray-700 dark:border-gray-600"
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

const FormCard: React.FC<FormCardProps> = ({
  data,
  type,
  isManage,
  onClick,
  isSelect,
}) => {
  const typeColor = useMemo(() => {
    switch (type) {
      case FormTypeEnum.Quiz:
        return "primary";
      case FormTypeEnum.Normal:
        return "success";
      default:
        return "default";
    }
  }, [type]);

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
      created: formatDate(data.createdAt || new Date()),
      updated: data.updatedAt ? formatDate(data.updatedAt) : null,
    };
  }, [data.createdAt, data.updatedAt]);

  const cardClassName = useMemo(() => {
    return `h-fit cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 ${
      isSelect
        ? "ring-2 ring-blue-500 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700"
        : "hover:shadow-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
    } ${isManage ? "hover:scale-[1.02] select-none" : ""} rounded-xl border`;
  }, [isSelect, isManage]);

  const typeLabel = useMemo(() => {
    return type === FormTypeEnum.Quiz ? "Quiz" : "Normal";
  }, [type]);

  return (
    <Card className={cardClassName} isPressable onPress={onClick}>
      <CardHeader className="pb-3 px-6 pt-6">
        <div className="flex justify-between items-start w-full">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 line-clamp-2 leading-tight">
              {data.title || "Untitled Form"}
            </h3>
            <div className="flex flex-wrap gap-2">
              <Chip
                size="sm"
                color={typeColor}
                variant="flat"
                className="text-xs font-medium px-3 py-1"
              >
                {typeLabel}
              </Chip>
              {data.setting?.email && (
                <Chip
                  size="sm"
                  color="warning"
                  variant="flat"
                  className="text-xs font-medium px-3 py-1"
                >
                  📧 Email Required
                </Chip>
              )}
              {data.isFilled && (
                <Chip
                  size="sm"
                  color="success"
                  variant="solid"
                  className="text-xs font-medium px-3 py-1 text-white"
                >
                  ✓ Completed
                </Chip>
              )}
            </div>
          </div>
          {isManage && <SelectionCheckbox isSelect={isSelect} />}
        </div>
      </CardHeader>
      <CardBody className="pt-0 px-6 pb-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">📅</span>
              <span className="font-medium">Created:</span>
              <span>{formattedDates.created}</span>
            </div>
            {formattedDates.updated && (
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">🔄</span>
                <span className="font-medium">Updated:</span>
                <span>{formattedDates.updated}</span>
              </div>
            )}
          </div>
          {data.totalpage && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="text-gray-500">📄</span>
                <span className="font-medium">
                  {data.totalpage} page{data.totalpage > 1 ? "s" : ""}
                </span>
              </div>
              {data.totalscore && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="text-gray-500">🏆</span>
                  <span className="font-medium">{data.totalscore} points</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

FormCard.displayName = "FormCard";

export default memo(FormCard);
