import { useCallback } from "react";
import { ContentType, QuestionType } from "../../../types/Form.types";
import { FormResponse } from "./useFormResponses";

/**
 * Hook for validating form responses with comprehensive validation logic
 * - Validates required questions by type
 * - Return True If Usr Response is empty
 */
export const useFormValidation = (
  checkIfQuestionShouldShow?: (
    question: ContentType,
    responses: FormResponse[]
  ) => boolean
) => {
  const isResponseEmpty = useCallback(
    (
      response: FormResponse | undefined,
      questionType: QuestionType
    ): boolean => {
      // No response object at all
      if (!response) return true;

      const value = response.response;

      if (value === null || value === undefined) return true;

      // Type-specific validation
      switch (questionType) {
        case QuestionType.CheckBox:
          return !Array.isArray(value) || value.length === 0;

        case QuestionType.MultipleChoice:
        case QuestionType.Selection:
          return typeof value !== "number" || isNaN(value);

        case QuestionType.ShortAnswer:
        case QuestionType.Paragraph:
          return typeof value !== "string" || value.trim() === "";

        case QuestionType.Number:
          if (typeof value === "number") return isNaN(value);
          if (typeof value === "string") {
            return value.trim() === "" || isNaN(Number(value));
          }
          return true;

        case QuestionType.Date: {
          if (typeof value === "string") {
            const date = new Date(value);
            return isNaN(date.getTime());
          }
          return true;
        }

        case QuestionType.RangeNumber:
        case QuestionType.RangeDate: {
          if (typeof value !== "object" || value === null) return true;
          const rangeValue = value as { start?: unknown; end?: unknown };

          if (!("start" in rangeValue) || !("end" in rangeValue)) return true;

          if (rangeValue.start === null || rangeValue.start === undefined)
            return true;
          if (rangeValue.end === null || rangeValue.end === undefined)
            return true;

          if (
            typeof rangeValue.start === "string" &&
            rangeValue.start.trim() === ""
          )
            return true;
          if (
            typeof rangeValue.end === "string" &&
            rangeValue.end.trim() === ""
          )
            return true;

          return false;
        }

        //Wrong question type
        default:
          return true;
      }
    },
    []
  );

  const isPageComplete = useCallback(
    (questions: ContentType[], responses: FormResponse[]): boolean => {
      return questions.every((q) => {
        // Skip hidden questions (conditional questions not shown)
        if (
          checkIfQuestionShouldShow &&
          !checkIfQuestionShouldShow(q, responses)
        ) {
          return true; // Hidden questions are considered "valid"
        }

        if (!q.require) {
          return true;
        }

        const response = responses.find((r) => r.question === q._id);

        return !isResponseEmpty(response, q.type);
      });
    },
    [checkIfQuestionShouldShow, isResponseEmpty]
  );

  const validateForm = useCallback(
    (questions: ContentType[], responses: FormResponse[]): string | null => {
      // Get all required questions that should be visible
      const requiredQuestions = questions.filter((q) => {
        if (!q.require) return false;

        // Skip questions that should not be shown (conditional questions)
        if (
          checkIfQuestionShouldShow &&
          !checkIfQuestionShouldShow(q, responses)
        ) {
          return false; // Don't include hidden questions in validation
        }

        return true;
      });

      // Find questions with missing or invalid responses
      const missingResponses = requiredQuestions.filter((q) => {
        const response = responses.find((r) => r.question === q._id);

        // Use the centralized validation logic
        return isResponseEmpty(response, q.type);
      });

      // If there are missing responses, generate error message
      if (missingResponses.length > 0) {
        const questionTitles = missingResponses
          .map((q, index) => {
            // Try to extract title from question
            if (typeof q.title === "string" && q.title.trim()) {
              // Remove HTML tags and clean up the title
              const cleanTitle = q.title.replace(/<[^>]*>/g, "").trim();
              return cleanTitle || `Question ${index + 1}`;
            }

            return `Question ${q.qIdx}`;
          })
          .filter((title) => title) // Remove any empty titles
          .join(", ");

        return `Please complete all required fields: ${questionTitles}`;
      }

      return null; // Validation passed
    },
    [checkIfQuestionShouldShow, isResponseEmpty]
  );

  return {
    isPageComplete,
    validateForm,
  };
};
