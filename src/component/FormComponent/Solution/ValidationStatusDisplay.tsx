import { memo } from "react";
import { Alert } from "@heroui/react";
import { FormValidationSummary, FormDataType } from "../../../types/Form.types";

interface ValidationStatusDisplayProps {
  validationSummary: FormValidationSummary | null;
  formstate: FormDataType;
}

const ValidationStatusDisplay = memo(
  ({ validationSummary, formstate }: ValidationStatusDisplayProps) => {
    if (!validationSummary) return null;

    return (
      <div className="w-full max-w-4xl">
        {validationSummary.errors && validationSummary.errors.length > 0 && (
          <Alert
            color="warning"
            title="Validation Issues Found"
            description={`Please fix the following issues: ${validationSummary.errors.join(
              ", "
            )}`}
            className="mb-4"
          />
        )}

        {validationSummary.canReturnScoreAutomatically && (
          <Alert
            color="success"
            title="Auto-scoring Enabled"
            description="This quiz can automatically return scores to users after submission."
            className="mb-4"
          />
        )}

        {formstate.type === "QUIZ" && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold mb-2 text-gray-800">
              Quiz Configuration Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Valid Questions:</span>
                <span className="ml-2 font-medium text-green-600">
                  {validationSummary.totalValidQuestions}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Issues Found:</span>
                <span className="ml-2 font-medium text-red-600">
                  {validationSummary.totalInvalidQuestions}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Auto-scoring:</span>
                <span className="ml-2 font-medium">
                  {validationSummary.canReturnScoreAutomatically
                    ? "Enabled"
                    : "Disabled"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Return Type:</span>
                <span className="ml-2 font-medium">
                  {formstate.setting?.returnscore || "Manual"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ValidationStatusDisplay.displayName = "ValidationStatusDisplay";

export default ValidationStatusDisplay;
