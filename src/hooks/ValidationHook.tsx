import { useState, useCallback } from "react";
import ApiRequest from "./ApiHook";
import { ErrorToast, InfoToast } from "../component/Modal/AlertModal";
import { FormValidationSummary } from "../types/Form.types";

export interface ValidationHookReturn {
  validateForm: (
    formId: string,
    action?: string
  ) => Promise<FormValidationSummary | null>;
  validateContent: (formId: string) => Promise<FormValidationSummary | null>;
  validateFormSubmission: (
    formId: string
  ) => Promise<FormValidationSummary | null>;
  isValidating: boolean;
  showValidationWarnings: (validation: FormValidationSummary) => void;
}

export const useFormValidation = (): ValidationHookReturn => {
  const [isValidating, setIsValidating] = useState(false);

  const validateForm = useCallback(
    async (
      formId: string,
      action: string = "save"
    ): Promise<FormValidationSummary | null> => {
      if (!formId) return null;

      setIsValidating(true);
      try {
        const response = await ApiRequest({
          url: `/validateform?formId=${formId}&action=${action}`,
          method: "GET",
          cookie: true,
        });

        if (!response.success) {
          ErrorToast({
            title: "Validation Failed",
            content: response.error || "Failed to validate form",
            toastid: "validation-error",
          });
          return null;
        }

        return response.data as FormValidationSummary;
      } catch (error) {
        console.error("Form validation error:", error);
        ErrorToast({
          title: "Validation Error",
          content: "An error occurred while validating the form",
          toastid: "validation-error",
        });
        return null;
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  const validateContent = useCallback(
    async (formId: string): Promise<FormValidationSummary | null> => {
      if (!formId) return null;

      setIsValidating(true);
      try {
        const response = await ApiRequest({
          url: `/validatecontent?formId=${formId}`,
          method: "GET",
          cookie: true,
        });

        if (!response.success) {
          ErrorToast({
            title: "Content Validation Failed",
            content: response.error || "Failed to validate content",
            toastid: "content-validation-error",
          });
          return null;
        }

        return response.data as FormValidationSummary;
      } catch (error) {
        console.error("Content validation error:", error);
        ErrorToast({
          title: "Validation Error",
          content: "An error occurred while validating content",
          toastid: "content-validation-error",
        });
        return null;
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  const validateFormSubmission = useCallback(
    async (formId: string): Promise<FormValidationSummary | null> => {
      if (!formId) return null;

      setIsValidating(true);
      try {
        const response = await ApiRequest({
          url: `/validateformsubmission?formId=${formId}`,
          method: "GET",
          cookie: true,
        });

        if (!response.success) {
          ErrorToast({
            title: "Submission Validation Failed",
            content: response.error || "Failed to validate form for submission",
            toastid: "submission-validation-error",
          });
          return null;
        }

        return response.data as FormValidationSummary;
      } catch (error) {
        console.error("Form submission validation error:", error);
        ErrorToast({
          title: "Validation Error",
          content: "An error occurred while validating form submission",
          toastid: "submission-validation-error",
        });
        return null;
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  const showValidationWarnings = useCallback(
    (validation: FormValidationSummary) => {
      if (
        validation.validationResults.warnings &&
        validation.validationResults.warnings.length > 0
      ) {
        InfoToast({
          title: "Validation Warnings",
          content: validation.validationResults.warnings.join(", "),
          toastid: "validation-warnings",
        });
      }
    },
    []
  );

  return {
    validateForm,
    validateContent,
    validateFormSubmission,
    isValidating,
    showValidationWarnings,
  };
};

export default useFormValidation;
