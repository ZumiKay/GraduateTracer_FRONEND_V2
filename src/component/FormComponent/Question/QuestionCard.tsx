import React from "react";
import { Card, CardBody, Chip, Tooltip, Button } from "@heroui/react";
import { ContentType } from "../../../types/Form.types";
import { getQuestionTypeLabel, getQuestionTitle, canToggleVisibility } from "./utils";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ConnectionIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  FolderIcon,
} from "./Assets";
import ValidationIssueDisplay from "../ValidationIssueDisplay";

interface QuestionCardProps {
  question: ContentType;
  level: number;
  parentQuestion?: ContentType;
  isExpanded: boolean;
  hasChildren?: boolean;
  onQuestionClick: (question: ContentType) => void;
  onToggleVisibility: (question: ContentType) => void;
  onToggleExpanded: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  level,
  parentQuestion,
  isExpanded,
  hasChildren,
  onQuestionClick,
  onToggleVisibility,
  onToggleExpanded,
}) => {
  const isChild = level > 0;
  const isChildVisibility = question.children && question.children.every((i) => i.isVisible);

  const levelBorderColors = [
    "border-primary",
    "border-amber-500",
    "border-blue-500",
    "border-purple-500",
  ];
  const borderColor = levelBorderColors[level % levelBorderColors.length];

  // Static indentation classes to avoid broken dynamic string interpolation in Tailwind
  const indentClass =
    level === 0
      ? "mt-2.5"
      : level === 1
        ? "mt-2 ml-1.5 sm:ml-2.5 pl-1.5 sm:pl-2"
        : level === 2
          ? "mt-2 ml-2.5 sm:ml-4 pl-1.5 sm:pl-2"
          : "mt-2 ml-3.5 sm:ml-5 pl-1.5 sm:pl-2";

  return (
    <div
      id={`question-card-${question._id || question.qIdx}`}
      data-question-id={question._id || question.qIdx}
      data-qidx={question.qIdx}
      className={`transition-all duration-200 ${indentClass}`}
    >
      <Card
        className={`
          group cursor-pointer transition-all duration-200 ease-out
          hover:shadow-md active:scale-[0.99]
          ${isChild ? `border-l-3 ${borderColor}` : "border border-gray-200/80 dark:border-gray-700/80"}
          relative overflow-visible bg-white dark:bg-gray-800/90
        `}
        shadow="none"
      >
        <CardBody className="p-2.5 sm:p-3.5" onClick={() => onQuestionClick(question)}>
          {/* Parent indicator for conditional child questions */}
          {isChild && parentQuestion && (
            <div className="mb-1.5 p-1.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-md border border-blue-200/60 dark:border-blue-800/40 flex items-center gap-1.5 text-xs overflow-hidden">
              <ConnectionIcon width="12" height="12" className="text-blue-500 shrink-0" />
              <span className="text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap shrink-0 text-[11px]">
                Child of:
              </span>
              <Tooltip content={getQuestionTitle(parentQuestion)} placement="top">
                <span className="text-blue-800 dark:text-blue-200 truncate font-normal text-[11px] hover:underline">
                  {getQuestionTitle(parentQuestion)}
                </span>
              </Tooltip>
            </div>
          )}

          {/* Top meta row: Badges & Action Buttons */}
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            {/* Badges */}
            <div className="flex items-center gap-1 flex-wrap min-w-0">
              {level > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold shrink-0">
                  L{level + 1}
                </span>
              )}
              <Chip
                size="sm"
                color="primary"
                variant="flat"
                className="text-[11px] h-5 px-1.5 shrink-0 font-medium"
              >
                {getQuestionTypeLabel(question.type)}
              </Chip>
              {question.conditional && question.conditional.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-medium shrink-0">
                  Cond
                </span>
              )}
              {question.require && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 font-medium shrink-0">
                  Required
                </span>
              )}
            </div>

            {/* Action buttons with comfortable tap target */}
            <div
              className="flex items-center gap-0.5 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {canToggleVisibility(question) && (
                <Tooltip
                  content={isChildVisibility ? "Hide question" : "Show question"}
                  placement="top"
                >
                  <Button
                    size="sm"
                    variant="light"
                    isIconOnly
                    onPress={() => onToggleVisibility(question)}
                    className={`w-7 h-7 min-w-7 rounded-full p-0 transition-colors ${
                      isChildVisibility
                        ? "text-primary hover:bg-primary/10"
                        : "text-danger hover:bg-danger/10"
                    }`}
                    aria-label={isChildVisibility ? "Hide question" : "Show question"}
                  >
                    {isChildVisibility ? (
                      <EyeIcon width="15" height="15" />
                    ) : (
                      <EyeSlashIcon width="15" height="15" />
                    )}
                  </Button>
                </Tooltip>
              )}
              {hasChildren && (
                <Tooltip content={isExpanded ? "Collapse" : "Expand"} placement="top">
                  <Button
                    size="sm"
                    variant="light"
                    isIconOnly
                    onPress={onToggleExpanded}
                    className="w-7 h-7 min-w-7 rounded-full p-0 text-amber-600 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
                    aria-label={isExpanded ? "Collapse section" : "Expand section"}
                  >
                    {isExpanded ? (
                      <ChevronUpIcon width="15" height="15" />
                    ) : (
                      <ChevronDownIcon width="15" height="15" />
                    )}
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Question title */}
          <div className="flex items-start gap-1.5">
            <div className="mt-0.5 shrink-0">
              {hasChildren ? (
                <FolderIcon width="16" height="16" className="text-amber-500" />
              ) : (
                <DocumentTextIcon width="16" height="16" className="text-blue-500" />
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2 sm:line-clamp-3 transition-colors leading-snug group-hover:text-primary">
              {getQuestionTitle(question)}
            </p>
          </div>

          {/* Bottom metadata */}
          {(Boolean(question.score && question.score > 0) ||
            Boolean(hasChildren && question.children && question.children.length > 0)) && (
            <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-700/60 text-[11px] text-gray-500 dark:text-gray-400">
              {question.score && question.score > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {question.score} pts
                </span>
              )}
              {question.score &&
                question.score > 0 &&
                hasChildren &&
                question.children &&
                question.children.length > 0 && <span>•</span>}
              {hasChildren && question.children && question.children.length > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  {question.children.length} {question.children.length === 1 ? "child" : "children"}
                </span>
              )}
            </div>
          )}

          {/* Per-question validation issues */}
          {question.validationIssues && question.validationIssues.length > 0 && (
            <div className="mt-1.5">
              <ValidationIssueDisplay issues={question.validationIssues} />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
