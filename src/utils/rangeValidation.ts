import { ContentType, QuestionType, RangeType } from "../types/Form.types";
import { DateValue, RangeValue } from "@heroui/react";

export interface RangeValidationError {
  questionId: string;
  questionTitle: string;
  questionType: QuestionType;
  errorMessage: string;
}

/**
 * Validates range values to ensure start is always less than or equal to end
 */
export const validateRangeQuestions = (
  questions: ContentType[]
): RangeValidationError[] => {
  const errors: RangeValidationError[] = [];

  questions.forEach((question) => {
    const questionId = question._id || question.title?.toString() || "Unknown";
    const questionTitle = question.title?.toString() || "Untitled Question";

    switch (question.type) {
      case QuestionType.RangeNumber: {
        const rangeNumber = question.rangenumber;
        if (
          rangeNumber &&
          typeof rangeNumber === "object" &&
          "start" in rangeNumber &&
          "end" in rangeNumber
        ) {
          const start = rangeNumber.start;
          const end = rangeNumber.end;

          if (
            typeof start === "number" &&
            typeof end === "number" &&
            end < start
          ) {
            errors.push({
              questionId,
              questionTitle,
              questionType: QuestionType.RangeNumber,
              errorMessage: `Range Number: End value (${end}) must be greater than or equal to start value (${start})`,
            });
          }
        }
        break;
      }

      case QuestionType.RangeDate: {
        const rangeDate = question.rangedate;
        if (
          rangeDate &&
          typeof rangeDate === "object" &&
          "start" in rangeDate &&
          "end" in rangeDate
        ) {
          const start = rangeDate.start;
          const end = rangeDate.end;

          if (start && end && end.compare && end.compare(start) < 0) {
            errors.push({
              questionId,
              questionTitle,
              questionType: QuestionType.RangeDate,
              errorMessage: `Range Date: End date must be after or equal to start date`,
            });
          }
        }
        break;
      }

      default:
        // No validation needed for other question types
        break;
    }
  });

  return errors;
};

/**
 * Validates a single range number question
 */
export const validateRangeNumber = (
  range: RangeType<number> | undefined
): boolean => {
  if (!range || typeof range !== "object") return true;
  if (!("start" in range) || !("end" in range)) return true;

  const { start, end } = range;
  if (typeof start !== "number" || typeof end !== "number") return true;

  return end >= start;
};

/**
 * Validates a single range date question
 */
export const validateRangeDate = (
  range: RangeValue<DateValue> | undefined
): boolean => {
  if (!range || typeof range !== "object") return true;
  if (!("start" in range) || !("end" in range)) return true;

  const { start, end } = range;
  if (!start || !end || !end.compare) return true;

  return end.compare(start) >= 0;
};

/**
 * Check if a question has valid range values before saving
 */
export const hasValidRanges = (questions: ContentType[]): boolean => {
  const errors = validateRangeQuestions(questions);
  return errors.length === 0;
};

/**
 * Get user-friendly error messages for range validation errors
 */
export const getRangeValidationSummary = (
  errors: RangeValidationError[]
): string => {
  if (errors.length === 0) return "";

  if (errors.length === 1) {
    return `${errors[0].questionTitle}: ${errors[0].errorMessage}`;
  }

  return `${errors.length} questions have invalid ranges:\n${errors
    .map((error) => `• ${error.questionTitle}: ${error.errorMessage}`)
    .join("\n")}`;
};
