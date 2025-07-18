import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { ContentType } from "../types/Form.types";
import { AutoSaveQuestion } from "../pages/FormPage.action";
import { ErrorToast } from "../component/Modal/AlertModal";
import SuccessToast from "../component/Modal/AlertModal";
import { setpauseAutoSave } from "../redux/formstore";

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
}

const useImprovedAutoSave = (config: AutoSaveConfig = {}) => {
  const {
    debounceMs = 1000,
    retryAttempts = 3,
    retryDelayMs = 2000,
    offlineQueueSize = 50,
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

  const debounceTimeoutRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const lastSaveAttemptRef = useRef<Date | null>(null);

  // Generate hash for data to detect actual changes
  const generateDataHash = useCallback((data: ContentType[]) => {
    return JSON.stringify(
      data.map((q) => ({
        _id: q._id,
        content: q.content,
        answer: q.answer,
        conditional: q.conditional?.map((c) => ({
          ...c,
          contentIdx: undefined,
        })),
      }))
    );
  }, []);

  // Check if data has actually changed
  const hasDataChanged = useCallback(
    (newData: ContentType[]) => {
      const newHash = generateDataHash(newData);
      return newHash !== lastSavedHash;
    },
    [generateDataHash, lastSavedHash]
  );

  // Enhanced save function with retry logic
  const performSave = useCallback(
    async (
      dataToSave: ContentType[],
      attempt: number = 0
    ): Promise<boolean> => {
      if (!formstate._id || pauseAutoSave) return false;

      try {
        setAutoSaveStatus((prev) => ({
          ...prev,
          status: "saving",
          error: null,
          retryCount: attempt,
        }));

        const saveData = dataToSave.map((question) => ({
          ...question,
          conditional: question.conditional?.map((cond) => ({
            ...cond,
            contentIdx: undefined,
          })),
        }));

        const response = await AutoSaveQuestion({
          data: saveData,
          page,
          formId: formstate._id,
          type: "save",
        });

        if (response.success) {
          const newHash = generateDataHash(dataToSave);
          setLastSavedHash(newHash);
          setAutoSaveStatus({
            status: "saved",
            lastSaved: new Date(),
            error: null,
            retryCount: 0,
          });
          lastSaveAttemptRef.current = new Date();
          return true;
        } else {
          throw new Error(response.message || "Save failed");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        if (attempt < retryAttempts) {
          setAutoSaveStatus((prev) => ({
            ...prev,
            status: "saving",
            retryCount: attempt + 1,
            error: `Retrying... (${attempt + 1}/${retryAttempts})`,
          }));

          retryTimeoutRef.current = window.setTimeout(() => {
            performSave(dataToSave, attempt + 1);
          }, retryDelayMs * (attempt + 1)); // Exponential backoff

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
      page,
      retryAttempts,
      retryDelayMs,
      pauseAutoSave,
      generateDataHash,
      autoSaveStatus.lastSaved,
    ]
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
  }, [isOnline, offlineQueue, performSave]);

  // Debounced save function
  const debouncedSave = useCallback(
    (data: ContentType) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        if (!isOnline) {
          // Queue for offline processing
          setOfflineQueue((prev) => {
            const newQueue = [...prev, data];
            return newQueue.slice(-offlineQueueSize); // Keep only latest items
          });
          return;
        }

        // Only save if data has actually changed
        if (hasDataChanged(allquestion)) {
          performSave(allquestion);
        }
      }, debounceMs);
    },
    [
      isOnline,
      offlineQueueSize,
      hasDataChanged,
      allquestion,
      performSave,
      debounceMs,
    ]
  );

  // Manual save function
  const manualSave = useCallback(async (): Promise<boolean> => {
    if (!formstate._id) {
      console.warn("Manual save failed: No form ID");
      return false;
    }

    if (allquestion.length === 0) {
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

      const success = await performSave(allquestion);

      if (success) {
        SuccessToast({
          title: "Saved",
          content: "Form saved successfully",
          toastid: "manual-save",
        });

        // Update last saved hash
        const newHash = generateDataHash(allquestion);
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
  }, [formstate._id, allquestion, performSave, dispatch, generateDataHash]);

  // Main autosave effect
  useEffect(() => {
    if (formstate.setting?.autosave && debounceQuestion && !pauseAutoSave) {
      debouncedSave(debounceQuestion);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [
    debounceQuestion,
    formstate.setting?.autosave,
    pauseAutoSave,
    debouncedSave,
  ]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (autoSaveStatus.status === "saving" || hasDataChanged(allquestion)) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [autoSaveStatus.status, hasDataChanged, allquestion]);

  return {
    autoSaveStatus,
    manualSave,
    isOnline,
    offlineQueueSize: offlineQueue.length,
  };
};

export default useImprovedAutoSave;
