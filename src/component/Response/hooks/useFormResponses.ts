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

      if (import.meta.env.DEV) {
        console.log("Checking conditional question:", {
          questionId: question._id,
          parentContent: question.parentcontent,
          hasParentId: !!question.parentcontent?.qId,
          hasParentIdx: question.parentcontent?.qIdx !== undefined,
          hasExpectedOption: question.parentcontent?.optIdx !== undefined,
        });
      }

      // Find parent question - try both qId and qIdx for backward compatibility
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
            availableQuestions: questions.map((q) => ({
              id: q._id,
              type: q.type,
            })),
          });
        }
        return false;
      }

      const parentResponse = responseList.find(
        (r) => r.questionId === parentQuestion._id
      );

      if (
        !parentResponse ||
        parentResponse.response === null ||
        parentResponse.response === undefined ||
        parentResponse.response === ""
      ) {
        if (import.meta.env.DEV) {
          console.log("Parent question has no response:", {
            parentQuestionId: parentQuestion._id,
            hasParentResponse: !!parentResponse,
            parentResponseValue: parentResponse?.response,
            parentResponseType: typeof parentResponse?.response,
          });
        }
        return false;
      }

      const expectedAnswer = question.parentcontent?.optIdx;

      if (import.meta.env.DEV) {
        console.log("Checking conditional question:", {
          questionId: question._id,
          parentQuestionId: parentQuestion._id,
          parentQuestionType: parentQuestion.type,
          parentResponse: parentResponse.response,
          parentResponseType: typeof parentResponse.response,
          expectedAnswer,
          expectedAnswerType: typeof expectedAnswer,
          parentOptions: parentQuestion.multiple || parentQuestion.checkbox,
          allQuestions: questions.map((q) => ({
            id: q._id,
            type: q.type,
            hasParent: !!q.parentcontent,
          })),
          allResponses: responseList.map((r) => ({
            questionId: r.questionId,
            response: r.response,
            responseType: typeof r.response,
          })),
        });
      }

      if (parentQuestion.type === QuestionType.MultipleChoice) {
        const responseValue = parentResponse.response;

        if (import.meta.env.DEV) {
          console.log("Multiple choice conditional check details:", {
            responseValue,
            responseType: typeof responseValue,
            expectedAnswer,
            expectedAnswerType: typeof expectedAnswer,
            parentOptions: parentQuestion.multiple?.map((opt) => ({
              content: opt.content,
              idx: opt.idx,
              idxType: typeof opt.idx,
            })),
          });
        }

        const selectedOption = parentQuestion.multiple?.find((option) => {
          // Check if the response matches the option's index
          if (option.idx === responseValue) return true;
          if (option.idx === Number(responseValue)) return true;
          if (option.idx?.toString() === String(responseValue)) return true;
          // Also check content match for backwards compatibility
          if (option.content === responseValue) return true;
          return false;
        });

        const shouldShow =
          selectedOption?.idx === expectedAnswer ||
          selectedOption?.idx === Number(expectedAnswer) ||
          Number(selectedOption?.idx) === Number(expectedAnswer);

        if (import.meta.env.DEV) {
          console.log("Multiple choice conditional result:", {
            shouldShow,
            selectedOptionIdx: selectedOption?.idx,
            selectedOptionIdxType: typeof selectedOption?.idx,
            expectedAnswer,
            expectedAnswerType: typeof expectedAnswer,
            comparison1: selectedOption?.idx === expectedAnswer,
            comparison2: selectedOption?.idx === Number(expectedAnswer),
            comparison3: Number(selectedOption?.idx) === Number(expectedAnswer),
            rawResponseValue: responseValue,
            rawResponseType: typeof responseValue,
            selectedOptionContent: selectedOption?.content,
          });
        }
        return shouldShow;
      }

      if (parentQuestion.type === QuestionType.CheckBox) {
        const responseValue = parentResponse.response;
        let selectedIndices: number[] = [];
        let selectedContents: string[] = [];

        if (Array.isArray(responseValue)) {
          // Mixed array support: numeric indices and/or content strings
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

        // Resolve expected answer: support numeric index or content string
        const expectedAnswerNum = Number(expectedAnswer);
        const expectedIsNumeric =
          expectedAnswer !== undefined && !isNaN(expectedAnswerNum);
        const expectedStr = String(expectedAnswer);

        // If we have contents from parent options, build lookup for selected contents
        if (selectedIndices.length > 0 && parentQuestion.checkbox) {
          const idxToContent = new Map<number, string>();
          parentQuestion.checkbox.forEach((opt, i) => {
            const idx = (opt.idx ?? i) as number;
            idxToContent.set(idx, String(opt.content));
          });
          // Add mapped contents for convenience (avoid duplicate comparisons)
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

        if (import.meta.env.DEV) {
          console.log("Checkbox conditional result:", {
            shouldShow,
            selectedIndices,
            selectedContents,
            expectedAnswer,
            expectedAnswerNum,
            expectedIsNumeric,
            responseValue,
            responseType: typeof responseValue,
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
      if (import.meta.env.DEV) {
        console.log("Updating response:", {
          questionId,
          value,
          valueType: typeof value,
          timestamp: new Date().toISOString(),
        });
      }

      setResponses((prev) => {
        const updated = prev.map((r) =>
          r.questionId === questionId ? { ...r, response: value } : r
        );

        if (import.meta.env.DEV) {
          console.log("Response updated, checking conditional visibility:", {
            questionId,
            newValue: value,
            allResponses: updated.map((r) => ({
              questionId: r.questionId,
              response: r.response,
              hasValue: !!r.response,
            })),
          });
        }

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

            if (import.meta.env.DEV) {
              console.log(`Conditional check for question ${question._id}:`, {
                shouldShow,
                questionId: question._id,
                parentId: question.parentcontent?.qId,
                expectedOption: question.parentcontent?.optIdx,
                currentResponse: response.response,
              });
            }

            if (!shouldShow && response.response !== "") {
              hasChanges = true;
              if (import.meta.env.DEV) {
                console.log(
                  `Clearing response for hidden question ${question._id}`
                );
              }
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
