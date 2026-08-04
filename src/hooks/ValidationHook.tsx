import { useCallback, useMemo } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import ApiRequest, { ApiRequestReturnType } from "./APIHook/ApiHook";
import { InfoToast } from "../component/Modal/AlertModal";
import {
  ContentType,
  FormDataType,
  FormValidationSummary,
} from "../types/Form.types";
import { alltabs } from "../pages/FormPage";
import { calculateFinalTotal } from "../helperFunc";

export interface ValidateFormParams {
  formId: string;
  tab: alltabs;
}

export interface ProcessedTotalScoreArgs {
  allQuestion?: Array<ContentType>;
  formState: FormDataType;
}

export interface UseFormValidationReturn {
  showValidationWarnings: (validation: FormValidationSummary) => void;
  validateFormReq: UseMutationResult<
    ApiRequestReturnType,
    Error,
    ValidateFormParams,
    unknown
  >;
  validateFormSubmissionReq: UseMutationResult<
    ApiRequestReturnType,
    Error,
    string,
    unknown
  >;
  processedTotalScore: (args: ProcessedTotalScoreArgs) => number;
}

const fetchFormValidation = ({ formId, tab }: ValidateFormParams) =>
  ApiRequest({
    url: `/validateform?formId=${formId}&action=${tab}`,
    method: "GET",
    cookie: true,
    reactQuery: true,
  });

const fetchFormSubmissionValidation = (formId: string) =>
  ApiRequest({
    url: `/validateformsubmission?formId=${formId}`,
    method: "GET",
    cookie: true,
  });

/**
 * Custom hook providing form validation mutations, total score calculation,
 * and toast notification for validation warnings.
 */
export const useFormValidation = (): UseFormValidationReturn => {
  const processedTotalScore = useCallback(
    ({ allQuestion = [], formState }: ProcessedTotalScoreArgs): number => {
      const processQIdx = new Set<number | string>();

      allQuestion.forEach((q) => {
        if (q?.conditional && Array.isArray(q.conditional)) {
          q.conditional.forEach((c) => {
            if (c.contentId) {
              processQIdx.add(c.contentId);
            }
            if (c.contentIdx !== undefined) {
              processQIdx.add(c.contentIdx);
            }
          });
        }
      });

      const newCurrentPageTotal = allQuestion.reduce((finalTotal, q) => {
        if (!q) return finalTotal;

        if (q.isBonusScore) {
          return finalTotal;
        }

        // Check if question is a conditional child target
        const isChildTarget =
          (q._id && processQIdx.has(q._id)) ||
          (q.qIdx !== undefined && processQIdx.has(q.qIdx)) ||
          (q.questionId && processQIdx.has(q.questionId));

        if (isChildTarget) {
          return finalTotal;
        }

        return finalTotal + (q.score ?? 0);
      }, 0);

      const uniquePages = new Set(
        allQuestion
          .map((q) => q?.page)
          .filter((p): p is number => p !== undefined && p !== null),
      );

      const isFullForm =
        !formState ||
        formState.currentPageTotalScores === undefined ||
        formState.totalScores === undefined ||
        formState.currentPageTotalScores === formState.totalScores ||
        uniquePages.size > 1 ||
        (formState.totalQuestions !== undefined &&
          formState.totalQuestions > 0 &&
          allQuestion.length >= formState.totalQuestions);

      if (isFullForm) {
        return newCurrentPageTotal;
      }

      return calculateFinalTotal(
        formState.totalScores ?? 0,
        formState.currentPageTotalScores ?? 0,
        newCurrentPageTotal,
      );
    },
    [],
  );

  const validateFormReq = useMutation({
    mutationKey: ["SolutionValidation"],
    mutationFn: fetchFormValidation,
  });

  const validateFormSubmissionReq = useMutation({
    mutationKey: ["ValidationFormSubmission"],
    mutationFn: fetchFormSubmissionValidation,
  });

  const showValidationWarnings = useCallback(
    (validation: FormValidationSummary) => {
      const warnings = validation?.validationResults?.warnings;
      if (warnings && warnings.length > 0) {
        const count = warnings.length;
        InfoToast({
          title: "Validation Warnings",
          content: `This form has ${count} validation warning${count > 1 ? "s" : ""}`,
          toastid: "validation-warnings",
        });
      }
    },
    [],
  );

  return useMemo(
    () => ({
      showValidationWarnings,
      validateFormReq,
      validateFormSubmissionReq,
      processedTotalScore,
    }),
    [
      showValidationWarnings,
      validateFormReq,
      validateFormSubmissionReq,
      processedTotalScore,
    ],
  );
};

export default useFormValidation;
