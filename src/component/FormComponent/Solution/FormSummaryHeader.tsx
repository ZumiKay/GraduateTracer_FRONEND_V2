import { memo } from "react";
import { CircularProgress, Button, Chip } from "@heroui/react";
import { FormValidationSummary } from "../../../types/Form.types";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";

interface FormTotalSummary {
  totalpage: number;
  totalquestion: number;
  totalscore: number;
}

interface FormSummaryHeaderProps {
  loading: boolean;
  isValidating: boolean;
  totalsummerize?: FormTotalSummary;
  formTotalScore?: number;
  validationSummary: FormValidationSummary | null;
  onValidateAll: () => Promise<void>;
}

const FormSummaryHeader = memo(
  ({
    loading,
    isValidating,
    totalsummerize,
    formTotalScore,
    validationSummary,
    onValidateAll,
  }: FormSummaryHeaderProps) => {
    const isDark = useSelector((root: RootState) => root.globalindex.darkmode);

    const getValidationStatus = () => {
      if (!validationSummary) return null;
      const { totalInvalidQuestions } = validationSummary;

      if (totalInvalidQuestions === 0) {
        return (
          <Chip color="success" variant="flat" size="sm">
            <span className="hidden sm:inline">✓ All validated</span>
            <span className="sm:hidden">✓</span>
          </Chip>
        );
      }

      return (
        <Chip color="warning" variant="flat" size="sm">
          ⚠ {totalInvalidQuestions}
          <span className="hidden sm:inline">
            {" "}
            issue{totalInvalidQuestions !== 1 ? "s" : ""}
          </span>
        </Chip>
      );
    };

    return (
      <div className="w-full bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="w-full max-w-4xl mx-auto">
          {/* Title row */}
          <div className="flex items-center justify-between px-4 py-2.5 sm:px-6 sm:py-4">
            <h2 className="text-sm font-bold text-gray-800 dark:text-white sm:text-xl">
              Form Summary
            </h2>
            <div className="flex items-center gap-2 sm:gap-3">
              {getValidationStatus()}
              <Button
                color="primary"
                variant={isDark ? "solid" : "bordered"}
                size="sm"
                onPress={onValidateAll}
                isLoading={isValidating}
              >
                <span className="hidden sm:inline">Validate All</span>
                <span className="sm:hidden">Validate</span>
              </Button>
            </div>
          </div>

          {/* Stats strip — always 3 columns, never stacks */}
          <div className="border-t border-gray-100 dark:border-gray-700">
            {loading ? (
              <div className="flex justify-center py-3">
                <CircularProgress aria-label="Loading progress" size="sm" />
              </div>
            ) : (
              <div className="grid grid-cols-3">
                <div className="flex flex-col items-center py-2 sm:py-3.5 gap-0.5 border-r border-gray-100 dark:border-gray-700">
                  <span className="text-base sm:text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums leading-none">
                    {formTotalScore ?? totalsummerize?.totalscore ?? 0}
                  </span>
                  <span className="text-[10px] sm:text-xs text-blue-500 dark:text-blue-400 font-medium mt-0.5">
                    Total Score
                  </span>
                </div>

                <div className="flex flex-col items-center py-2 sm:py-3.5 gap-0.5 border-r border-gray-100 dark:border-gray-700">
                  <span className="text-base sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
                    {totalsummerize?.totalquestion ?? 0}
                  </span>
                  <span className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                    Questions
                  </span>
                </div>

                <div className="flex flex-col items-center py-2 sm:py-3.5 gap-0.5">
                  <span className="text-base sm:text-2xl font-bold text-violet-600 dark:text-violet-400 tabular-nums leading-none">
                    {totalsummerize?.totalpage ?? 0}
                  </span>
                  <span className="text-[10px] sm:text-xs text-violet-600 dark:text-violet-400 font-medium mt-0.5">
                    Pages
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
