import { ContentType, QuestionType } from "../../../types/Form.types";
import { FormResponse } from "../hooks/useFormResponses";

export interface ValidationSummary {
  totalQuestions: number;
  visibleQuestions: number;
  requiredQuestions: number;
  completedRequired: number;
  missingRequired: string[];
  conditionalQuestions: number;
  hiddenQuestions: number;
}

export const createValidationSummary = (
  questions: ContentType[],
  visibleQuestions: ContentType[],
  responses: FormResponse[],
): ValidationSummary => {
  const requiredQuestions = visibleQuestions.filter((q) => q.require);
  const completedRequired = requiredQuestions.filter((q) => {
    const response = responses.find((r) => r.question === q._id);
    if (!response) return false;

    switch (q.type) {
      case QuestionType.CheckBox:
      case QuestionType.MultipleChoice:
      case QuestionType.Selection:
        return Array.isArray(response.response) && response.response.length > 0;

      case QuestionType.ShortAnswer:
      case QuestionType.Paragraph:
        return (
          typeof response.response === "string" &&
          response.response.trim() !== ""
        );
      case QuestionType.Number:
        return (
          response.response !== "" &&
          response.response !== null &&
          !isNaN(Number(response.response))
        );
      case QuestionType.Date:
        return (
          response.response instanceof Date ||
          (response.response && response.response !== "")
        );
      case QuestionType.RangeNumber:
      case QuestionType.RangeDate:
        return (
          response.response &&
          typeof response.response === "object" &&
          "start" in (response.response as object) &&
          "end" in (response.response as object)
        );
      default:
        return (
          response.response !== "" &&
          response.response !== null &&
          response.response !== undefined
        );
    }
  });

  const missingRequired = requiredQuestions
    .filter((q) => !completedRequired.includes(q))
    .map((q) => {
      const index = questions.findIndex((originalQ) => originalQ._id === q._id);
      return `Question ${index + 1}`;
    });

  return {
    totalQuestions: questions.length,
    visibleQuestions: visibleQuestions.length,
    requiredQuestions: requiredQuestions.length,
    completedRequired: completedRequired.length,
    missingRequired,
    conditionalQuestions: questions.filter((q) => q.parentcontent).length,
    hiddenQuestions: questions.length - visibleQuestions.length,
  };
};

export const logValidationSummary = (summary: ValidationSummary) => {
  if (import.meta.env.DEV) {
    console.log("🔍 Form Validation Summary:", {
      "📋 Total Questions": summary.totalQuestions,
      "👁️ Visible Questions": summary.visibleQuestions,
      "❗ Required Questions": summary.requiredQuestions,
      "✅ Completed Required": summary.completedRequired,
      "❌ Missing Required": summary.missingRequired,
      "🔗 Conditional Questions": summary.conditionalQuestions,
      "🙈 Hidden Questions": summary.hiddenQuestions,
      "✨ Form Valid": summary.missingRequired.length === 0,
    });
  }
};
