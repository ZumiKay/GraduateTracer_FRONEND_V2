import { memo } from "react";
import { CircularProgress } from "@heroui/react";

interface FormSummaryHeaderProps {
  isValidating: boolean;
  formTotalScore?: number;
  formExtraScore?: number;
  formTotalQuestion?: number;
  formTotalPage?: number;
}

const FormSummaryHeader = memo(
  ({
    isValidating,
    formTotalScore,
    formTotalPage,
    formTotalQuestion,
    formExtraScore,
  }: FormSummaryHeaderProps) => {
    return (
      <div className="w-full bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="w-full max-w-4xl mx-auto">
          {/* Stats strip — always 3 columns, never stacks */}
          <div className="border-t border-gray-100 dark:border-gray-700">
            {isValidating ? (
              <div className="flex justify-center py-3">
                <CircularProgress aria-label="Loading progress" size="sm" />
              </div>
            ) : (
              <div className="grid grid-cols-3">
                <div className="flex flex-col items-center py-2 sm:py-3.5 gap-0.5 border-r border-gray-100 dark:border-gray-700">
                  <span className="text-base sm:text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums leading-none">
                    {formTotalScore ?? 0}
                  </span>
                  <span className="text-[10px] sm:text-xs text-blue-500 dark:text-blue-400 font-medium mt-0.5">
                    Total Score
                  </span>
                </div>

                <div className="flex flex-col items-center py-2 sm:py-3.5 gap-0.5 border-r border-gray-100 dark:border-gray-700">
                  <span className="text-base sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
                    {formTotalQuestion ?? 0}
                  </span>
                  <span className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                    Questions
                  </span>
                </div>

                <div className="flex flex-col items-center py-2 sm:py-3.5 gap-0.5">
                  <span className="text-base sm:text-2xl font-bold text-violet-600 dark:text-violet-400 tabular-nums leading-none">
                    {formTotalPage ?? 0}
                  </span>
                  <span className="text-[10px] sm:text-xs text-violet-600 dark:text-violet-400 font-medium mt-0.5">
                    Pages
                  </span>
                </div>
                <div className="flex flex-col items-center py-2 sm:py-3.5 gap-0.5">
                  <span className="text-base sm:text-2xl font-bold text-violet-600 dark:text-violet-400 tabular-nums leading-none">
                    {formExtraScore ?? 0}
                  </span>
                  <span className="text-[10px] sm:text-xs text-violet-600 dark:text-violet-400 font-medium mt-0.5">
                    Extra Score
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

FormSummaryHeader.displayName = "FormSummaryHeader";

export default FormSummaryHeader;
