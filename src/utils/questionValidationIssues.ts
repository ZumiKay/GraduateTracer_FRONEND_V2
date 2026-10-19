import {
  ErrorValidataionPropsType,
  QuestionValidationIssue,
  ValidationResult,
} from "../types/Form.types";

/** Groups a form's validation results by question (_id, or qIdx for unsaved ones) */
export function extractQuestionValidationIssues(
  validationResults?: ValidationResult,
): Map<string, QuestionValidationIssue[]> {
  const map = new Map<string, QuestionValidationIssue[]>();
  if (!validationResults) return map;

  const getIssueMessage = (item: ErrorValidataionPropsType, fallback: string): string => {
    if (!item.message) return fallback;
    if (typeof item.message === "string") return item.message;
    if (typeof item.message === "object" && item.message.message) {
      return item.message.message;
    }
    return fallback;
  };

  const addIssue = (
    item: ErrorValidataionPropsType,
    type: "error" | "warning",
    message: string,
  ) => {
    const key = item._id || String(item.qIdx ?? "");
    if (!key) return;
    const existing = map.get(key) || [];
    existing.push({ type, message });
    map.set(key, existing);
  };

  validationResults.errors?.forEach((item) => {
    if (typeof item === "object" && item !== null) {
      addIssue(item, "error", getIssueMessage(item, `Validation error on ${item.questionId}`));
    }
  });

  validationResults.warnings?.forEach((item) => {
    if (typeof item === "object" && item !== null) {
      addIssue(item, "warning", getIssueMessage(item, `Warning on ${item.questionId}`));
    }
  });

  validationResults.missingAnswers?.forEach((item) => {
    if (typeof item === "object" && item !== null) {
      addIssue(item, "error", getIssueMessage(item, "Missing answer key"));
    }
  });

  validationResults.missingScores?.forEach((item) => {
    if (typeof item === "object" && item !== null) {
      addIssue(item, "warning", getIssueMessage(item, "Missing score value"));
    }
  });

  validationResults.wrongScores?.forEach((item) => {
    if (typeof item === "object" && item !== null) {
      addIssue(item, "error", getIssueMessage(item, "Invalid score setting"));
    }
  });

  return map;
}
