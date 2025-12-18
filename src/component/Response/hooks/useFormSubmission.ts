import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import ApiRequest, { ApiRequestReturnType } from "../../../hooks/ApiHook";
import { ErrorToast } from "../../Modal/AlertModal";
import { FormResponse } from "./useFormResponses";
import { ContentType, FormTypeEnum } from "../../../types/Form.types";
import {
  RespondentInfoType,
  SaveProgressType,
  SubmittionProcessionReturnType,
} from "../Response.type";

type QuestionType = ContentType<unknown>;

interface UseFormSubmissionProps {
  formId?: string;
  formType?: FormTypeEnum;
  progressStorageKey: string | null;
  questions: QuestionType[];
  responses: FormResponse[];
  checkIfQuestionShouldShow: (
    question: QuestionType,
    responses: FormResponse[]
  ) => boolean;
  validateForm: (
    questions: QuestionType[],
    responses: FormResponse[]
  ) => string | null;
  respondentInfo: RespondentInfoType;
  clearProgressState: () => void;
}

export const useFormSubmission = ({
  formId,
  formType,
  progressStorageKey,
  questions,
  responses,
  checkIfQuestionShouldShow,
  validateForm,
  respondentInfo,
  clearProgressState,
}: UseFormSubmissionProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] =
    useState<SubmittionProcessionReturnType | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!formId || !progressStorageKey) {
      ErrorToast({
        toastid: "SubmitError",
        title: "Failed",
        content: "Missing Parameter",
      });
      return;
    }

    // Load progress from storage
    const savedData = localStorage.getItem(progressStorageKey);
    const prevQuestion =
      savedData && (JSON.parse(savedData) as SaveProgressType);

    let ToSubmitQuestion: FormResponse[] = [];

    if (
      prevQuestion &&
      prevQuestion.responses &&
      prevQuestion.responses.length > 0
    ) {
      ToSubmitQuestion = prevQuestion.responses;
    } else {
      ToSubmitQuestion = responses;
    }

    // Ensure all question is valid
    const allVisibleQuestions = questions.filter((question) => {
      if (!question._id) {
        console.error("Question found without ID during submission:", question);
        return false;
      }

      try {
        return checkIfQuestionShouldShow(question, responses);
      } catch (error) {
        console.error(
          "Error checking question visibility during submission:",
          error,
          question
        );
        return false;
      }
    });

    // Final Validation Question
    const validationError = validateForm(questions, ToSubmitQuestion);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (formType === FormTypeEnum.Quiz && !respondentInfo?.respondentEmail) {
      setError("Email is required for quiz forms");
      return;
    }

    const visibleQuestionIds = new Set(allVisibleQuestions.map((q) => q._id));

    // Check for required conditioned question
    const filteredResponses = responses.filter((r) => {
      const isVisible = visibleQuestionIds.has(r.question);
      const hasValue =
        r.response !== null && r.response !== undefined && r.response !== "";

      if (Array.isArray(r.response)) {
        return isVisible;
      }

      return isVisible && hasValue;
    });

    if (
      filteredResponses.length === 0 &&
      allVisibleQuestions.some((q) => q.require)
    ) {
      setError(
        "Please fill out at least the required fields before submitting"
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const result = (await ApiRequest({
        url: `response/submit-response/${formId}`,
        method: "POST",
        cookie: true,
        data: {
          responseSet: ToSubmitQuestion,
          respondentEmail: respondentInfo?.respondentEmail,
          respondentName: respondentInfo?.respondentName,
        },
      })) as ApiRequestReturnType;

      if (result.success) {
        if (result.data && typeof result.data === "object") {
          const data = result.data as SubmittionProcessionReturnType;
          setSubmissionResult(data);
        }

        setSuccess(true);
        clearProgressState();
        if (progressStorageKey) {
          window.localStorage.removeItem(progressStorageKey);
        }
      } else {
        setError(result.error || "Failed to submit form");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  }, [
    formId,
    progressStorageKey,
    responses,
    questions,
    checkIfQuestionShouldShow,
    validateForm,
    formType,
    respondentInfo,
    clearProgressState,
  ]);

  return {
    submitting,
    error,
    success,
    setSuccess,
    submissionResult,
    handleSubmit,
  };
};

export const useSendResponseCopy = (
  responseId?: string,
  recipientEmail?: string
) =>
  useMutation({
    mutationFn: async () => {
      const req = await ApiRequest({
        method: "POST",
        url: "/response/send-card-email",
        data: {
          responseId,
          recipientEmail,
        },
      });

      return req;
    },
  });
