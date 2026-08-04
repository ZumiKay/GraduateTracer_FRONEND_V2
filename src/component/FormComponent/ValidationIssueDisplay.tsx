import React, { useState, memo } from "react";
import { QuestionValidationIssue } from "../../types/Form.types";

interface ValidationIssueDisplayProps {
  issues: QuestionValidationIssue[];
}

/**
 * Displays per-question validation errors and warnings in a collapsible
 * toggle container. The header shows counts with red (error) and yellow
 * (warning) indicators. Clicking expands to reveal each issue.
 */
const ValidationIssueDisplay: React.FC<ValidationIssueDisplayProps> = memo(
  ({ issues }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!issues || issues.length === 0) return null;

    const errors = issues.filter((i) => i.type === "error");
    const warnings = issues.filter((i) => i.type === "warning");

    return (
      <div className="mt-2">
        {/* Toggle Header */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className={`
            w-full flex items-center justify-between gap-2
            px-3 py-2 rounded-lg text-xs font-medium
            transition-all duration-200 cursor-pointer
            ${
              errors.length > 0
                ? "bg-red-50 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:hover:bg-red-900/30"
                : "bg-amber-50 border border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:hover:bg-amber-900/30"
            }
          `}
        >
          <div className="flex items-center gap-2">
            {/* Validation icon */}
            <svg
              className={`w-3.5 h-3.5 flex-shrink-0 ${
                errors.length > 0
                  ? "text-red-500"
                  : "text-amber-500"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span
              className={
                errors.length > 0
                  ? "text-red-700 dark:text-red-400"
                  : "text-amber-700 dark:text-amber-400"
              }
            >
              Validation
            </span>

            {/* Error count badge */}
            {errors.length > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white min-w-[18px]">
                {errors.length}
              </span>
            )}

            {/* Warning count badge */}
            {warnings.length > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white min-w-[18px]">
                {warnings.length}
              </span>
            )}
          </div>

          {/* Chevron */}
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            } ${
              errors.length > 0
                ? "text-red-400"
                : "text-amber-400"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Expanded Issue List */}
        {isOpen && (
          <div className="mt-1.5 space-y-1 animate-in slide-in-from-top-1 duration-200">
            {issues.map((issue, idx) => (
              <div
                key={`validation-issue-${idx}`}
                className={`
                  flex items-start gap-2 px-3 py-1.5 rounded-md text-xs
                  ${
                    issue.type === "error"
                      ? "bg-red-50/70 text-red-700 dark:bg-red-900/10 dark:text-red-400"
                      : "bg-amber-50/70 text-amber-700 dark:bg-amber-900/10 dark:text-amber-400"
                  }
                `}
              >
                {/* Dot indicator */}
                <span
                  className={`
                    mt-1 w-2 h-2 rounded-full flex-shrink-0
                    ${issue.type === "error" ? "bg-red-500" : "bg-amber-500"}
                  `}
                />
                <span className="leading-relaxed">{issue.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

ValidationIssueDisplay.displayName = "ValidationIssueDisplay";

export default ValidationIssueDisplay;
