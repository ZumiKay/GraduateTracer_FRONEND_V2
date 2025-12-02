import { useCallback } from "react";
import ApiRequest from "./ApiHook";
import { FormDataType } from "../types/Form.types";

// Type for form tabs
type alltabs =
  | "question"
  | "solution"
  | "preview"
  | "response"
  | "analytics"
  | "setting";

/**
 * Hook for fetching form tab data
 * Reusable across multiple components
 */
export const useFormAPI = () => {
  /**
   * Fetch form tab data based on tab type and pagination
   * @param tab - The tab type (question, response, analytics, etc.)
   * @param page - The page number for pagination
   * @param formId - The form ID to fetch
   * @returns Promise with FormDataType
   */
  const fetchFormTab = useCallback(
    async ({
      tab,
      page,
      formId,
    }: {
      tab: alltabs;
      page: number;
      formId: string;
    }): Promise<FormDataType> => {
      const ty = tab === "question" ? "detail" : tab;

      const response = await ApiRequest({
        url: `/filteredform?ty=${ty}&q=${formId}&page=${page}`,
        method: "GET",
        cookie: true,
        reactQuery: true,
      });

      return response.data as FormDataType;
    },
    []
  );

  /**
   * Get initial form data (validation, access checks, etc.)
   * @param formId - The form ID
   * @returns Promise with validation summary and access info
   */
  const getFormValidation = useCallback(
    async (formId: string, action: string = "send_form") => {
      const response = await ApiRequest({
        url: `/validateform?formId=${formId}&action=${action}`,
        method: "GET",
        cookie: true,
        reactQuery: true,
      });

      return response.data;
    },
    []
  );

  /**
   * Get form details for viewing responses
   * @param formId - The form ID
   * @returns Promise with form details
   */
  const getFormDetails = useCallback(async (formId: string) => {
    const response = await ApiRequest({
      url: `/form/details/${formId}`,
      method: "GET",
      cookie: true,
      reactQuery: true,
    });

    return response.data;
  }, []);

  /**
   * Get respondents list for a form
   * @param formId - The form ID
   * @returns Promise with respondents data
   */
  const getFormRespondents = useCallback(async (formId: string) => {
    const response = await ApiRequest({
      url: `/getformrespondents?formId=${formId}`,
      method: "GET",
      cookie: true,
      reactQuery: true,
    });

    return response.data;
  }, []);

  return {
    fetchFormTab,
    getFormValidation,
    getFormDetails,
    getFormRespondents,
  };
};
