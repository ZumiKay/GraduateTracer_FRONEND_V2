import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { ContentType } from "../types/Form.types";
import { AutoSaveQuestion } from "../pages/FormPage.action";
import { ErrorToast } from "../component/Modal/AlertModal";
import {
  setallquestion,
  setpauseAutoSave,
  setprevallquestion,
} from "../redux/formstore";
import { stripQuestionNumbering } from "../services/labelQuestionNumberingService";
import { AllFormTabs } from "../types/Global.types";
import { ApiError } from "./APIHook/ApiHook";
import { hasQuestionValidationIssues } from "../component/Response/utils/validationUtils";
import { onAutoSaveEvent } from "../services/autoSaveEventBus";

interface AutoSaveStatus {
  status: "idle" | "saving" | "saved" | "error" | "offline";
  lastSaved: Date | null;
  error: string | null;
  retryCount: number;
}

interface AutoSaveConfig {
  debounceMs?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
  offlineQueueSize?: number;
  tab?: AllFormTabs;
}

const useImprovedAutoSave = (config: AutoSaveConfig = {}) => {
  const {
    debounceMs = 2000, //delay effect 2 seconds after user stops editing
    retryAttempts = 3,
    retryDelayMs = 2000,
    tab = "question",
  } = config;

  const dispatch = useDispatch();

  const { allquestion, formstate, page, pauseAutoSave } = useSelector(
    (root: RootState) => root.allform,
  );

  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({
    status: "idle",
    lastSaved: null,
    error: null,
    retryCount: 0,
  });

  const [offlineQueue, setOfflineQueue] = useState<number>(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSavedHash, setLastSavedHash] = useState<string>("");
  const lastSavedHashRef = useRef<string>("");
  const debounceTimeoutRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const lastSaveAttemptRef = useRef<Date | null>(null);
  const allQuestionRef = useRef<ContentType[]>(allquestion);
  const stateUpdateTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const autoSaveStatusRef = useRef<AutoSaveStatus>(autoSaveStatus);
  const pauseAutoSaveRef = useRef<boolean>(pauseAutoSave);
  const [autoSavedDataQueue, setautoSavedDataQueue] =
    useState<Array<ContentType>>();

  // Keep refs in sync with current state
  useEffect(() => {
    allQuestionRef.current = allquestion;
  }, [allquestion]);

  useEffect(() => {
    autoSaveStatusRef.current = autoSaveStatus;
  }, [autoSaveStatus]);

  useEffect(() => {
    pauseAutoSaveRef.current = pauseAutoSave;
  }, [pauseAutoSave]);

  //Generate for quick compare
  const generateDataString = useCallback((data: ContentType[]) => {
    return JSON.stringify(
      data.map((q) => ({
        ...q,
        _id: q._id,
        content: q.content,
        answer: q.answer,
        conditional: q.conditional?.map((c) => ({
          ...c,
          contentIdx: undefined,
        })),
      })),
    );
  }, []);

  const hasDataChanged = useCallback(
    (newData: ContentType[]) => {
      const newHash = generateDataString(newData);
      return newHash !== lastSavedHash;
    },
    [generateDataString, lastSavedHash],
  );

  const updateAllQuestionStates = useCallback(
    ({ latestVal }: { latestVal: Array<ContentType> }) => {
      //Conditions to update
      const isChanged = hasDataChanged(latestVal);

      if (isChanged) {
        if (latestVal.some((i) => !i.questionId)) {
          return;
        }

        const currentQuestions = allQuestionRef.current;
        const mergedQuestions = latestVal.map((serverQ) => {
          const currentQ = currentQuestions.find((q) =>
            q._id
              ? q._id === serverQ._id
              : q.qIdx === serverQ.qIdx && q.page === serverQ.page,
          );
          if (currentQ?.isVisible !== undefined) {
            return { ...serverQ, isVisible: currentQ.isVisible };
          }
          return serverQ;
        });

        dispatch(setallquestion(mergedQuestions));
        dispatch(setprevallquestion(mergedQuestions));
      }
    },

    [dispatch, hasDataChanged],
  );

  const updateAllQueueData = useCallback(() => {
    if (!autoSavedDataQueue || autoSavedDataQueue.length === 0) return;

    // Preserve client-side isVisible when applying queued server data
    const currentQuestions = allQuestionRef.current;
    const mergedQueue = autoSavedDataQueue.map((serverQ) => {
      const currentQ = currentQuestions.find((q) =>
        q._id
          ? q._id === serverQ._id
          : q.qIdx === serverQ.qIdx && q.page === serverQ.page,
      );
      if (currentQ?.isVisible !== undefined) {
        return { ...serverQ, isVisible: currentQ.isVisible };
      }
      return serverQ;
    });

    dispatch(setallquestion(mergedQueue));
    dispatch(setprevallquestion(mergedQueue));

    // Update hash to match the new state for reduce the update state if the data not change
    const newHash = generateDataString(mergedQueue);
    setLastSavedHash(newHash);
    lastSavedHashRef.current = newHash;

    // Clear the queue after applying
    setautoSavedDataQueue(undefined);
  }, [autoSavedDataQueue, dispatch, generateDataString]);

  // Save function with to be save data validations
  const performSave = useCallback(
    async (
      dataToSave: ContentType[],
      attempt: number = 0,
      autoSave?: boolean,
    ): Promise<boolean> => {
      if (!formstate._id || pauseAutoSave || !isMountedRef.current)
        return false;

      // Check if questions have validation issues before saving
      if (tab === "question" && hasQuestionValidationIssues(dataToSave)) {
        if (!autoSave) {
          ErrorToast({
            toastid: "save-validation-issue",
            title: "Validation Error",
            content:
              "Cannot save form: Please resolve all question validation issues first.",
          });
        }
        setAutoSaveStatus({
          status: "error",
          lastSaved: autoSaveStatus.lastSaved,
          error: "Cannot save: Form has question validation issues",
          retryCount: 0,
        });
        return false;
      }

      try {
        if (!isMountedRef.current) return false;

        setAutoSaveStatus((prev) => ({
          ...prev,
          status: "saving",
          error: null,
          retryCount: attempt,
        }));

        if (!isMountedRef.current) return false;

        //Remove frontend questions numbering for backend process (better numbering accuracy).
        const strippedData = stripQuestionNumbering(dataToSave);

        const response = await AutoSaveQuestion({
          data: strippedData,
          page,
          formId: formstate._id,
          type: "save",
        });

        if (response.success) {
          if (!isMountedRef.current) return false;

          setAutoSaveStatus({
            status: "saved",
            lastSaved: new Date(),
            error: null,
            retryCount: 0,
          });
          lastSaveAttemptRef.current = new Date();

          const savedData = response.data;

          // Always queue data for autosave, update state only on blur
          if (savedData) {
            //Only add queue saving for question tab
            if (autoSave && tab === "question") {
              setautoSavedDataQueue(savedData as Array<ContentType>);
            } else {
              const newHash = generateDataString(
                savedData as Array<ContentType>,
              );
              setLastSavedHash(newHash);
              lastSavedHashRef.current = newHash;

              updateAllQuestionStates({
                latestVal: savedData as Array<ContentType>,
              });
            }
          }

          return true;
        } else {
          throw new Error(response.message || "Save failed");
        }
      } catch (error) {
        const errorMessage = error as ApiError;

        if (!isMountedRef.current) return false;

        if (attempt < retryAttempts) {
          setAutoSaveStatus((prev) => ({
            ...prev,
            status: "saving",
            retryCount: attempt + 1,
            error: `Retrying... (${attempt + 1}/${retryAttempts})`,
          }));

          retryTimeoutRef.current = window.setTimeout(
            () => {
              if (!isMountedRef.current) return;
              performSave(dataToSave, attempt + 1, formstate.setting?.autosave);
            },
            retryDelayMs * (attempt + 1),
          ); // Exponential backoff

          return false;
        } else {
          setAutoSaveStatus({
            status: "error",
            lastSaved: autoSaveStatus.lastSaved,
            error: errorMessage.response?.data?.message ?? errorMessage.message,
            retryCount: 0,
          });

          return false;
        }
      }
    },
    [
      formstate._id,
      formstate.setting?.autosave,
      pauseAutoSave,
      page,
      tab,
      generateDataString,
      updateAllQuestionStates,
      retryAttempts,
      retryDelayMs,
      autoSaveStatus.lastSaved,
    ],
  );

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setAutoSaveStatus((prev) => ({ ...prev, status: "idle" }));
    };

    const handleOffline = () => {
      setIsOnline(false);
      setAutoSaveStatus((prev) => ({ ...prev, status: "offline" }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Process offline queue when back online.
  useEffect(() => {
    if (isOnline && offlineQueue > 0) {
      const processOfflineQueue = async () => {
        try {
          const latestSnapshot = allQuestionRef.current;
          await performSave(latestSnapshot);
          setOfflineQueue(0);
        } catch (error) {
          console.error("Failed to process offline queue:", error);
        }
      };

      processOfflineQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, offlineQueue]);

  const triggerDebouncedSave = useCallback(() => {
    // Clear any timer so it only save after the last change
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = window.setTimeout(() => {
      debounceTimeoutRef.current = null;

      if (!isMountedRef.current) return;
      if (pauseAutoSaveRef.current) return;

      if (!isOnline) {
        setOfflineQueue((prev) => {
          return prev + 1;
        });
        return;
      }

      const currentQuestions = allQuestionRef.current;

      const currentHash = generateDataString(currentQuestions);
      if (currentHash !== lastSavedHashRef.current) {
        performSave(currentQuestions, 0, true);
      }
    }, debounceMs);
  }, [isOnline, performSave, debounceMs, generateDataString]);

  //Manually trigger save
  const manualSave = useCallback(
    async ({
      customQuestions,
    }: {
      customQuestions?: Array<ContentType>;
    }): Promise<boolean> => {
      if (!formstate._id) {
        return false;
      }

      if (!customQuestions && allquestion.length === 0) {
        return false;
      }

      try {
        dispatch(setpauseAutoSave(true));

        // Set status to saving
        setAutoSaveStatus((prev) => ({
          ...prev,
          status: "saving",
          error: null,
          retryCount: 0,
        }));

        const success = await performSave(
          customQuestions ?? allquestion,
          0,
          false,
        );

        if (success) {
          const newHash = generateDataString(allquestion);
          setLastSavedHash(newHash);
        }

        return success;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setAutoSaveStatus((prev) => ({
          ...prev,
          status: "error",
          error: errorMessage,
          retryCount: 0,
        }));

        return false;
      } finally {
        dispatch(setpauseAutoSave(false));
      }
    },
    [formstate._id, allquestion, dispatch, performSave, generateDataString],
  );

  useEffect(() => {
    if (pauseAutoSave && debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, [pauseAutoSave]);

  // Main autosave effect — event-based.

  useEffect(() => {
    if (!formstate.setting?.autosave) return;

    const unsubscribe = onAutoSaveEvent((detail) => {
      // Only handle events for the tab this hook instance is scoped to
      if (detail.tab !== tab) return;
      if (pauseAutoSaveRef.current) return;

      triggerDebouncedSave();
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formstate.setting?.autosave, tab, triggerDebouncedSave]);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (stateUpdateTimeoutRef.current) {
        clearTimeout(stateUpdateTimeoutRef.current);
        stateUpdateTimeoutRef.current = null;
      }
    };
  }, []);

  // Auto-save on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Use refs to avoid accessing revoked proxies
      const currentStatus = autoSaveStatusRef.current.status;
      const currentQuestions = allQuestionRef.current;
      const currentHash = generateDataString(currentQuestions);
      const dataChanged = currentHash !== lastSavedHashRef.current;

      if (currentStatus === "saving" || dataChanged) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [generateDataString]);

  return {
    autoSaveStatus,
    manualSave,
    isOnline,
    offlineQueueSize: offlineQueue,
    updateAllQueueData,
  };
};

export default useImprovedAutoSave;
