import { useState, useEffect, useMemo, useCallback } from "react";
import { RootState } from "../../../redux/store";
import { FormAction } from "../types/PublicFormAccessTypes";
import { getGuestData } from "../../../utils/publicFormUtils";
import { generateStorageKey } from "../../../helperFunc";
import { RespondentSessionType } from "../Response.type";

export const useFormInitialization = (
  formId: string | undefined,
  user: RootState["usersession"],
  dispatch: React.Dispatch<FormAction>
) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Memoize user email to prevent unnecessary re-runs
  const userEmail = useMemo(() => user.user?.email, [user.user?.email]);

  // Memoize guest data to avoid repeated function calls
  const guestData = useMemo(() => getGuestData(), []);

  // Memoize storage keys to prevent recalculation
  const storageKeys = useMemo(() => {
    if (!formId) return null;

    const baseParams = { formId };

    return {
      guest: guestData
        ? generateStorageKey({
            ...baseParams,
            suffix: "guest",
            userKey: guestData.email,
          })
        : null,
      user: userEmail
        ? generateStorageKey({
            ...baseParams,
            suffix: "user",
            userKey: userEmail,
          })
        : null,
    };
  }, [formId, guestData, userEmail]);

  // Optimized localStorage operations with error handling
  const getStorageData = useCallback(
    (key: string): Partial<RespondentSessionType> | null => {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error(`Error parsing localStorage data for key ${key}:`, error);
        // Clean up corrupted data
        localStorage.removeItem(key);
        return null;
      }
    },
    []
  );

  const setStorageData = useCallback(
    (key: string, data: Partial<RespondentSessionType>) => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error(`Error saving to localStorage for key ${key}:`, error);
      }
    },
    []
  );

  // Memoized initialization logic
  const initializeForm = useCallback(async () => {
    // Early return if already initialized or no formId
    if (!formId) {
      setIsInitialized(true);
      setIsInitializing(false);
      return;
    }

    setIsInitializing(true);
    setIsInitialized(false);

    try {
      // Handle guest session (unauthenticated users)
      if (!user.isAuthenticated) {
        setIsInitialized(true);
        return;
      }

      const defaultSessionState: Partial<RespondentSessionType> = {
        isActive: false,
      };

      // Handle guest data (authenticated but using guest mode)
      if (guestData && storageKeys?.guest) {
        const savedGuestData = getStorageData(storageKeys.guest);

        if (savedGuestData) {
          dispatch({ type: "SET_FORMSESSION", payload: savedGuestData });
        } else {
          setStorageData(storageKeys.guest, defaultSessionState);
        }
      }
      // Handle authenticated user data
      else if (storageKeys?.user) {
        const savedUserData = getStorageData(storageKeys.user);

        if (savedUserData) {
          dispatch({ type: "SET_FORMSESSION", payload: savedUserData });
        } else {
          const newSessionState = {
            ...defaultSessionState,
            isSwitchedUser: false,
          };
          setStorageData(storageKeys.user, newSessionState);
        }
      }

      setIsInitialized(true);
    } catch (error) {
      console.error("Form initialization error:", error);
      setIsInitialized(true); // Still mark as initialized to prevent blocking
    } finally {
      setIsInitializing(false);
    }
  }, [
    formId,
    user.isAuthenticated,
    guestData,
    storageKeys,
    getStorageData,
    setStorageData,
    dispatch,
  ]);

  // Effect with optimized dependencies
  useEffect(() => {
    initializeForm();
  }, [initializeForm]);

  // Memoized return value to prevent unnecessary re-renders
  return useMemo(
    () => ({
      isInitialized,
      isInitializing,
    }),
    [isInitialized, isInitializing]
  );
};
