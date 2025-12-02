import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ApiRequest from "./ApiHook";
import { ResponseDataType } from "../component/Response/Response.type";
import SuccessToast, { ErrorToast } from "../component/Modal/AlertModal";

interface UseResponseScoringProps {
  responseId?: string;
  formId?: string;
  selectedResponse?: ResponseDataType;
}

export const useResponseScoring = ({
  responseId,
  formId,
  selectedResponse,
}: UseResponseScoringProps) => {
  const queryClient = useQueryClient();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingScores, setPendingScores] = useState<
    Record<string, number | string | undefined>
  >({});

  const [isBatchSaving, setIsBatchSaving] = useState(false);

  // Debounce timers for auto-save
  const saveTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update question score mutation (for auto-save on blur)
  const updateQuestionScoreMutation = useMutation({
    mutationFn: async ({
      responseId,
      questionId,
      score,
      comment,
    }: {
      responseId: string;
      questionId: string;
      score: number;
      comment?: string;
    }) => {
      const res = await ApiRequest({
        url: `/response/update-score`,
        method: "PUT",
        data: {
          responseId,
          scores: [{ questionId, score, comment }],
        },
        cookie: true,
      });
      if (!res.success) {
        throw new Error(res.message || "Failed to update score");
      }
      return res.data;
    },
    onMutate: async ({ questionId, score }) => {
      await queryClient.cancelQueries({
        queryKey: ["responseDetails", responseId],
      });

      const previousResponse = queryClient.getQueryData<ResponseDataType>([
        "responseDetails",
        responseId,
        formId,
      ]);

      if (previousResponse) {
        queryClient.setQueryData<ResponseDataType>(
          ["responseDetails", responseId, formId],
          (old) => {
            if (!old) return old;

            const updatedResponseSet = old.responseset?.map((resp) =>
              resp.question._id === questionId ? { ...resp, score } : resp
            );

            const newTotalScore =
              updatedResponseSet?.reduce(
                (sum, resp) => sum + (resp.score || 0),
                0
              ) || 0;

            return {
              ...old,
              responseset: updatedResponseSet,
              totalScore: newTotalScore,
            };
          }
        );
      }

      return { previousResponse };
    },
    onSuccess: (_data, variables) => {
      setPendingScores((prev) => {
        const newScores = { ...prev };
        delete newScores[variables.questionId];
        setHasUnsavedChanges(Object.keys(newScores).length > 0);
        return newScores;
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousResponse) {
        queryClient.setQueryData(
          ["responseDetails", responseId, formId],
          context.previousResponse
        );
      }
      ErrorToast({
        title: "Error",
        content: error.message || "Failed to save score",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["responseDetails", responseId],
      });
    },
  });

  // Handle score update for individual questions (debounced auto-save)
  const handleQuestionScoreUpdate = useCallback(
    (questionId: string, score: number, comment?: string) => {
      if (!responseId) return;

      setPendingScores((prev) => {
        const updated = { ...prev, [questionId]: score, comment };
        setHasUnsavedChanges(Object.keys(updated).length > 0);
        return updated;
      });

      if (saveTimeoutRef.current[questionId]) {
        clearTimeout(saveTimeoutRef.current[questionId]);
      }

      saveTimeoutRef.current[questionId] = setTimeout(() => {
        updateQuestionScoreMutation.mutate({
          responseId: responseId as string,
          questionId,
          score,
          comment,
        });
        delete saveTimeoutRef.current[questionId];
      }, 1500);
    },
    [responseId, updateQuestionScoreMutation]
  );

  // Handle save all scores (optimized batch save)
  const handleSaveAllScores = useCallback(async () => {
    if (
      !selectedResponse ||
      !responseId ||
      Object.keys(pendingScores).length === 0
    )
      return;

    Object.values(saveTimeoutRef.current).forEach(clearTimeout);
    saveTimeoutRef.current = {};

    const pendingCount = Object.keys(pendingScores).length;

    const scoresArray = Object.entries(pendingScores).map(
      ([questionId, score]) => ({
        questionId,
        score,
      })
    );

    setIsBatchSaving(true);

    try {
      queryClient.setQueryData<ResponseDataType>(
        ["responseDetails", responseId, formId],
        (old) => {
          if (!old) return old;

          const scoreMap = new Map(
            scoresArray.map((s) => [s.questionId, s.score as number])
          );

          const updatedResponseSet = old.responseset?.map((resp) => {
            const newScore = scoreMap.get(resp.question._id as string);
            return newScore !== undefined ? { ...resp, score: newScore } : resp;
          });

          const newTotalScore =
            updatedResponseSet?.reduce(
              (sum, resp) => sum + ((resp.score as number) || 0),
              0
            ) || 0;

          return {
            ...old,
            responseset: updatedResponseSet,
            totalScore: newTotalScore,
          };
        }
      );

      const res = await ApiRequest({
        url: `/response/update-score`,
        method: "PUT",
        data: {
          responseId,
          scores: scoresArray,
        },
        cookie: true,
      });

      if (res.success) {
        SuccessToast({
          title: "Success",
          content: `All ${pendingCount} score(s) saved successfully`,
        });
        setPendingScores({});
        setHasUnsavedChanges(false);

        queryClient.invalidateQueries({
          queryKey: ["responseDetails", responseId],
        });
      } else {
        throw new Error(res.message || "Failed to save scores");
      }
    } catch (error) {
      queryClient.invalidateQueries({
        queryKey: ["responseDetails", responseId],
      });

      ErrorToast({
        title: "Error",
        content:
          error instanceof Error ? error.message : "Failed to save scores",
      });
    } finally {
      setIsBatchSaving(false);
    }
  }, [selectedResponse, responseId, pendingScores, queryClient, formId]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    const saveTimers = saveTimeoutRef.current;
    const autoSaveTimer = autoSaveTimeoutRef.current;

    return () => {
      Object.values(saveTimers).forEach(clearTimeout);
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, []);

  const isSavingScores = updateQuestionScoreMutation.isPending || isBatchSaving;

  return {
    hasUnsavedChanges,
    pendingScores,
    isSavingScores,
    handleQuestionScoreUpdate,
    handleSaveAllScores,
  };
};
