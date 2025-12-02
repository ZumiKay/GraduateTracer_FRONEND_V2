import { useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface UseResponseNavigationProps {
  responseId?: string;
  formId?: string;
}

export const useResponseNavigation = ({
  responseId,
  formId,
}: UseResponseNavigationProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Parse response IDs from query parameters
  const responseIds = useMemo(() => {
    const ids = searchParams.get("responseIds");
    return ids ? ids.split(",") : responseId ? [responseId] : [];
  }, [searchParams, responseId]);

  // Current response index in the list
  const currentResponseIndex = useMemo(() => {
    return responseIds.indexOf(responseId || "");
  }, [responseIds, responseId]);

  // Navigation helpers
  const canGoPrev = currentResponseIndex > 0;
  const canGoNext = currentResponseIndex < responseIds.length - 1;

  // Handle navigation between responses
  const handleNavigateResponse = useCallback(
    (direction: "next" | "prev") => {
      const newIndex =
        direction === "next"
          ? currentResponseIndex + 1
          : currentResponseIndex - 1;

      if (newIndex >= 0 && newIndex < responseIds.length) {
        const newResponseId = responseIds[newIndex];
        navigate(
          `/response/${formId}/${newResponseId}?${searchParams.toString()}`,
          {
            replace: true,
          }
        );
      }
    },
    [currentResponseIndex, responseIds, formId, navigate, searchParams]
  );

  return {
    responseIds,
    currentResponseIndex,
    canGoPrev,
    canGoNext,
    handleNavigateResponse,
  };
};
