import React from "react";
import { Card, CardBody, Chip, Tooltip, Button } from "@heroui/react";
import { ContentType } from "../../../types/Form.types";
import {
  EyeIcon,
  EyeSlashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ConnectionIcon,
  FolderIcon,
  QuestionIcon,
  DocumentTextIcon,
} from "./icons";
import {
  getQuestionTypeLabel,
  getQuestionTitle,
  canToggleVisibility,
} from "./utils";

interface QuestionCardProps {
  question: ContentType & { children: ContentType[] };
  level: number;
  parentQuestion?: ContentType;
  index: number;
  isExpanded: boolean;
  hasChildren: boolean;
  isVisible: boolean;
  onQuestionClick: (question: ContentType, index: number) => void;
  onToggleVisibility: (question: ContentType) => void;
  onToggleExpanded: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  level,
  parentQuestion,
  index,
  isExpanded,
  hasChildren,
  isVisible,
  onQuestionClick,
  onToggleVisibility,
  onToggleExpanded,
}) => {
  const isChild = level > 0;
  const levelColors = [
    "border-primary",
    "border-warning",
    "border-secondary",
    "border-success",
  ];
  const borderColor = levelColors[level % levelColors.length];

  return (
    <div
      className={`mt-3 transition-all duration-200 ${
        level > 0 ? `pl-${Math.min(level * 4, 12)}` : ""
      }`}
    >
      <Card
        className={`
          group cursor-pointer transition-all duration-300 ease-out
          hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02] hover:-translate-y-1
          active:scale-[0.98] active:transition-none
          ${isChild ? `border-l-4 ${borderColor} ml-2` : ""}
          relative overflow-hidden
        `}
        isPressable
        onPress={() => onQuestionClick(question, index)}
        shadow="sm"
      >
        <CardBody className="p-3 sm:p-4">
          {/* Parent indicator */}
          {isChild && parentQuestion && (
            <div className="mb-2 p-2 bg-gradient-to-r from-blue-50 to-blue-50/30 rounded-lg border border-blue-200/70">
              <div className="flex items-center gap-2 overflow-hidden">
                <ConnectionIcon
                  width="14"
                  height="14"
                  className="text-blue-500 flex-shrink-0"
                />
                <span className="text-xs text-blue-600 font-medium whitespace-nowrap flex-shrink-0">
                  Child of:
                </span>
                <Tooltip
                  content={getQuestionTitle(parentQuestion)}
                  placement="top"
                >
                  <span className="text-xs text-blue-800 truncate max-w-[150px] hover:underline">
                    {getQuestionTitle(parentQuestion)}
                  </span>
                </Tooltip>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap sm:flex-nowrap">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {level > 0 && (
                <Chip
                  size="sm"
                  color={
                    level === 1
                      ? "secondary"
                      : level === 2
                      ? "warning"
                      : "primary"
                  }
                  variant="flat"
                >
                  L{level + 1}
                </Chip>
              )}
              <Chip size="sm" color="primary" variant="flat">
                {getQuestionTypeLabel(question.type)}
              </Chip>
              {question.conditional && question.conditional.length > 0 && (
                <Chip size="sm" color="warning" variant="flat">
                  Conditional
                </Chip>
              )}
              {question.require && (
                <Chip size="sm" color="danger" variant="flat">
                  Required
                </Chip>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {canToggleVisibility(question) && (
                <Tooltip
                  content={isVisible ? "Hide question" : "Show question"}
                  placement="top"
                >
                  <Button
                    size="sm"
                    variant="light"
                    isIconOnly
                    onPress={() => onToggleVisibility(question)}
                    className={`rounded-full p-1 transition-colors ${
                      isVisible
                        ? "text-primary hover:bg-primary/10"
                        : "text-danger hover:bg-danger/10"
                    }`}
                  >
                    {isVisible ? (
                      <EyeIcon width="16" height="16" />
                    ) : (
                      <EyeSlashIcon width="16" height="16" />
                    )}
                  </Button>
                </Tooltip>
              )}
              {hasChildren && (
                <Tooltip
                  content={isExpanded ? "Collapse" : "Expand"}
                  placement="top"
                >
                  <Button
                    size="sm"
                    variant="light"
                    isIconOnly
                    onPress={onToggleExpanded}
                    className="rounded-full p-1 text-warning hover:bg-warning/10 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUpIcon width="16" height="16" />
                    ) : (
                      <ChevronDownIcon width="16" height="16" />
                    )}
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Question title */}
          <div className="group-hover:text-primary transition-colors flex items-start gap-2">
            <div className="mt-0.5 flex-shrink-0">
              {hasChildren ? (
                <FolderIcon
                  width="18"
                  height="18"
                  className="text-yellow-500"
                />
              ) : (
                <DocumentTextIcon
                  width="18"
                  height="18"
                  className="text-blue-500"
                />
              )}
            </div>
            <p className="text-sm font-medium text-gray-700 line-clamp-3 transition-colors">
              {getQuestionTitle(question)}
            </p>
          </div>

          {/* Bottom metadata */}
          <div className="flex flex-wrap gap-2 mt-2 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {question.score && question.score > 0 && (
                <Chip size="sm" color="success" variant="flat">
                  {question.score} points
                </Chip>
              )}
              {hasChildren && (
                <Chip size="sm" color="warning" variant="dot">
                  {question.children.length}{" "}
                  {question.children.length === 1 ? "child" : "children"}
                </Chip>
              )}
            </div>
            <div className="opacity-70 group-hover:opacity-100 transition-opacity">
              <QuestionIcon width="16" height="16" className="text-gray-500" />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
