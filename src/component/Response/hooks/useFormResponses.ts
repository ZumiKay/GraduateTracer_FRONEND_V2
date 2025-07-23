import { useState, useCallback } from "react";
import { ContentType, QuestionType } from "../../../types/Form.types";

export interface FormResponse {
  questionId: string;
  response: ResponseValue;
}

export type ResponseValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | Date
  | object;

export const useFormResponses = (questions: ContentType[]) => {
  const [responses, setResponses] = useState<FormResponse[]>([]);

  // Initialize responses when questions change
  const initializeResponses = useCallback(() => {
    if (questions.length > 0) {
      const initialResponses = questions.map((q) => ({
        questionId: q._id || "",
        response: "",
      }));
      setResponses(initialResponses);
    }
  }, [questions]);

  // Helper function to check if a conditional question should show
  const checkIfQuestionShouldShow = useCallback(
    (question: ContentType, responseList: FormResponse[]): boolean => {
      if (!question.parentcontent) {
        return true;
      }

      const parentQuestion = questions.find(
        (q) =>
          q._id === question.parentcontent?.qId ||
          q._id === question.parentcontent?.qIdx?.toString()
      );

      if (!parentQuestion) {
        return false;
      }

      const parentResponse = responseList.find(
        (r) => r.questionId === parentQuestion._id
      );

      if (!parentResponse || !parentResponse.response) {
        return false;
      }

      const expectedAnswer = question.parentcontent?.optIdx;

      if (parentQuestion.type === QuestionType.MultipleChoice) {
        const responseValue = parentResponse.response;
        const selectedOption = parentQuestion.multiple?.find((option) => {
          if (option.content === responseValue) return true;
          if (option.idx === responseValue) return true;
          if (option.idx === Number(responseValue)) return true;
          if (option.idx?.toString() === responseValue) return true;
          return false;
        });

        return selectedOption?.idx === expectedAnswer;
      }

      if (parentQuestion.type === QuestionType.CheckBox) {
        const selectedIndices = Array.isArray(parentResponse.response)
          ? (parentResponse.response as number[])
          : typeof parentResponse.response === "number"
          ? [parentResponse.response as number]
          : [];

        return selectedIndices.includes(expectedAnswer);
      }

      return parentResponse.response === expectedAnswer;
    },
    [questions]
  );

  // Update response and handle conditional logic
  const updateResponse = useCallback(
    (questionId: string, value: ResponseValue) => {
      setResponses((prev) => {
        const updated = prev.map((r) =>
          r.questionId === questionId ? { ...r, response: value } : r
        );

        // Handle conditional question visibility changes
        const handleConditionalUpdates = (responses: FormResponse[]) => {
          let hasChanges = false;

          const updatedResponses = responses.map((response) => {
            const question = questions.find(
              (q) => q._id === response.questionId
            );
            if (!question || !question.parentcontent) {
              return response;
            }

            const shouldShow = checkIfQuestionShouldShow(question, responses);

            if (!shouldShow && response.response !== "") {
              hasChanges = true;
              return { ...response, response: "" };
            }

            return response;
          });

          if (hasChanges) {
            return handleConditionalUpdates(updatedResponses);
          }

          return updatedResponses;
        };

        return handleConditionalUpdates(updated);
      });
    },
    [questions, checkIfQuestionShouldShow]
  );

  return {
    responses,
    updateResponse,
    initializeResponses,
    checkIfQuestionShouldShow,
  };
};
