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
        if (import.meta.env.DEV) {
          console.warn("Parent question not found for conditional question:", {
            questionId: question._id,
            parentId: question.parentcontent?.qId,
            parentIdx: question.parentcontent?.qIdx,
          });
        }
        return false;
      }

      const parentResponse = responseList.find(
        (r) => r.questionId === parentQuestion._id
      );

      if (!parentResponse || !parentResponse.response) {
        return false;
      }

      const expectedAnswer = question.parentcontent?.optIdx;

      if (import.meta.env.DEV) {
        console.log("Checking conditional question:", {
          questionId: question._id,
          parentQuestionId: parentQuestion._id,
          parentQuestionType: parentQuestion.type,
          parentResponse: parentResponse.response,
          expectedAnswer,
          parentOptions: parentQuestion.multiple || parentQuestion.checkbox,
        });
      }

      if (parentQuestion.type === QuestionType.MultipleChoice) {
        const responseValue = parentResponse.response;
        const selectedOption = parentQuestion.multiple?.find((option) => {
          if (option.content === responseValue) return true;
          if (option.idx === responseValue) return true;
          if (option.idx === Number(responseValue)) return true;
          if (option.idx?.toString() === responseValue) return true;
          return false;
        });

        const shouldShow = selectedOption?.idx === expectedAnswer;
        if (import.meta.env.DEV) {
          console.log("Multiple choice conditional result:", {
            shouldShow,
            selectedOptionIdx: selectedOption?.idx,
            expectedAnswer,
          });
        }
        return shouldShow;
      }

      if (parentQuestion.type === QuestionType.CheckBox) {
        const selectedIndices = Array.isArray(parentResponse.response)
          ? (parentResponse.response as number[])
          : typeof parentResponse.response === "number"
          ? [parentResponse.response as number]
          : [];

        const shouldShow = selectedIndices.includes(expectedAnswer);
        if (import.meta.env.DEV) {
          console.log("Checkbox conditional result:", {
            shouldShow,
            selectedIndices,
            expectedAnswer,
          });
        }
        return shouldShow;
      }

      // For other question types, direct comparison
      const shouldShow = parentResponse.response === expectedAnswer;
      if (import.meta.env.DEV) {
        console.log("Direct comparison conditional result:", {
          shouldShow,
          parentResponse: parentResponse.response,
          expectedAnswer,
        });
      }
      return shouldShow;
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

  // Batch update multiple responses (useful for restoring from storage)
  const batchUpdateResponses = useCallback(
    (
      responsesToUpdate: Array<{ questionId: string; response: ResponseValue }>
    ) => {
      setResponses((prev) => {
        let updated = [...prev];

        // Apply all updates first
        responsesToUpdate.forEach(({ questionId, response }) => {
          updated = updated.map((r) =>
            r.questionId === questionId ? { ...r, response } : r
          );
        });

        // Then handle conditional logic once
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
    batchUpdateResponses,
    initializeResponses,
    checkIfQuestionShouldShow,
  };
};
