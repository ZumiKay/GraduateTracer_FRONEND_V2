import { useCallback } from "react";
import { ContentType, QuestionType } from "../../../types/Form.types";
import { FormResponse } from "./useFormResponses";

export const useFormValidation = (
  checkIfQuestionShouldShow?: (
    question: ContentType,
    responses: FormResponse[]
  ) => boolean
) => {
  // Check if current page is complete
  const isPageComplete = useCallback(
    (questions: ContentType[], responses: FormResponse[]): boolean => {
      return questions.every((q) => {
        if (
          checkIfQuestionShouldShow &&
          !checkIfQuestionShouldShow(q, responses)
        ) {
          return true; // Hidden questions are considered "valid"
        }

        const response = responses.find((r) => r.questionId === q._id);
        if (q.require) {
          if (!response || response.response === "") return false;

          // Enhanced validation for different question types
          switch (q.type) {
            case QuestionType.CheckBox:
              return (
                Array.isArray(response.response) && response.response.length > 0
              );

            case QuestionType.MultipleChoice:
              return (
                response.response !== "" &&
                response.response !== null &&
                response.response !== undefined
              );

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
        }
        return true;
      });
    },
    [checkIfQuestionShouldShow]
  );

  // Validate form before submission
  const validateForm = useCallback(
    (questions: ContentType[], responses: FormResponse[]) => {
      const requiredQuestions = questions.filter((q) => {
        // Skip questions that should not be shown (conditional questions)
        if (
          checkIfQuestionShouldShow &&
          !checkIfQuestionShouldShow(q, responses)
        ) {
          return false; // Don't include hidden questions in validation
        }
        return q.require;
      });

      const missingResponses = requiredQuestions.filter((q) => {
        const response = responses.find((r) => r.questionId === q._id);
        if (!response) return true;

        switch (q.type) {
          case QuestionType.CheckBox:
            return (
              !Array.isArray(response.response) ||
              response.response.length === 0
            );

          case QuestionType.MultipleChoice:
            return response.response === undefined || response.response === "";

          case QuestionType.ShortAnswer:
          case QuestionType.Paragraph:
            return (
              !response.response ||
              typeof response.response !== "string" ||
              response.response.trim() === ""
            );

          case QuestionType.Number:
            return (
              !response.response ||
              response.response === "" ||
              isNaN(Number(response.response))
            );

          case QuestionType.Date:
            return (
              !response.response ||
              (!(response.response instanceof Date) && response.response === "")
            );

          case QuestionType.RangeNumber:
          case QuestionType.RangeDate:
            return (
              !response.response ||
              typeof response.response !== "object" ||
              !("start" in (response.response as object)) ||
              !("end" in (response.response as object))
            );

          default:
            return !response.response || response.response === "";
        }
      });

      if (missingResponses.length > 0) {
        const questionTitles = missingResponses
          .map((q) => {
            if (typeof q.title === "string" && q.title.trim()) {
              return q.title.replace(/<[^>]*>/g, "").trim();
            }

            const originalIndex = questions.findIndex(
              (originalQ) => originalQ._id === q._id
            );
            return `Question ${originalIndex + 1}`;
          })
          .join(", ");
        return `Please complete all required fields: ${questionTitles}`;
      }

      return null;
    },
    [checkIfQuestionShouldShow]
  );

  return {
    isPageComplete,
    validateForm,
  };
};
