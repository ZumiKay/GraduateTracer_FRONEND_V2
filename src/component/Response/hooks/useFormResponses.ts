import { useState, useCallback } from "react";
import { ContentType, QuestionType } from "../../../types/Form.types";

export interface FormResponse {
  question: string;
  response: ResponseValue | null;
}

export type choiceResponseType = {
  key: number;
  val: string;
};

export type ResponseValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | Date
  | object
  | choiceResponseType
  | choiceResponseType[];

export const useFormResponses = (questions: ContentType[]) => {
  const [responses, setResponses] = useState<FormResponse[]>([]);

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
        (r) => r.question === parentQuestion._id
      );

      if (
        !parentResponse ||
        parentResponse.response === null ||
        parentResponse.response === undefined ||
        parentResponse.response === ""
      ) {
        return false;
      }

      const expectedAnswer = question.parentcontent?.optIdx;

      if (parentQuestion.type === QuestionType.MultipleChoice) {
        const responseValue = parentResponse.response;

        const selectedOption = parentQuestion.multiple?.find((option) => {
          if (option.idx === responseValue) return true;
          if (option.idx === Number(responseValue)) return true;
          if (option.idx?.toString() === String(responseValue)) return true;
          if (option.content === responseValue) return true;
          return false;
        });

        const shouldShow =
          selectedOption?.idx === expectedAnswer ||
          selectedOption?.idx === Number(expectedAnswer) ||
          Number(selectedOption?.idx) === Number(expectedAnswer);

        return shouldShow;
      }

      if (parentQuestion.type === QuestionType.CheckBox) {
        const responseValue = parentResponse.response;
        let selectedIndices: number[] = [];
        let selectedContents: string[] = [];

        if (Array.isArray(responseValue)) {
          const numeric = responseValue
            .map((val) =>
              typeof val === "number"
                ? val
                : typeof val === "string" && !isNaN(Number(val))
                ? Number(val)
                : NaN
            )
            .filter((val) => !isNaN(val));
          selectedIndices = numeric as number[];

          const strings = responseValue
            .filter((val) => typeof val === "string" && isNaN(Number(val)))
            .map((val) => String(val));
          selectedContents = strings as string[];
        } else if (typeof responseValue === "number") {
          selectedIndices = [responseValue];
        } else if (
          typeof responseValue === "string" &&
          !isNaN(Number(responseValue))
        ) {
          selectedIndices = [Number(responseValue)];
        } else if (typeof responseValue === "string") {
          selectedContents = [responseValue];
        }

        const expectedAnswerNum = Number(expectedAnswer);
        const expectedIsNumeric =
          expectedAnswer !== undefined && !isNaN(expectedAnswerNum);
        const expectedStr = String(expectedAnswer);

        if (selectedIndices.length > 0 && parentQuestion.checkbox) {
          const idxToContent = new Map<number, string>();
          parentQuestion.checkbox.forEach((opt, i) => {
            const idx = (opt.idx ?? i) as number;
            idxToContent.set(idx, String(opt.content));
          });
          selectedIndices.forEach((idx) => {
            const content = idxToContent.get(idx);
            if (content) selectedContents.push(content);
          });
        }

        const shouldShow = expectedIsNumeric
          ? selectedIndices.includes(expectedAnswerNum) ||
            selectedIndices.some(
              (idx) => String(idx) === String(expectedAnswerNum)
            )
          : selectedContents.includes(expectedStr);

        return shouldShow;
      }

      const shouldShow = parentResponse.response === expectedAnswer;

      return shouldShow;
    },
    [questions]
  );

  const updateResponse = useCallback(
    (
      questionIdOrUpdates:
        | string
        | Array<{ question: string; response: ResponseValue }>,
      value?: ResponseValue
    ) => {
      setResponses((prev) => {
        // Initialize responses from questions if empty

        const updated =
          prev.length === 0
            ? questions
                .filter((q) => {
                  if (q.type === QuestionType.Text || !q._id) return false;
                  return Array.isArray(questionIdOrUpdates)
                    ? questionIdOrUpdates.some((i) => i.question === q._id)
                    : questionIdOrUpdates === q._id;
                })
                .map((q) => ({
                  question: q._id ?? "",
                  response: "",
                }))
            : [...prev];

        // Handle array of updates
        if (Array.isArray(questionIdOrUpdates)) {
          questionIdOrUpdates.forEach(({ question, response: updateValue }) => {
            const isQuestion = questions.find((i) => i._id === question);

            // Skip update if invalid question
            if (!isQuestion) return;

            const existingIndex = updated.findIndex(
              (i) => i.question === question
            );

            if (existingIndex !== -1) {
              // Update existing response
              updated[existingIndex] = {
                ...updated[existingIndex],
                response: updateValue,
              };
            } else {
              // Add new response if not exists
              updated.push({ question: question, response: updateValue });
            }
          });
        }
        // Handle single update (backward compatible)
        else {
          const questionId = questionIdOrUpdates;
          const isQuestion = questions.find((i) => i._id === questionId);

          // Skip update if invalid question or no value provided
          if (!isQuestion || value === undefined) return prev;

          const existingIndex = updated.findIndex(
            (i) => i.question === questionId
          );

          if (existingIndex !== -1) {
            // Update existing response
            updated[existingIndex] = {
              ...updated[existingIndex],
              response: value,
            };
          } else {
            // Add new response if not exists
            updated.push({ question: questionId, response: value });
          }
        }

        const handleConditionalUpdates = (responses: FormResponse[]) => {
          let hasChanges = false;

          const updatedResponses = responses.map((response) => {
            const question = questions.find((q) => q._id === response.question);
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
    checkIfQuestionShouldShow,
  };
};
