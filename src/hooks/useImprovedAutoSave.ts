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
    debounceMs = 2000, // 2 seconds after user stops editing
    retryAttempts = 3,
    retryDelayMs = 2000,
    offlineQueueSize = 50,
    tab = "question",
  } = config;

  const dispatch = useDispatch();
  const { allquestion, formstate, page, debounceQuestion, pauseAutoSave } =
    useSelector((root: RootState) => root.allform);

  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({
    status: "idle",
    lastSaved: null,
    error: null,
    retryCount: 0,
  });

  const [offlineQueue, setOfflineQueue] = useState<ContentType[]>([]);
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
  const [autoSavedDataQueue, setautoSavedDataQueue] =
    useState<Array<ContentType>>();

  // Keep refs in sync with current state
  useEffect(() => {
    allQuestionRef.current = allquestion;
  }, [allquestion]);

  useEffect(() => {
    autoSaveStatusRef.current = autoSaveStatus;
  }, [autoSaveStatus]);

  const generateDataString = useCallback((data: ContentType[]) => {
    return JSON.stringify(
      data.map((q) => ({
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
        //If question have no questionId critital error
        if (latestVal.some((i) => !i.questionId)) {
          ErrorToast({
            toastid: "Save Question",
            title: "Save Question",
            content: "Unexpected Error",
          });
          return;
        }

        //Update allquestion states

        dispatch(setallquestion(latestVal));
        dispatch(setprevallquestion(latestVal));
      }
    },

    [dispatch, hasDataChanged],
  );

  //Manually Update AllQuestion State (called on blur)
  const updateAllQueueData = useCallback(() => {
    if (!autoSavedDataQueue || autoSavedDataQueue.length === 0) return;

    dispatch(setallquestion(autoSavedDataQueue));
    dispatch(setprevallquestion(autoSavedDataQueue));

    // Update hash to match the new state so next comparison works correctly
    const newHash = generateDataString(autoSavedDataQueue);
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

      try {
        if (!isMountedRef.current) return false;

        setAutoSaveStatus((prev) => ({
          ...prev,
          status: "saving",
          error: null,
          retryCount: attempt,
        }));

        if (!isMountedRef.current) return false;

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

          // Always queue data for autosave, update state only on blur
          if (response.data) {
            //Only add queue saving for question tab
            if (autoSave && tab === "question") {
              setautoSavedDataQueue(response.data as Array<ContentType>);
            } else {
              const newHash = generateDataString(
                response.data as Array<ContentType>,
              );
              setLastSavedHash(newHash);
              lastSavedHashRef.current = newHash;

              updateAllQuestionStates({
                latestVal: response.data as Array<ContentType>,
              });
            }
          }

          return true;
        } else {
          throw new Error(response.message || "Save failed");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

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
            error: errorMessage,
            retryCount: 0,
          });

          ErrorToast({
            title: "Auto-save Failed",
            content: `Failed to save after ${retryAttempts} attempts. ${errorMessage}`,
            toastid: "autosave-error",
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

  // Process offline queue when back online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      const processOfflineQueue = async () => {
        try {
          const latestData = offlineQueue[offlineQueue.length - 1];
          await performSave([latestData]);
          setOfflineQueue([]);
        } catch (error) {
          console.error("Failed to process offline queue:", error);
        }
      };

      processOfflineQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, offlineQueue.length]);

  // Timer resets on each edit to avoid too many requests
  const debouncedSave = useCallback(
    (data: ContentType) => {
      // Clear existing timer and restart - this ensures save only happens
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = window.setTimeout(() => {
        // Clear the ref so we know no timer is running
        debounceTimeoutRef.current = null;

        if (!isMountedRef.current) return;

        if (!isOnline) {
          setOfflineQueue((prev) => {
            const newQueue = [...prev, data];
            return newQueue.slice(-offlineQueueSize); // Keep only latest items
          });
          return;
        }

        const currentQuestions = allQuestionRef.current;

        // Check if data has actually changed since last save
        const currentHash = generateDataString(currentQuestions);
        const dataChanged = currentHash !== lastSavedHashRef.current;

        if (dataChanged) {
          performSave(currentQuestions, 0, true);
        }
      }, debounceMs);
    },
    [isOnline, offlineQueueSize, performSave, debounceMs, generateDataString],
  );

  const manualSave = useCallback(
    async ({
      customQuestions,
    }: {
      customQuestions?: Array<ContentType>;
    }): Promise<boolean> => {
      if (!formstate._id) {
        console.warn("Manual save failed: No form ID");
        return false;
      }

      if (!customQuestions && allquestion.length === 0) {
        console.warn("Manual save failed: No questions to save");
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
          false, // Manual save always updates immediately, not queued
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

        ErrorToast({
          title: "Manual Save Failed",
          content: errorMessage,
          toastid: "manual-save-error",
        });

        return false;
      } finally {
        dispatch(setpauseAutoSave(false));
      }
    },
    [formstate._id, allquestion, dispatch, performSave, generateDataString],
  );

  // Main autosave effect - triggers debounced save when question changes
  useEffect(() => {
    if (formstate.setting?.autosave && debounceQuestion && !pauseAutoSave) {
      debouncedSave(debounceQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceQuestion, formstate.setting?.autosave, pauseAutoSave]);

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
    offlineQueueSize: offlineQueue.length,
    updateAllQueueData,
  };
};

export default useImprovedAutoSave;
