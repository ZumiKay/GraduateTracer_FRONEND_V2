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

/**Hook for conditionallly render the question base on user respones
 * @param questions
 * @param formId
 * @param userKey
 * @returns object
 */
export const useFormResponses = (
  questions: ContentType[],
  formId: string,
  userKey?: string,
) => {
  const [responses, setResponses] = useState<FormResponse[]>([]);

  const questionsMap = useMemo(() => {
    const map = new Map<string, ContentType>();
    questions.forEach((q) => {
      if (q._id) map.set(q._id, q);
    });
    return map;
  }, [questions]);

  const isEmptyResponse = useCallback(
    (response: ResponseValue | null | undefined): boolean => {
      if (response === null || response === undefined || response === "") {
        return true;
      }
      if (Array.isArray(response)) {
        return response.length === 0;
      }
      // Handle {key, val} object format (checkbox/choice responses)
      if (typeof response === "object" && "key" in (response as object)) {
        const key = (response as { key: number | number[] }).key;
        if (Array.isArray(key)) return key.length === 0;
        return key === null || key === undefined;
      }
      return false;
    },
    [],
  );

  const checkIfQuestionShouldShow = useCallback(
    (
      question: ContentType,
      responseList: FormResponse[] | Map<string, ResponseValue | null>,
    ): boolean => {
      //If no condition exit
      if (!question.parentcontent) {
        return true;
      }

      const parentQuestion = questionsMap.get(
        question.parentcontent?.qId || "",
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
          (r) => r.question === parentQuestion._id,
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
        const expectedAnswerNum = Number(expectedAnswer);

        if (Array.isArray(parentResponse)) {
          return (parentResponse as (number | string)[]).some((v) =>
            typeof v === "number"
              ? v === expectedAnswerNum
              : Number(v) === expectedAnswerNum,
          );
        }

        if (typeof parentResponse === "number") {
          return parentResponse === expectedAnswerNum;
        }

        return false;
      }

      if (parentQuestion.type === QuestionType.CheckBox || parentQuestion.type === QuestionType.MultipleSelection) {
        let selectedIndices: number[] = [];

        let normalizedResponse: ResponseValue | null | undefined =
          parentResponse;
        if (
          parentResponse !== null &&
          parentResponse !== undefined &&
          !Array.isArray(parentResponse) &&
          typeof parentResponse === "object" &&
          "key" in (parentResponse as object)
        ) {
          const key = (parentResponse as { key: number | number[] }).key;
          normalizedResponse = Array.isArray(key) ? key : [key];
        }

        if (Array.isArray(normalizedResponse)) {
          // Filter only numeric values
          selectedIndices = (normalizedResponse as (number | string)[]).filter(
            (val) => typeof val === "number",
          ) as number[];

          if (selectedIndices.length === 0) {
            const stringValues = (
              normalizedResponse as (number | string)[]
            ).filter((val) => typeof val === "string") as string[];
            return stringValues.includes(String(expectedAnswer));
          }
        } else if (typeof normalizedResponse === "number") {
          selectedIndices = [normalizedResponse];
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
    [questionsMap, isEmptyResponse],
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
            (q) => q.question !== question,
          ),
        };

        localStorage.setItem(storageKey, JSON.stringify(toUpdateData));
      }
    },
    [formId, userKey],
  );

  const updateResponse = useCallback(
    (
      questionIdOrUpdates:
        | string
        | Array<{ question: string; response: ResponseValue }>,
      value?: ResponseValue,
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
              (i) => i.question === question,
            );

            if (existingIndex !== -1) {
              // Update existing response

              if (
                updateValue === "" ||
                updateValue === null ||
                updateValue === undefined
              ) {
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
            (i) => i.question === questionId,
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
          responses: FormResponse[],
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
    [questions, questionsMap, RemoveSavedQuestion, checkIfQuestionShouldShow],
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
