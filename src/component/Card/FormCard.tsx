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

// Memoized checkbox component
const SelectionCheckbox = memo(({ isSelect }: { isSelect: boolean }) => (
  <div className="ml-2">
    <div
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
        isSelect
          ? "bg-blue-500 border-blue-500"
          : "border-gray-300 hover:border-blue-400"
      }`}
    >
      {isSelect && (
        <svg
          className="w-3 h-3 text-white"
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
  // Memoize type color calculation
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

  // Memoize formatted dates
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

  // Memoize card class names
  const cardClassName = useMemo(() => {
    return `h-fit cursor-pointer transition-all duration-200 hover:shadow-lg ${
      isSelect ? "ring-2 ring-blue-500 shadow-lg bg-blue-50" : ""
    } ${isManage ? "hover:scale-105 select-none" : ""}`;
  }, [isSelect, isManage]);

  // Memoize type label
  const typeLabel = useMemo(() => {
    return type === FormTypeEnum.Quiz ? "Quiz" : "Normal";
  }, [type]);

  return (
    <Card className={cardClassName} isPressable onPress={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start w-full">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
              {data.title || "Untitled Form"}
            </h3>
            <div className="flex flex-wrap gap-2">
              <Chip
                size="sm"
                color={typeColor}
                variant="flat"
                className="text-xs"
              >
                {typeLabel}
              </Chip>
              {data.setting?.email && (
                <Chip
                  size="sm"
                  color="warning"
                  variant="flat"
                  className="text-xs"
                >
                  Email Required
                </Chip>
              )}
            </div>
          </div>
          {isManage && <SelectionCheckbox isSelect={isSelect} />}
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Created: {`${data.createdAt}`}</span>
            {formattedDates.updated && (
              <span>Updated: {`${data.updatedAt}`}</span>
            )}
          </div>
          {data.totalpage && (
            <div className="text-xs text-gray-500">
              {data.totalpage} page{data.totalpage > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

FormCard.displayName = "FormCard";

export default memo(FormCard);
