import React, { memo, useMemo } from "react";
import { QuestionValidationIssue } from "../../types/Form.types";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";

export interface ValidationIssueDisplayProps {
  issues?: QuestionValidationIssue[];
  errors?: QuestionValidationIssue[];
  warnings?: QuestionValidationIssue[];
  className?: string;
}

const ValidationIssueDisplay: React.FC<ValidationIssueDisplayProps> = memo(
  ({ issues, errors, warnings, className = "" }) => {
    const allErrors = useMemo(() => {
      if (errors && errors.length > 0) return errors;
      return issues?.filter((item) => item.type === "error") || [];
    }, [errors, issues]);

    const allWarnings = useMemo(() => {
      if (warnings && warnings.length > 0) return warnings;
      return issues?.filter((item) => item.type === "warning") || [];
    }, [warnings, issues]);

    if (allErrors.length === 0 && allWarnings.length === 0) {
      return null;
    }

    return (
      <div className={`w-full space-y-2.5 mt-3 ${className}`}>
        {/* Errors Block */}
        {allErrors.length > 0 && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-800/60 transition-all"
          >
            <div className="flex items-start gap-2.5">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-red-700 dark:text-red-300">
                <p className="font-semibold text-sm leading-tight text-red-800 dark:text-red-200">
                  {allErrors.length === 1
                    ? "Validation Error"
                    : `${allErrors.length} Validation Errors`}
                </p>
                {allErrors.length === 1 ? (
                  <p>{allErrors[0].message}</p>
                ) : (
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    {allErrors.map((err, idx) => (
                      <li key={`err-${idx}`}>{err.message}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Warnings Block */}
        {allWarnings.length > 0 && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/60 transition-all"
          >
            <div className="flex items-start gap-2.5">
              <ExclamationCircleIcon className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-amber-700 dark:text-amber-300">
                <p className="font-semibold text-sm leading-tight text-amber-800 dark:text-amber-200">
                  {allWarnings.length === 1
                    ? "Warning"
                    : `${allWarnings.length} Warnings`}
                </p>
                {allWarnings.length === 1 ? (
                  <p>{allWarnings[0].message}</p>
                ) : (
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    {allWarnings.map((warn, idx) => (
                      <li key={`warn-${idx}`}>{warn.message}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

ValidationIssueDisplay.displayName = "ValidationIssueDisplay";

export default ValidationIssueDisplay;
