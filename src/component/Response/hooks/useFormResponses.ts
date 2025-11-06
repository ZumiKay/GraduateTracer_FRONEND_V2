import { useState, useCallback, useMemo } from "react";
import { ContentType, QuestionType } from "../../../types/Form.types";
import { generateStorageKey } from "../../../helperFunc";
import { SaveProgressType } from "../Response.type";

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

export const useFormResponses = (
  questions: ContentType[],
  formId: string,
  userKey?: string
) => {
  const [responses, setResponses] = useState<FormResponse[]>([]);

  const questionsMap = useMemo(() => {
    const map = new Map<string, ContentType>();
    questions.forEach((q) => {
      if (q._id) map.set(q._id, q);
    });
    return map;
  }, [questions]);

  // Memoize question type checks
  const isEmptyResponse = useCallback(
    (response: ResponseValue | null | undefined): boolean => {
      return (
        response === null ||
        response === undefined ||
        response === "" ||
        (Array.isArray(response) && response.length === 0)
      );
    },
    []
  );

  const checkIfQuestionShouldShow = useCallback(
    (
      question: ContentType,
      responseList: FormResponse[] | Map<string, ResponseValue | null>
    ): boolean => {
      //If no condition exit
      if (!question.parentcontent) {
        return true;
      }

      const parentQuestion = questionsMap.get(
        question.parentcontent?.qId || ""
      );

      if (!parentQuestion) {
        return false;
      }

      // Support both array and Map for flexibility
      let parentResponse: ResponseValue | null | undefined;

      if (responseList instanceof Map) {
        parentResponse = responseList.get(parentQuestion._id ?? "");
      } else {
        const found = responseList.find(
          (r) => r.question === parentQuestion._id
        );
        parentResponse = found?.response;
      }

      if (isEmptyResponse(parentResponse)) {
        return false;
      }

      const expectedAnswer = question.parentcontent?.optIdx;

      if (
        parentQuestion.type === QuestionType.MultipleChoice ||
        parentQuestion.type === QuestionType.Selection
      ) {
        // MultipleChoice response should be a number
        if (typeof parentResponse !== "number") {
          return false;
        }

        // Check if responseValue matches expectedAnswer
        return (
          parentResponse === expectedAnswer ||
          parentResponse === Number(expectedAnswer)
        );
      }

      if (parentQuestion.type === QuestionType.CheckBox) {
        // CheckBox response can be a number or number[]
        let selectedIndices: number[] = [];

        if (Array.isArray(parentResponse)) {
          // Filter only numeric values
          selectedIndices = parentResponse.filter(
            (val) => typeof val === "number"
          ) as number[];
        } else if (typeof parentResponse === "number") {
          selectedIndices = [parentResponse];
        } else {
          // Invalid response type for checkbox
          return false;
        }

        const expectedAnswerNum = Number(expectedAnswer);

        // Check if expectedAnswer is in selectedIndices
        return selectedIndices.includes(expectedAnswerNum);
      }

      return parentResponse === expectedAnswer;
    },
    [questionsMap, isEmptyResponse]
  );

  //Update Response Helper
  const RemoveSavedQuestion = useCallback(
    (question: string) => {
      const storageKey = generateStorageKey({
        suffix: "progress",
        formId,
        userKey,
      });

      const isStored = localStorage.getItem(storageKey);

      if (isStored) {
        let toUpdateData = JSON.parse(isStored) as SaveProgressType;

        toUpdateData = {
          ...toUpdateData,
          responses: toUpdateData.responses.filter(
            (q) => q.question !== question
          ),
        };

        localStorage.setItem(storageKey, JSON.stringify(toUpdateData));
      }
    },
    [formId, userKey]
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
            // Use questionsMap for O(1) lookup instead of O(n) find
            const isQuestion = questionsMap.has(question);

            // Skip update if invalid question
            if (!isQuestion) return;

            const existingIndex = updated.findIndex(
              (i) => i.question === question
            );

            if (existingIndex !== -1) {
              // Update existing response

              if (updateValue === "" || !updateValue) {
                updated.splice(existingIndex, 1);
                //Remove from storage
                RemoveSavedQuestion(question);
              } else
                updated[existingIndex] = {
                  ...updated[existingIndex],
                  response: updateValue,
                };
            } else {
              // Add new response if not exists and value is not empty
              if (updateValue !== "" && updateValue !== undefined) {
                updated.push({ question: question, response: updateValue });
              }
            }
          });
        } else {
          const questionId = questionIdOrUpdates;
          // Use questionsMap for O(1) lookup instead of O(n) find
          const isQuestion = questionsMap.has(questionId);

          // Skip update if invalid question or no value provided
          if (!isQuestion || value === undefined) return prev;

          const existingIndex = updated.findIndex(
            (i) => i.question === questionId
          );

          if (existingIndex !== -1) {
            // If value is undefined or empty, delete the response
            if (value === "" || value === undefined) {
              updated.splice(existingIndex, 1);

              //Remove from storage
              RemoveSavedQuestion(questionId);
            } else {
              updated[existingIndex] = {
                ...updated[existingIndex],
                response: value,
              };
            }
          } else {
            // Only add new response if value is not empty/undefined
            if (value !== "" && value !== undefined) {
              updated.push({ question: questionId, response: value });
            }
          }
        }

        const handleConditionalUpdates = (
          responses: FormResponse[]
        ): FormResponse[] => {
          let hasChanges = false;
          const updatedResponses: FormResponse[] = [];

          // Create response map for O(1) lookups in loop
          const responseMap = new Map<string, ResponseValue | null>();
          for (let i = 0; i < responses.length; i++) {
            const resp = responses[i];
            responseMap.set(resp.question, resp.response);
          }

          for (let i = 0; i < responses.length; i++) {
            const response = responses[i];
            const question = questionsMap.get(response.question);

            if (!question || !question.parentcontent) {
              updatedResponses.push(response);
              continue;
            }

            // Pass responseMap instead of array for O(1) lookups
            const shouldShow = checkIfQuestionShouldShow(question, responseMap);

            if (!shouldShow && response.response !== "") {
              hasChanges = true;
              updatedResponses.push({ ...response, response: "" });
            } else {
              updatedResponses.push(response);
            }
          }

          if (hasChanges) {
            return handleConditionalUpdates(updatedResponses);
          }

          return updatedResponses;
        };

        return handleConditionalUpdates(updated);
      });
    },
    [questions, questionsMap, RemoveSavedQuestion, checkIfQuestionShouldShow]
  );

  const clearProgressState = () => {
    setResponses([]);
  };

  return {
    responses,
    updateResponse,
    checkIfQuestionShouldShow,
    clearProgressState,
  };
};
