import React, {
  useEffect,
  useCallback,
  useMemo,
  useReducer,
  useState,
} from "react";
import { Button, Alert, Spinner } from "@heroui/react";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorToast } from "../Modal/AlertModal";
import SuccessToast from "../Modal/AlertModal";
import RespondentForm, { RespondentFormProps } from "./RespondentForm";
import { validateGuestEmail } from "../../utils/publicFormUtils";
import useRespondentFormPaginaition from "./hooks/usePaginatedFormData";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  cleanupUnrelatedLocalStorage,
  generateStorageKey,
  saveFormStateToLocalStorage,
} from "../../helperFunc";
import { RespondentInfoType, RespondentSessionType } from "./Response.type";
import {
  PublicFormAccessProps,
  GuestData,
} from "../../types/PublicFormAccess.types";
import { useSessionManager } from "../../hooks/useSessionManager";
import { useInactivityWarning } from "../../hooks/useInactivityWarning";
import { AuthContainer } from "./AuthContainer";
import { InactivityWarning } from "../InactivityWarning";
import useFormsessionAPI, {
  setUserSwitching,
  isUserSwitching,
} from "../../hooks/useFormsessionAPI";
import { SessionProvider } from "../../context/SessionContext";
import useFormInitialization from "./hooks/useFormInitialization";
import { FormAction, FormState } from "./types/PublicFormAccessTypes";
import { formStateReducer } from "./reducers/formStateReducer";
import { SubmissionSuccessView } from "./components/SubmissionSuccessView";
import { useSendResponseCopy } from "./hooks/useFormSubmission";

const initialFormState: FormState = {
  accessMode: "login",
  showGuestForm: false,
  loginData: { email: "", password: "", rememberMe: false },
  guestData: {
    name: "",
    email: "",
    rememberMe: false,
    isActive: false,
    timeStamp: 0,
  },
};

/* ----------------------------- Main Component ----------------------------- */

const PublicFormAccess: React.FC<PublicFormAccessProps> = () => {
  const { formId } = useParams<{ formId: string; token: string }>();
  const user = useSelector((root: RootState) => root.usersession);
  const navigate = useNavigate();

  const [formState, dispatch] = useReducer(formStateReducer, {
    ...initialFormState,
    loginData: { ...initialFormState.loginData, email: user.user?.email ?? "" },
  });

  const [expiredSessionData, setExpiredSessionData] =
    useState<GuestData | null>(null);
  const [showExpiredAlert, setShowExpiredAlert] = useState(false);

  const { isInitialized, isInitializing } = useFormInitialization({
    formId,
    user,
    dispatch,
  });

  useEffect(() => {
    if (!formId) {
      navigate("/notfound");
    }
  }, [formId, navigate]);

  // API hooks
  const { respondentLogin, signOut, error, useManuallySessionVeriftication } =
    useFormsessionAPI();

  const handleSessionExpired = useCallback(() => {
    const currentSessionData = formState.formsession?.respondentinfo;
    if (currentSessionData) {
      setExpiredSessionData({
        name: currentSessionData.respondentName || "",
        email: currentSessionData.respondentEmail || "",
        rememberMe: false,
        isActive: false,
        timeStamp: Date.now(),
      });
      setShowExpiredAlert(true);
    }
  }, [formState.formsession?.respondentinfo]);

  const manuallyCheckSession = useManuallySessionVeriftication(
    formId,
    handleSessionExpired,
  );

  const formDataEnabled = Boolean(isInitialized && formId);
  const formReqData = useRespondentFormPaginaition({
    formId,
    accessMode: formState.accessMode,
    formsession: formState.formsession as never,
    enabled: formDataEnabled,
  });

  const isFormRequiredSessionChecked = useMemo(() => {
    return Boolean(
      formReqData.formState?.setting?.acceptResponses &&
      formReqData.formState.setting.email,
    );
  }, [formReqData.formState?.setting]);

  useEffect(() => {
    if (!isInitialized) return; // Wait for initialization to complete

    if (!formReqData.isLoading) {
      if (formReqData.formState) {
        const state = formReqData.formState;
        console.log({ state });

        if (!state.isAuthenticated && state.setting?.email) {
          dispatch({ type: "SET_ACCESS_MODE", payload: "login" });
          return;
        }

        const dispatchState: FormAction = {
          type: "SET_ACCESS_MODE",
          payload: "login",
        };
        if (state.isAuthenticated || !state.setting?.email) {
          dispatchState.payload = formState.guestData
            ? "guest"
            : "authenticated";

          if (!state.setting?.email && !formState.formsession?.isActive) {
            dispatch({ type: "SET_FORMSESSION", payload: { isActive: true } });
          }
        }
        dispatch(dispatchState);
      } else if (formReqData.error) {
        if (!isUserSwitching() && formState.accessMode !== "login") {
          dispatch({ type: "SET_ACCESS_MODE", payload: "error" });
        }
      }
    }
  }, [
    formReqData,
    formState?.guestData?.email,
    formState.accessMode,
    formState.formsession?.isActive,
    isInitialized,
    formState.guestData,
  ]);

  const [loadingState, setLoadingState] = useState({
    isLoading: true,
    phase: "initializing" as "initializing" | "loading-form" | "ready",
    minLoadingTime: 500,
    loadingStartTime: Date.now(),
    allowPaginationLoading: false, // Allow form pagination to show its own loading
  });

  useEffect(() => {
    const currentTime = Date.now();
    const timeSinceStart = currentTime - loadingState.loadingStartTime;

    if (isInitializing) {
      if (loadingState.phase !== "initializing") {
        setLoadingState((prev) => ({
          ...prev,
          phase: "initializing",
          loadingStartTime: currentTime,
          allowPaginationLoading: false,
        }));
      }
    } else if (
      formReqData.isLoading &&
      isInitialized &&
      !loadingState.allowPaginationLoading
    ) {
      if (loadingState.phase !== "loading-form") {
        setLoadingState((prev) => ({
          ...prev,
          phase: "loading-form",
          loadingStartTime: currentTime,
        }));
      }
    } else if (
      !isInitializing &&
      (!formReqData.isLoading || loadingState.allowPaginationLoading) &&
      isInitialized
    ) {
      const shouldWait = timeSinceStart < loadingState.minLoadingTime;

      if (!shouldWait && loadingState.isLoading) {
        setLoadingState((prev) => ({
          ...prev,
          isLoading: false,
          phase: "ready",
          allowPaginationLoading: true, // Now allow form to handle its own loading
        }));
      } else if (shouldWait) {
        const remainingTime = loadingState.minLoadingTime - timeSinceStart;
        setTimeout(() => {
          setLoadingState((prev) => ({
            ...prev,
            isLoading: false,
            phase: "ready",
            allowPaginationLoading: true,
          }));
        }, remainingTime);
      }
    }
  }, [
    isInitializing,
    formReqData.isLoading,
    isInitialized,
    loadingState.phase,
    loadingState.loadingStartTime,
    loadingState.minLoadingTime,
    loadingState.isLoading,
    loadingState.allowPaginationLoading,
  ]);

  const setFormsessionStable = useCallback(
    (
      sessionOrUpdater:
        | Partial<RespondentSessionType>
        | ((
            prev: Partial<RespondentSessionType> | undefined,
          ) => Partial<RespondentSessionType>),
    ) => {
      if (typeof sessionOrUpdater === "function") {
        // Handle functional updates - get current state and apply function
        const currentSession = formState.formsession;
        const newSession = sessionOrUpdater(currentSession);
        dispatch({ type: "SET_FORMSESSION", payload: newSession });
      } else {
        dispatch({ type: "SET_FORMSESSION", payload: sessionOrUpdater });
      }
    },
    [formState.formsession],
  );

  /* --------------------------- Session Mangagement -------------------------- */

  // Auto signout handler
  const handleAutoSignOut = useCallback(async () => {
    if (!formId) return;
    try {
      const asyncLogout = await signOut.mutateAsync(formId);
      if (!asyncLogout.success) {
        throw new Error("Signout failed");
      }

      const sessionState: Partial<RespondentSessionType> = {
        isActive: false,
      };

      // Handle localStorage based on authentication status
      if (user.isAuthenticated && user.user?.email) {
        // For authenticated users, save the inactive session state
        const key = generateStorageKey({
          suffix: "state",
          userKey: user.user.email,
          formId: formId,
        });

        //Update stored state
        saveFormStateToLocalStorage({ key, data: sessionState });
      }

      dispatch({ type: "SET_FORMSESSION", payload: sessionState });

      ErrorToast({
        toastid: "auto-signout",
        title: "Session Expired",
        content: "You have been automatically signed out due to inactivity",
      });

      setTimeout(() => {
        window.location.reload();
      }, 200);
    } catch (error) {
      console.error("Auto signout error:", error);
      throw error;
    }
  }, [signOut, formId, user.user?.email, user.isAuthenticated]);

  const sessionManager = useSessionManager({
    accessMode: formState.accessMode,
    isFormRequiredSessionChecked,
    formsession: formState.formsession,
    setformsession: setFormsessionStable as never,
    onAutoSignOut: handleAutoSignOut,
  });

  const inactivityWarning = useInactivityWarning({
    accessMode: formState.accessMode,
    sessionManager,
  });

  const localFormSessionStateKey = useMemo(() => {
    if (
      formState.accessMode === "login" ||
      formState.accessMode === "error" ||
      !formState.formsession?.respondentinfo?.respondentEmail ||
      !formId
    )
      return null;

    return generateStorageKey({
      suffix: "state",
      formId,
      userKey: formState.formsession.respondentinfo.respondentEmail,
    });
  }, [
    formId,
    formState.accessMode,
    formState.formsession?.respondentinfo?.respondentEmail,
  ]);

  /* ----------------------------- Hanlder Method ----------------------------- */

  const handleLoginChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      dispatch({
        type: "UPDATE_LOGIN_DATA",
        payload: { [name]: type === "checkbox" ? checked : value },
      });
    },
    [],
  );

  const handleGuestChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      dispatch({
        type: "UPDATE_GUEST_DATA",
        payload: { [name]: value },
      });
    },
    [],
  );

  const handleUserLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formId) return;

      const loginReq = await respondentLogin.mutateAsync({
        formId,
        rememberMe: formState.loginData.rememberMe,
        email: formState.loginData.email,
        password: formState.loginData.password,
      });

      if (!loginReq.success) {
        ErrorToast({
          title: "Error",
          content: error ?? "Error Occurred",
        });
        return;
      }

      const sessionState: Partial<RespondentSessionType> = {
        isActive: true,
        respondentinfo: {
          respondentEmail: formState.loginData.email,
        },
      };

      //save to localstorage
      if (localFormSessionStateKey)
        saveFormStateToLocalStorage({
          replace: true,
          key: localFormSessionStateKey,
          data: sessionState,
        });

      //Remove other storage
      cleanupUnrelatedLocalStorage({
        formId,
        userKey: formState.loginData.email,
        suffix: ["state", "progress"],
      });
      dispatch({ type: "SET_FORMSESSION", payload: sessionState });
      dispatch({ type: "SET_ACCESS_MODE", payload: "authenticated" });
      SuccessToast({ title: "Success", content: "Login successful!" });
    },
    [
      formId,
      respondentLogin,
      formState.loginData.rememberMe,
      formState.loginData.email,
      formState.loginData.password,
      localFormSessionStateKey,
      error,
    ],
  );

  const handleLoginExisted = useCallback(async () => {
    if (!user.user || !formId) {
      ErrorToast({
        toastid: "UniqueExistedLoginError",
        title: "Unauthenticated",
        content: "Unauthenticated",
      });
      return;
    }

    try {
      const asyncLogin = await respondentLogin.mutateAsync({
        existed: "1",
        formId,
        rememberMe: true,
      });

      if (!asyncLogin.success) {
        ErrorToast({
          title: "Error",
          content: error ?? "Login failed",
        });
        return;
      }

      const sessionState: Partial<RespondentSessionType> = {
        isActive: true,
        respondentinfo: {
          respondentEmail: user.user.email,
        },
      };

      if (localFormSessionStateKey) {
        saveFormStateToLocalStorage({
          replace: true,
          key: localFormSessionStateKey,
          data: sessionState,
        });
      }

      cleanupUnrelatedLocalStorage({
        formId,
        userKey: user.user.email,
        suffix: ["state", "progress"],
      });

      dispatch({ type: "SET_FORMSESSION", payload: sessionState });
      dispatch({ type: "SET_ACCESS_MODE", payload: "authenticated" });

      SuccessToast({
        title: "Success",
        content: "Login successful!",
      });
    } catch (error) {
      console.error("Login error:", error);
      ErrorToast({
        title: "Error",
        content: "An error occurred during login",
      });
    }
  }, [user.user, formId, respondentLogin, error, localFormSessionStateKey]);

  const handleGuestAccess = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formId) return;

      const { name, email, rememberMe } = formState.guestData;

      if (!name || !email) {
        ErrorToast({
          title: "Error",
          content: "Please provide both name and email",
        });
        return;
      }

      if (!validateGuestEmail(email)) {
        ErrorToast({
          title: "Error",
          content: "Please enter a valid email address",
        });
        return;
      }

      const guestLoginRequest = await respondentLogin.mutateAsync({
        formId,
        email,
        name,
        rememberMe: rememberMe ?? false,
        isGuest: true,
      });

      if (!guestLoginRequest.success) {
        ErrorToast({
          title: "Authentication Failed",
          content: "Error occurred",
        });
        return;
      }

      const sessionState: RespondentSessionType = {
        isActive: true,
        respondentinfo: {
          respondentEmail: email,
          respondentName: name,
          isGuest: true,
        },
      };

      if (localFormSessionStateKey)
        saveFormStateToLocalStorage({
          replace: true,
          key: localFormSessionStateKey,
          data: sessionState,
        });

      cleanupUnrelatedLocalStorage({
        formId,
        userKey: email,
        suffix: ["state", "progress"],
      });

      dispatch({ type: "SET_ACCESS_MODE", payload: "guest" });
      dispatch({
        type: "SET_FORMSESSION",
        payload: {
          isActive: true,
          respondentinfo: sessionState as never,
        },
      });

      SuccessToast({ title: "Success", content: "Guest access granted!" });
    },
    [formId, formState.guestData, localFormSessionStateKey, respondentLogin],
  );

  const handleSwitchUser = useCallback(async () => {
    if (!formId) return;

    try {
      setUserSwitching(true);

      const asyncLogout = await signOut.mutateAsync(formId);
      if (!asyncLogout.success) {
        setUserSwitching(false); // Reset flag on error
        ErrorToast({
          toastid: "loginerror",
          title: "Error",
          content: "Can't logout. Please try again.",
        });
        return;
      }

      //handle Guest and User

      if (user.isAuthenticated) {
        const updateFormSession = {
          isActive: undefined,
        };

        //Save state to storage

        if (localFormSessionStateKey)
          saveFormStateToLocalStorage({
            key: localFormSessionStateKey,
            data: updateFormSession,
          });
        dispatch({ type: "SET_FORMSESSION", payload: updateFormSession });
      } else {
        const localKey = generateStorageKey({
          suffix: "state",
          formId,
          userKey: formState.formsession?.respondentinfo?.respondentEmail,
        });
        window.localStorage.removeItem(localKey);
      }

      dispatch({ type: "SET_ACCESS_MODE", payload: "login" });
    } catch (error) {
      console.error("Error during switch user:", error);
      setUserSwitching(false); // Reset flag on error
      ErrorToast({
        toastid: "switchusererror",
        title: "Error",
        content: "Failed to switch user",
      });
    }
  }, [
    formId,
    formState.formsession?.respondentinfo?.respondentEmail,
    localFormSessionStateKey,
    signOut,
    user.isAuthenticated,
  ]);

  const handleRememberMeChange = useCallback((checked: boolean) => {
    dispatch({ type: "UPDATE_LOGIN_DATA", payload: { rememberMe: checked } });
    dispatch({ type: "UPDATE_GUEST_DATA", payload: { rememberMe: checked } });
  }, []);

  const authContainerProps = useMemo(
    () => ({
      formTitle: formReqData.formState?.title,
      showGuestForm: formState.showGuestForm,
      loginData: formState.loginData,
      guestData: formState.guestData,
      isLoginLoading: respondentLogin.isPending,
      user: {
        user: user.user as unknown as Record<string, unknown>,
        isAuthenticated: user.isAuthenticated,
      },
      onLoginChange: handleLoginChange,
      onGuestChange: handleGuestChange,
      onLoginSubmit: handleUserLogin,
      onGuestSubmit: handleGuestAccess,
      onLoginExisted: handleLoginExisted,
      onShowGuestForm: () =>
        dispatch({ type: "SET_SHOW_GUEST_FORM", payload: true }),
      onBackToLogin: () =>
        dispatch({ type: "SET_SHOW_GUEST_FORM", payload: false }),
      onRememberMeChange: handleRememberMeChange,
    }),
    [
      formReqData.formState?.title,
      formState.showGuestForm,
      formState.loginData,
      formState.guestData,
      respondentLogin.isPending,
      user.user,
      user.isAuthenticated,
      handleLoginChange,
      handleGuestChange,
      handleUserLogin,
      handleGuestAccess,
      handleLoginExisted,
      handleRememberMeChange,
    ],
  );

  const alreadyRespondedData = formReqData.formState?.setting?.submitonce
    ? formReqData.formState?.isResponsed
    : undefined;

  const sendResponseCopy = useSendResponseCopy(
    alreadyRespondedData?.responseId,
    alreadyRespondedData?.respondentEmail,
  );

  const respondentFormProps: RespondentFormProps = useMemo(
    () => ({
      data: formReqData,
      isGuest: formState.accessMode === "guest",
      RespondentData:
        formState.accessMode === "guest"
          ? formState.guestData
          : user.user
            ? {
                email: user.user.email as string,
                name: user.user.name as string,
              }
            : undefined,
      userId: user.user?._id,
      formSessionInfo:
        formState.formsession?.respondentinfo || ({} as RespondentInfoType),
      accessMode:
        formState.accessMode === "error" ? "login" : formState.accessMode,
      isUserActive: formState.formsession?.isActive,
      // Loading management props
      allowInternalLoading: loadingState.allowPaginationLoading,
      globalLoadingManaged: true,
    }),
    [
      formReqData,
      formState.accessMode,
      formState.guestData,
      formState.formsession?.respondentinfo,
      formState.formsession?.isActive,
      user.user,
      loadingState.allowPaginationLoading,
    ],
  );

  if (loadingState.isLoading) {
    const loadingMessages = {
      initializing: "Initializing form...",
      "loading-form": "Loading form data...",
      ready: "Almost ready...",
    };

    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">
            {loadingMessages[loadingState.phase]}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (formState.accessMode === "error") {
    const errorMessage =
      formReqData.error instanceof Error
        ? formReqData.error.message
        : "Failed to load form";
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Alert color="danger" title="Error">
          {errorMessage}
        </Alert>
      </div>
    );
  }

  // Authenticated or Guest access - show form
  if (
    formState.accessMode === "authenticated" ||
    formState.accessMode === "guest"
  ) {
    return (
      <div className="w-full min-h-screen">
        {/* Expired Session Alert */}
        {showExpiredAlert && expiredSessionData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <Alert
                color="warning"
                variant="faded"
                title="Session Expired"
                description={`Your session for "${expiredSessionData.name}" has expired. Please login again`}
                className="mb-4"
                aria-label="inactive alert"
              />
              <div className="flex gap-3 justify-end">
                <Button
                  isDisabled={manuallyCheckSession.isPending}
                  color="warning"
                  isLoading={signOut.isPending}
                  onPress={() => window.location.reload()}
                >
                  To Login
                </Button>
              </div>
            </div>
          </div>
        )}

        <InactivityWarning
          isOpen={inactivityWarning.showWarning}
          onReactivate={inactivityWarning.handleContinueSession}
          timeUntilAutoSignout={inactivityWarning.timeUntilAutoSignout}
          warningMessage={inactivityWarning.warningMessage}
        />

        {/* Switch User Button */}
        {!inactivityWarning.showWarning &&
          formReqData.formState?.setting?.email && (
            <div className="fixed top-4 right-4 z-10">
              <Button
                variant="light"
                size="sm"
                onPress={handleSwitchUser}
                className="bg-white shadow-md dark:bg-gray-700 dark:text-white font-bold"
                isLoading={signOut.isPending}
              >
                Switch user
              </Button>
            </div>
          )}

        {/* Render form based on user state */}
        {(formState.accessMode === "authenticated" ||
          formState.accessMode === "guest") &&
          !inactivityWarning.showWarning &&
          isInitialized &&
          (formReqData.formState?.setting?.email
            ? formState.respondentInfo
            : true) &&
          (alreadyRespondedData ? (
            <SubmissionSuccessView
              formType={formReqData.formState?.type as never}
              submissionResult={null}
              formIsResponsed={alreadyRespondedData}
              onSendCopy={() => sendResponseCopy.mutate()}
              isSendingCopy={sendResponseCopy.isPending}
            />
          ) : (
            <SessionProvider
              manuallyCheckSession={manuallyCheckSession}
              onSessionExpired={() => {
                inactivityWarning.handleContinueSession();
              }}
              checkOnVisibilityChange={true}
              periodicCheckInterval={0}
            >
              <RespondentForm {...respondentFormProps} />
            </SessionProvider>
          ))}
      </div>
    );
  }

  return !formReqData.isLoading && !formReqData.formState?.isAuthenticated ? (
    <AuthContainer {...authContainerProps} />
  ) : (
    <></>
  );
};

export default React.memo(PublicFormAccess);
