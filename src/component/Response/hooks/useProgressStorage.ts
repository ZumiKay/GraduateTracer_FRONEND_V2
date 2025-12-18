import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormResponse } from "./useFormResponses";
import { RespondentInfoType, SaveProgressType } from "../Response.type";
import { generateStorageKey } from "../../../helperFunc";

interface UseProgressStorageProps {
  formId?: string;
  respondentEmail?: string;
  responses: FormResponse[];
  currentPage: number;
  formSessionInfo: RespondentInfoType;
  success: boolean;
  accessMode?: "login" | "guest" | "authenticated";
  isUserActive?: boolean;
  submitting: boolean;
}

export const useProgressStorage = ({
  formId,
  respondentEmail,
  responses,
  currentPage,
  formSessionInfo,
  success,
  accessMode = "authenticated",
  isUserActive = true,
  submitting,
}: UseProgressStorageProps) => {
  const [progressLoaded, setProgressLoaded] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const progressStorageKey = useMemo(() => {
    if (!formId) return null;
    return generateStorageKey({
      suffix: "progress",
      formId,
      userKey: respondentEmail,
    });
  }, [formId, respondentEmail]);

  const saveProgressToStorage = useCallback(
    (value?: Record<string, unknown>) => {
      if (!formId || !progressLoaded || !progressStorageKey || success) {
        return;
      }

      if (accessMode === "login" && !isUserActive) {
        return;
      }

      try {
        let previousStoredData: SaveProgressType | null = null;

        try {
          const savedProgress = localStorage.getItem(progressStorageKey);
          if (savedProgress) {
            previousStoredData = JSON.parse(savedProgress) as SaveProgressType;
          }
        } catch (parseError) {
          console.warn(
            "Failed to parse previously stored progress data:",
            parseError
          );
        }

        const nonNullResponses = responses.filter((r) => {
          if (
            r.response === null ||
            r.response === undefined ||
            r.response === ""
          ) {
            return false;
          }
          if (Array.isArray(r.response)) {
            return r.response.length > 0;
          }
          return true;
        });

        let responsesSetUp;

        if (
          previousStoredData?.responses &&
          previousStoredData.responses.length > 0 &&
          nonNullResponses.length > 0
        ) {
          const mergedResponses = [...previousStoredData.responses];

          nonNullResponses.forEach((meaningfulRes) => {
            const existingIndex = mergedResponses.findIndex(
              (prevRes) => prevRes.question === meaningfulRes.question
            );

            if (existingIndex !== -1) {
              mergedResponses[existingIndex] = {
                ...mergedResponses[existingIndex],
                response: meaningfulRes.response,
              };
            } else {
              mergedResponses.push(meaningfulRes);
            }
          });

          responsesSetUp = mergedResponses;
        } else {
          if (
            previousStoredData?.responses &&
            previousStoredData.responses.length > 0
          )
            responsesSetUp = previousStoredData?.responses;
          else responsesSetUp = nonNullResponses;
        }

        const progressData: SaveProgressType = {
          currentPage: currentPage ?? 1,
          responses: responsesSetUp,
          respondentInfo: {
            ...((previousStoredData?.respondentInfo ??
              formSessionInfo) as RespondentInfoType),
          },
          timestamp: new Date().toISOString(),
          formId,
          version: "1.0",
          ...(value ?? {}),
        };

        localStorage.setItem(progressStorageKey, JSON.stringify(progressData));

        // Clean up duplicate progress key without email
        if (respondentEmail) {
          const keyWithoutEmail = generateStorageKey({
            suffix: "progress",
            formId,
            userKey: undefined,
          });

          if (
            keyWithoutEmail !== progressStorageKey &&
            localStorage.getItem(keyWithoutEmail)
          ) {
            localStorage.removeItem(keyWithoutEmail);
            if (import.meta.env.DEV) {
              console.log(
                "Removed duplicate progress key without email:",
                keyWithoutEmail
              );
            }
          }
        }

        if (import.meta.env.DEV) {
          console.log("Progress saved to localStorage:", {
            key: progressStorageKey,
            responsesCount: responsesSetUp.length,
            currentPage: progressData.currentPage,
            timestamp: progressData.timestamp,
          });
        }
      } catch (error) {
        console.error("Failed to save progress to localStorage:", error);
      }
    },
    [
      formId,
      progressLoaded,
      progressStorageKey,
      success,
      accessMode,
      isUserActive,
      responses,
      currentPage,
      formSessionInfo,
      respondentEmail,
    ]
  );

  const debouncedSaveProgress = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveProgressToStorage();
    }, 1000);
  }, [saveProgressToStorage]);

  const loadProgressFromStorage = useCallback(
    (
      updateResponse: (responses: never) => void,
      goToPage: (page: number) => void,
      dataGoToPage: (page: number) => void
    ) => {
      if (!formId || !progressStorageKey) {
        return false;
      }

      try {
        const savedProgress = localStorage.getItem(progressStorageKey);

        if (savedProgress) {
          const progressData = JSON.parse(savedProgress) as SaveProgressType;

          if (progressData.formId === formId && progressData.version) {
            if (progressData.responses && progressData.responses.length > 0) {
              updateResponse(progressData.responses as never);
            }

            if (progressData.currentPage && progressData.currentPage > 0) {
              setTimeout(() => {
                goToPage(progressData.currentPage);
                dataGoToPage(progressData.currentPage);
                setProgressLoaded(true);
                if (import.meta.env.DEV) {
                  console.log(
                    "Restored current page:",
                    progressData.currentPage
                  );
                }
              }, 100);
            } else {
              setProgressLoaded(true);
            }

            return true;
          }
        } else {
          if (import.meta.env.DEV) {
            console.log("No saved progress found for key:", progressStorageKey);
          }
        }
      } catch (error) {
        console.error("Failed to load progress from localStorage:", error);

        try {
          localStorage.removeItem(progressStorageKey);
        } catch (clearError) {
          console.error("Failed to clear corrupted progress data:", clearError);
        }
      }
      return false;
    },
    [formId, progressStorageKey]
  );

  // Auto-save progress
  useEffect(() => {
    if (formId && progressLoaded && (accessMode === "guest" || isUserActive)) {
      debouncedSaveProgress();
    }
  }, [
    responses,
    currentPage,
    progressLoaded,
    formId,
    submitting,
    debouncedSaveProgress,
    accessMode,
    isUserActive,
  ]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Save progress when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveProgressToStorage();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveProgressToStorage();
      }
    };

    if (!submitting && !success) {
      window.addEventListener("beforeunload", handleBeforeUnload);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [saveProgressToStorage, submitting, success]);

  // Clear storage on success
  useEffect(() => {
    if (success && progressStorageKey) {
      window.localStorage.removeItem(progressStorageKey);
    }
  }, [progressStorageKey, success]);

  return {
    progressLoaded,
    setProgressLoaded,
    progressStorageKey,
    saveProgressToStorage,
    loadProgressFromStorage,
  };
};
