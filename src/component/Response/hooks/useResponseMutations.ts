import { useMutation } from "@tanstack/react-query";
import ApiRequest from "../../../hooks/ApiHook";
import SuccessToast, { ErrorToast } from "../../Modal/AlertModal";
import queryClient from "../../../hooks/ReactQueryClient";

const errorToastId = "uniqueResponseErrorId";

export const useResponseMutations = (formId: string) => {
  // Update response score mutation
  const updateScoreMutation = useMutation({
    mutationFn: async ({
      responseId,
      newScore,
      sendEmail,
    }: {
      responseId: string;
      newScore: number;
      sendEmail: string;
    }) => {
      const result = await ApiRequest({
        method: "PUT",
        url: `/response/update-score`,
        data: {
          responseId,
          score: newScore,
          sendEmail,
        },
        cookie: true,
        reactQuery: true,
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responses", formId] });
      SuccessToast({
        title: "Success",
        content: "Response score updated successfully!",
      });
    },
    onError: (error: Error) => {
      ErrorToast({
        title: "Error",
        content: error.message || "Failed to update response score",
        toastid: errorToastId,
      });
    },
  });

  // Update individual question score mutation
  const updateQuestionScoreMutation = useMutation({
    mutationFn: async ({
      responseId,
      questionId,
      score,
    }: {
      responseId: string;
      questionId: string;
      score: number;
    }) => {
      const result = await ApiRequest({
        method: "PUT",
        url: `/response/update-question-score`,
        data: {
          responseId,
          questionId,
          score,
        },
        cookie: true,
        reactQuery: true,
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responses", formId] });
      SuccessToast({
        title: "Success",
        content: "Question score updated successfully!",
      });
    },
    onError: (error: Error) => {
      ErrorToast({
        title: "Error",
        content: error.message || "Failed to update question score",
        toastid: errorToastId,
      });
    },
  });

  // Send form links mutation
  const sendLinksMutation = useMutation({
    mutationFn: async ({
      emails,
      message,
    }: {
      emails: string[];
      message: string;
    }) => {
      const result = await ApiRequest({
        url: "/response/send-links",
        method: "POST",
        cookie: true,
        data: {
          formId,
          emails,
          message,
        },
        reactQuery: true,
      });
      return result.data;
    },
    onSuccess: () => {
      SuccessToast({
        title: "Success",
        content: "Form links sent successfully!",
      });
    },
    onError: (error: Error) => {
      ErrorToast({
        title: "Error",
        content: error.message || "Failed to send form links",
      });
    },
  });

  // Generate link mutation
  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      const result = await ApiRequest({
        url: "/response/generate-link",
        method: "POST",
        cookie: true,
        data: { formId, secure: true },
        reactQuery: true,
      });
      return result.data as { link?: string; url?: string };
    },
    onSuccess: () => {
      SuccessToast({
        title: "Success",
        content: "Form link generated successfully!",
      });
    },
    onError: (error: Error) => {
      ErrorToast({
        title: "Error",
        content: error.message || "Failed to generate form link",
      });
    },
  });

  // Delete single response mutation
  const deleteResponseMutation = useMutation({
    mutationFn: async (responseId: string) => {
      const result = await ApiRequest({
        url: `/response/${responseId}`,
        method: "DELETE",
        cookie: true,
        reactQuery: true,
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responses", formId] });
      SuccessToast({
        title: "Success",
        content: "Response deleted successfully!",
      });
    },
    onError: (error: Error) => {
      ErrorToast({
        title: "Error",
        content: error.message || "Failed to delete response",
        toastid: errorToastId,
      });
    },
  });

  // Bulk delete responses mutation
  const bulkDeleteResponsesMutation = useMutation({
    mutationFn: async (responseIds: string[]) => {
      const result = await ApiRequest({
        url: "/response/bulk/delete",
        method: "DELETE",
        cookie: true,
        data: {
          responseIds,
          formId,
        },
        reactQuery: true,
      });
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["responses", formId] });
      SuccessToast({
        title: "Success",
        content: `${
          (data as { deletedCount?: number }).deletedCount || 0
        } responses deleted successfully!`,
      });
    },
    onError: (error: Error) => {
      ErrorToast({
        title: "Error",
        content: error.message || "Failed to delete responses",
        toastid: errorToastId,
      });
    },
  });

  return {
    updateScoreMutation,
    updateQuestionScoreMutation,
    sendLinksMutation,
    generateLinkMutation,
    deleteResponseMutation,
    bulkDeleteResponsesMutation,
  };
};
