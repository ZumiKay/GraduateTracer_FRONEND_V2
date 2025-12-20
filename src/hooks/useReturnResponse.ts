import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ApiRequest from "./ApiHook";
import SuccessToast, { ErrorToast } from "../component/Modal/AlertModal";

interface UseReturnResponseProps {
  responseId?: string;
  onClose: () => void;
}

export const useReturnResponse = ({
  responseId,
  onClose,
}: UseReturnResponseProps) => {
  const queryClient = useQueryClient();
  const [returnReason, setReturnReason] = useState("");
  const [returnFeedback, setReturnFeedback] = useState("");
  const [returnAdditionalInfo, setReturnAdditionalInfo] = useState("");
  const [includeQuestionsAndResponses, setIncludeQuestionsAndResponses] =
    useState(false);

  // Return response mutation
  const returnResponseMutation = useMutation({
    mutationFn: async ({
      responseId,
      html,
      reason,
      feedback,
      includeQuestionsAndResponses,
    }: {
      responseId: string;
      html: string;
      reason?: string;
      feedback?: string;
      includeQuestionsAndResponses?: boolean;
    }) => {
      const res = await ApiRequest({
        url: "/response/return",
        method: "POST",
        data: {
          responseId,
          html,
          reason,
          feedback,
          includeQuestionsAndResponses,
        },
        cookie: true,
      });
      if (!res.success) {
        throw new Error(res.message || "Failed to return response");
      }
      return res.data;
    },
    onSuccess: () => {
      SuccessToast({
        title: "Success",
        content: "Response returned to respondent successfully",
      });
      onClose();
      setReturnReason("");
      setReturnFeedback("");
      setReturnAdditionalInfo("");
      setIncludeQuestionsAndResponses(false);
      queryClient.invalidateQueries({
        queryKey: ["responseDetails", responseId],
      });
    },
    onError: (error: Error) => {
      ErrorToast({
        title: "Error",
        content: error.message || "Failed to return response",
      });
    },
  });

  // Handle return response submission
  const handleReturnResponse = useCallback(() => {
    if (!responseId) return;

    ///Additional Content when return the form
    const htmlContent = `
      <div style="margin: 20px 0;">
        ${
          returnAdditionalInfo
            ? `<p style="white-space: pre-wrap;">${returnAdditionalInfo}</p>`
            : "<p>No additional information provided.</p>"
        }
      </div>
    `;

    returnResponseMutation.mutate({
      responseId,
      html: htmlContent,
      reason: returnReason || undefined,
      feedback: returnFeedback || undefined,
      includeQuestionsAndResponses,
    });
  }, [
    responseId,
    returnReason,
    returnFeedback,
    returnAdditionalInfo,
    includeQuestionsAndResponses,
    returnResponseMutation,
  ]);

  return {
    returnReason,
    setReturnReason,
    returnFeedback,
    setReturnFeedback,
    returnAdditionalInfo,
    setReturnAdditionalInfo,
    includeQuestionsAndResponses,
    setIncludeQuestionsAndResponses,
    handleReturnResponse,
    isLoading: returnResponseMutation.isPending,
  };
};
