import { memo } from "react";
import { CircularProgress, Button, Chip } from "@heroui/react";
import { FormValidationSummary } from "../../../types/Form.types";

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
    const getValidationStatus = () => {
      if (!validationSummary) return null;

      const { totalInvalidQuestions } = validationSummary;

      if (totalInvalidQuestions === 0) {
        return (
          <Chip color="success" variant="flat" size="sm">
            ✓ All questions validated
          </Chip>
        );
      }

      return (
        <Chip color="warning" variant="flat" size="sm">
          ⚠ {totalInvalidQuestions} issue(s) found
        </Chip>
      );
    };

    return (
      <div className="sticky top-0 z-10 w-full bg-white shadow-md border-b border-gray-200 py-4">
        <div className="w-full max-w-4xl mx-auto px-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Form Summary</h2>
            <div className="flex items-center gap-3">
              {getValidationStatus()}
              <Button
                color="primary"
                variant="bordered"
                size="sm"
                onPress={onValidateAll}
                isLoading={isValidating}
              >
                Validate All
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-3 flex justify-center">
                <CircularProgress size="sm" />
              </div>
            ) : (
              <>
                <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <p className="text-xl font-bold text-blue-700">
                    {formTotalScore ?? totalsummerize?.totalscore ?? 0}
                  </p>
                  <p className="text-xs text-blue-600">
                    Total Score (All Questions)
                  </p>
                </div>
                <div className="text-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <p className="text-xl font-bold text-green-700">
                    {totalsummerize?.totalquestion ?? 0}
                  </p>
                  <p className="text-xs text-green-600">Total Questions</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                  <p className="text-xl font-bold text-purple-700">
                    {totalsummerize?.totalpage ?? 0}
                  </p>
                  <p className="text-xs text-purple-600">Total Pages</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);

FormSummaryHeader.displayName = "FormSummaryHeader";

export default FormSummaryHeader;
