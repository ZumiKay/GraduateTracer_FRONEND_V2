import {
  ContentType,
  ErrorValidataionPropsType,
  QuestionValidationIssue,
  ValidationResult,
} from "../types/Form.types";

type BackendIssueGroup = {
  key: keyof Omit<ValidationResult, "isValid">;
  type: QuestionValidationIssue["type"];
  fallback: (item: ErrorValidataionPropsType) => string;
};

const backendIssueGroups: BackendIssueGroup[] = [
  {
    key: "errors",
    type: "error",
    fallback: (item) => `Validation error on ${item.questionId}`,
  },
  {
    key: "warnings",
    type: "warning",
    fallback: (item) => `Warning on ${item.questionId}`,
  },
  { key: "missingAnswers", type: "error", fallback: () => "Missing answer key" },
  { key: "missingScores", type: "warning", fallback: () => "Missing score value" },
  { key: "wrongScores", type: "error", fallback: () => "Invalid score setting" },
];

export const getValidationItemMessage = (
  item: ErrorValidataionPropsType,
  fallback: string,
): string => {
  if (!item.message) return fallback;
  if (typeof item.message === "string") return item.message;
  return item.message.message || fallback;
};

const isBackendIssueOfQuestion = (
  item: ErrorValidataionPropsType,
  question: ContentType,
): boolean => {
  if (item._id) return item._id === question._id;
  if (item.qIdx === undefined || item.qIdx !== question.qIdx) return false;
  return !item.page || !question.page || item.page === question.page;
};

/**
 * Backend validation issues (from formstate.validation) that belong to a question.
 */
export const getBackendQuestionIssues = (
  validationResults: ValidationResult | undefined,
  question: ContentType,
): QuestionValidationIssue[] => {
  if (!validationResults) return [];

  const result: QuestionValidationIssue[] = [];
  backendIssueGroups.forEach(({ key, type, fallback }) => {
    validationResults[key]?.forEach((item) => {
      if (!item || typeof item !== "object") return;
      if (!isBackendIssueOfQuestion(item, question)) return;
      result.push({ type, message: getValidationItemMessage(item, fallback(item)) });
    });
  });
  return result;
};

/**
 * Merge realtime (frontend) issues with backend issues, dropping backend
 * entries that repeat a message already reported by the frontend.
 */
export const mergeQuestionValidationIssues = (
  frontend: QuestionValidationIssue[],
  backend: QuestionValidationIssue[],
): QuestionValidationIssue[] => {
  if (backend.length === 0) return frontend;
  const seen = new Set(frontend.map((item) => item.message));
  const merged = [...frontend];
  backend.forEach((item) => {
    if (seen.has(item.message)) return;
    seen.add(item.message);
    merged.push(item);
  });
  return merged;
};
