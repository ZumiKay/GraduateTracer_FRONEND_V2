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
import RespondentForm from "./RespondentForm";
import { validateGuestEmail } from "../../utils/publicFormUtils";
import useRespondentFormPaginaition, {
  accessModeType,
} from "./hooks/usePaginatedFormData";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  generateStorageKey,
  getGuestData,
  removeGuestData,
  saveGuestData,
} from "../../helperFunc";
import { RespondentInfoType, RespondentSessionType } from "./Response.type";
import {
  PublicFormAccessProps,
  LoginData,
  GuestData,
} from "../../types/PublicFormAccess.types";
import { useSessionManager } from "../../hooks/useSessionManager";
import { useInactivityWarning } from "../../hooks/useInactivityWarning";
import { AuthContainer } from "./AuthContainer";
import { InactivityAlert } from "./InactivityAlert";
import { InactivityWarning } from "../InactivityWarning";
import useFormsessionAPI from "../../hooks/useFormsessionAPI";

/* ------------------------------ State Reducer ----------------------------- */
interface FormState {
  accessMode: accessModeType;
  showGuestForm: boolean;
  formsession?: Partial<RespondentSessionType>;
  respondentInfo?: RespondentInfoType;
  loginData: LoginData;
  guestData: GuestData;
}

type FormAction =
  | { type: "SET_ACCESS_MODE"; payload: accessModeType }
  | { type: "SET_SHOW_GUEST_FORM"; payload: boolean }
  | { type: "SET_FORMSESSION"; payload: Partial<RespondentSessionType> }
  | { type: "SET_RESPONDENT_INFO"; payload: RespondentInfoType }
  | { type: "UPDATE_LOGIN_DATA"; payload: Partial<LoginData> }
  | { type: "UPDATE_GUEST_DATA"; payload: Partial<GuestData> }
  | { type: "RESET_LOGIN_DATA" }
  | {
      type: "INIT_AUTHENTICATED_USER";
      payload: { email: string; session: Partial<RespondentSessionType> };
    }
  | { type: "INIT_GUEST_USER"; payload: GuestData };

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

function formStateReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_ACCESS_MODE":
      return { ...state, accessMode: action.payload };

    case "SET_SHOW_GUEST_FORM":
      return { ...state, showGuestForm: action.payload };

    case "SET_FORMSESSION":
      return { ...state, formsession: action.payload };

    case "SET_RESPONDENT_INFO":
      return { ...state, respondentInfo: action.payload };

    case "UPDATE_LOGIN_DATA":
      return {
        ...state,
        loginData: { ...state.loginData, ...action.payload },
      };

    case "UPDATE_GUEST_DATA":
      return {
        ...state,
        guestData: { ...state.guestData, ...action.payload },
      };

    case "RESET_LOGIN_DATA":
      return {
        ...state,
        loginData: initialFormState.loginData,
      };

    case "INIT_AUTHENTICATED_USER":
      return {
        ...state,
        loginData: { ...state.loginData, email: action.payload.email },
        formsession: action.payload.session,
        accessMode: "authenticated",
      };

    case "INIT_GUEST_USER":
      return {
        ...state,
        guestData: action.payload,
        accessMode: "guest",
        formsession: { isActive: true },
      };

    default:
      return state;
  }
}

/* --------------------------- Hook and Utilities --------------------------- */
const useFormInitialization = (
  formId: string | undefined,
  user: RootState["usersession"],
  dispatch: React.Dispatch<FormAction>
) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const { useSessionVerification } = useFormsessionAPI();

  // Ensure stable boolean value for enabled parameter
  const sessionVerificationEnabled = Boolean(formId);
  const verifiedSession = useSessionVerification(
    sessionVerificationEnabled,
    formId
  );

  useEffect(() => {
    const initializeForm = async () => {
      setIsInitializing(true);
      setIsInitialized(false);

      try {
        if (!formId) {
          setIsInitialized(true);
          return;
        }

        // Wait for session verification to complete before proceeding
        if (verifiedSession.isLoading || verifiedSession.isFetching) {
          console.debug("Waiting for session verification to complete...", {
            isLoading: verifiedSession.isLoading,
            isFetching: verifiedSession.isFetching,
            formId,
          });
          return; // Don't proceed until session verification is done
        }

        console.debug(
          "Session verification completed, proceeding with form initialization",
          {
            hasError: !!verifiedSession.error,
            hasData: !!verifiedSession.data,
            formId,
          }
        );

        if (verifiedSession.data?.data && !verifiedSession.data.data.isGuest) {
          const key = generateStorageKey({
            suffix: "state",
            userKey: verifiedSession.data.data.email,
            formId: formId,
          });

          const savedData = localStorage.getItem(key);
          if (savedData) {
            try {
              const parsed = JSON.parse(
                savedData
              ) as Partial<RespondentSessionType>;
              dispatch({
                type: "SET_FORMSESSION",
                payload: parsed,
              });
            } catch (error) {
              console.error("Error parsing saved data:", error);
              localStorage.removeItem(key);
            }
          }
        }
        const guestData = getGuestData();
        if (guestData) {
          dispatch({
            type: "SET_FORMSESSION",
            payload: {
              isActive: guestData.isActive,
              respondentinfo: guestData.email
                ? {
                    email: guestData.email,
                  }
                : undefined,
            },
          });
        }

        // Mark initialization as complete only after session verification is done
        setIsInitialized(true);
      } catch (error) {
        console.error("Form initialization error:", error);
        setIsInitialized(true); // Still mark as initialized to prevent blocking
      } finally {
        // Only set initializing to false if session verification is not loading
        if (!verifiedSession.isLoading && !verifiedSession.isFetching) {
          setIsInitializing(false);
        }
      }
    };

    initializeForm();
  }, [
    formId,
    user.user?.email,
    user.isAuthenticated,
    dispatch,
    user.user,
    verifiedSession.isLoading,
    verifiedSession.isFetching,
    verifiedSession.data,
    verifiedSession.error,
  ]);

  return {
    isInitialized,
    isInitializing,
    sessionVerificationLoading:
      verifiedSession.isLoading || verifiedSession.isFetching,
    sessionVerificationError: verifiedSession.error,
    sessionData: verifiedSession.data,
  };
};

const MemoizedAuthContainer = React.memo(AuthContainer);
const MemoizedRespondentForm = React.memo(RespondentForm);
const MemoizedInactivityAlert = React.memo(InactivityAlert);

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */
const PublicFormAccess: React.FC<PublicFormAccessProps> = () => {
  const { formId } = useParams<{ formId: string; token: string }>();
  const user = useSelector((root: RootState) => root.usersession);
  const navigate = useNavigate();

  const [formState, dispatch] = useReducer(formStateReducer, {
    ...initialFormState,
    loginData: { ...initialFormState.loginData, email: user.user?.email ?? "" },
  });

  // Initialize form state and track completion
  const { isInitialized, isInitializing } = useFormInitialization(
    formId,
    user,
    dispatch
  );

  useEffect(() => {
    if (!formId) {
      navigate("/notfound");
    }
  }, [formId, navigate]);

  // API hooks
  const { respondentLogin, signOut, error } = useFormsessionAPI();

  // Only enable form data fetching after initialization is complete
  const formDataEnabled = Boolean(isInitialized && formId);
  const formReqData = useRespondentFormPaginaition({
    formId,
    accessMode: formState.accessMode,
    formsession: formState.formsession as never,
    user,
    enabled: formDataEnabled,
  });

  const isFormRequiredSessionChecked = useMemo(() => {
    return Boolean(
      formReqData.formState?.setting?.acceptResponses &&
        formReqData.formState.setting.email
    );
  }, [formReqData.formState?.setting]);

  useEffect(() => {
    if (!isInitialized) return; // Wait for initialization to complete

    if (!formReqData.isLoading) {
      if (formReqData.formState) {
        //If user have no access to the form
        if (!formReqData.formState.isAuthenticated) {
          dispatch({ type: "SET_ACCESS_MODE", payload: "login" });
          return;
        }

        const state = formReqData.formState;
        const dispatchState: FormAction = {
          type: "SET_ACCESS_MODE",
          payload: "login",
        };
        if (state.isAuthenticated || !state.setting?.email) {
          dispatchState.payload = formState.guestData.isActive
            ? "guest"
            : "authenticated";
        }
        dispatch(dispatchState);
      } else if (formReqData.error) {
        dispatch({ type: "SET_ACCESS_MODE", payload: "error" });
      }
    }
  }, [formReqData, formState.guestData.isActive, isInitialized]);

  const isUserActive = useMemo(() => {
    if (formState.accessMode === "login") return false;
    if (formState.accessMode === "guest") return true;
    return formState.formsession?.isActive === true;
  }, [formState.accessMode, formState.formsession?.isActive]);

  // Unified loading state to prevent shuttering between multiple loading phases
  const [loadingState, setLoadingState] = useState({
    isLoading: true,
    phase: "initializing" as "initializing" | "loading-form" | "ready",
    minLoadingTime: 500, // Minimum loading time to prevent flickering
    loadingStartTime: Date.now(),
    allowPaginationLoading: false, // Allow form pagination to show its own loading
  });

  // Effect to manage unified loading state transitions
  useEffect(() => {
    const currentTime = Date.now();
    const timeSinceStart = currentTime - loadingState.loadingStartTime;

    // Determine the current loading phase
    if (isInitializing) {
      // Still initializing
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
      // Form data loading (only after initialization is complete and not allowing pagination loading)
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
      // Ready state - but respect minimum loading time to prevent flickering
      const shouldWait = timeSinceStart < loadingState.minLoadingTime;

      if (!shouldWait && loadingState.isLoading) {
        setLoadingState((prev) => ({
          ...prev,
          isLoading: false,
          phase: "ready",
          allowPaginationLoading: true, // Now allow form to handle its own loading
        }));
      } else if (shouldWait) {
        // Wait for minimum loading time, then transition to ready
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
    (session: Partial<RespondentSessionType>) => {
      dispatch({ type: "SET_FORMSESSION", payload: session });
    },
    []
  );

  /* --------------------------- Session Mangagement -------------------------- */

  // Auto signout handler - simpler version for unauthenticated users
  const handleAutoSignOut = useCallback(async () => {
    if (!formId) return;
    try {
      const asyncLogout = await signOut.mutateAsync(formId);
      if (!asyncLogout.success) {
        throw new Error("Signout failed");
      }

      const sessionState: Partial<RespondentSessionType> = {
        isActive: false,
        ...(formState.formsession?.isSwitchedUser !== undefined && {
          isSwitchedUser: true,
        }),
      };

      // Handle localStorage based on authentication status
      if (user.isAuthenticated && user.user?.email) {
        // For authenticated users, save the inactive session state
        const key = generateStorageKey({
          suffix: "state",
          userKey: user.user.email,
          formId: formId,
        });
        localStorage.setItem(key, JSON.stringify(sessionState));
      } else {
        // For unauthenticated users, clear basic storage items
        try {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("formsession");
          sessionStorage.clear(); // Clear session storage for guest data
        } catch (error) {
          console.error("Error clearing storage on auto signout:", error);
        }
      }

      dispatch({ type: "SET_FORMSESSION", payload: sessionState });

      ErrorToast({
        toastid: "auto-signout",
        title: "Session Expired",
        content:
          "You have been automatically signed out due to inactivity (60 minutes).",
      });
    } catch (error) {
      console.error("Auto signout error:", error);
      throw error;
    }
  }, [
    signOut,
    formState.formsession?.isSwitchedUser,
    formId,
    user.user?.email,
    user.isAuthenticated,
  ]);

  const sessionManager = useSessionManager({
    formId,
    accessMode: formState.accessMode,
    isFormRequiredSessionChecked,
    formsession: formState.formsession,
    setformsession: setFormsessionStable as never,
    onAutoSignOut: handleAutoSignOut,
  });

  // Enhanced inactivity warning hook
  const inactivityWarning = useInactivityWarning({
    formId,
    accessMode: formState.accessMode,
    userEmail:
      formState.loginData.email !== ""
        ? formState.loginData.email
        : formState.formsession?.respondentinfo?.email,
    isFormRequiredSessionChecked,
    formsession: formState.formsession,
    setformsession: setFormsessionStable as never,
    onAutoSignOut: handleAutoSignOut,
  });

  /* -------------------------------------------------------------------------- */

  const handleLoginChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      dispatch({
        type: "UPDATE_LOGIN_DATA",
        payload: { [name]: type === "checkbox" ? checked : value },
      });
    },
    []
  );

  const handleGuestChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      dispatch({
        type: "UPDATE_GUEST_DATA",
        payload: { [name]: value },
      });
    },
    []
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
        isSwitched: formState.formsession?.isSwitchedUser,
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
          email: formState.loginData.email,
        },
        ...(user.isAuthenticated && { isSwitchedUser: false }),
      };

      sessionManager.saveLoginStateToStorage(sessionState);
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
      formState.formsession?.isSwitchedUser,
      user.isAuthenticated,
      sessionManager,
      error,
    ]
  );

  const handleLoginExisted = useCallback(() => {
    const sessionState = { isActive: true, isSwitchedUser: false };
    sessionManager.saveLoginStateToStorage(sessionState);
    dispatch({ type: "SET_FORMSESSION", payload: sessionState });
    dispatch({ type: "SET_ACCESS_MODE", payload: "authenticated" });
  }, [sessionManager]);

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

      const guestSession: Partial<GuestData> = {
        ...(guestLoginRequest.data ?? {}),
      };

      if (!guestSession.sessionId || !guestSession.timeStamp) {
        ErrorToast({ title: "Error", content: "Error guest login" });
        return;
      }

      //Save guest to session storage
      saveGuestData({
        email,
        name,
        isActive: true,
        rememberMe,
        sessionId: guestSession.sessionId,
        timeStamp: guestSession.timeStamp,
      });

      dispatch({ type: "SET_ACCESS_MODE", payload: "guest" });
      dispatch({
        type: "SET_FORMSESSION",
        payload: {
          isActive: true,
          respondentinfo: {
            email,
          },
        },
      });
      SuccessToast({ title: "Success", content: "Guest access granted!" });
    },
    [formId, formState.guestData, respondentLogin]
  );

  const handleSwitchUser = useCallback(async () => {
    if (!formId) return;

    try {
      const asyncLogout = await signOut.mutateAsync(formId);
      if (!asyncLogout.success) {
        ErrorToast({
          toastid: "loginerror",
          title: "Error",
          content: "Can't Login",
        });
        return;
      }

      //handle Guest and User
      if (formState.accessMode === "guest") {
        removeGuestData();
      } else {
        if (user.isAuthenticated) {
          const updateFormSession = {
            isActive: undefined,
            ...(formState.formsession?.isSwitchedUser !== undefined && {
              isSwitchedUser: true,
            }),
          };
          sessionManager.saveLoginStateToStorage(updateFormSession);
          dispatch({ type: "SET_FORMSESSION", payload: updateFormSession });
        } else {
          const localKey = generateStorageKey({
            suffix: "state",
            formId,
            userKey: formState.formsession?.respondentinfo?.email,
          });
          window.localStorage.removeItem(localKey);
        }
      }

      // Use setTimeout to ensure localStorage operations complete before reload
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error("Error during switch user:", error);
      ErrorToast({
        toastid: "switchusererror",
        title: "Error",
        content: "Failed to switch user",
      });
    }
  }, [
    formId,
    formState.accessMode,
    formState.formsession?.isSwitchedUser,
    formState.formsession?.respondentinfo?.email,
    sessionManager,
    signOut,
    user.isAuthenticated,
  ]);

  const handleRememberMeChange = useCallback((checked: boolean) => {
    dispatch({ type: "UPDATE_LOGIN_DATA", payload: { rememberMe: checked } });
    dispatch({ type: "UPDATE_GUEST_DATA", payload: { rememberMe: checked } });
  }, []);

  const handleRespondentInfoChange = useCallback(
    (value: React.SetStateAction<RespondentInfoType | undefined>) => {
      const info =
        typeof value === "function" ? value(formState.respondentInfo) : value;
      if (info !== undefined) {
        dispatch({ type: "SET_RESPONDENT_INFO", payload: info });
      }
    },
    [formState.respondentInfo]
  );

  // ===== MEMOIZED PROPS OBJECTS =====
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
    ]
  );

  const respondentFormProps = useMemo(
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
      respondentInfo: formState.respondentInfo,
      setrespondentInfo: handleRespondentInfoChange,
      accessMode:
        formState.accessMode === "error" ? "login" : formState.accessMode,
      isUserActive,
      // Loading management props
      allowInternalLoading: loadingState.allowPaginationLoading,
      globalLoadingManaged: true,
    }),
    [
      formReqData,
      formState.accessMode,
      formState.guestData,
      formState.respondentInfo,
      user.user,
      isUserActive,
      handleRespondentInfoChange,
      loadingState.allowPaginationLoading,
    ]
  );

  const inactivityAlertProps = useMemo(
    () => ({
      showFloatingAlert: Boolean(
        (sessionManager.showInactivityAlert || formReqData.showInactiveAlert) &&
          isUserActive
      ),
      showFullScreenAlert: Boolean(
        (sessionManager.showInactivityAlert || formReqData.showInactiveAlert) &&
          !isUserActive
      ),
      isLoading: signOut.isPending,
      accessMode:
        formState.accessMode === "error" ? "login" : formState.accessMode,
      onReactivateSession: sessionManager.handleReactivateSession,
      onSwitchUser: handleSwitchUser,
      showWarning: sessionManager.showWarning,
      timeUntilAutoSignout: sessionManager.timeUntilAutoSignout,
    }),
    [
      sessionManager.showInactivityAlert,
      sessionManager.showWarning,
      sessionManager.timeUntilAutoSignout,
      sessionManager.handleReactivateSession,
      formReqData.showInactiveAlert,
      isUserActive,
      signOut.isPending,
      formState.accessMode,
      handleSwitchUser,
    ]
  );

  // Loading state - unified and smooth transitions
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
          {/* Debug info in development */}
          {import.meta.env.DEV && (
            <div className="mt-2 text-xs text-gray-400">
              Phase: {loadingState.phase} | Initializing:{" "}
              {isInitializing ? "yes" : "no"} | Form Loading:{" "}
              {formReqData.isLoading ? "yes" : "no"} | Initialized:{" "}
              {isInitialized ? "yes" : "no"}
            </div>
          )}
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
        {/* Inactivity Alert */}
        <MemoizedInactivityAlert {...inactivityAlertProps} />

        {/* Enhanced Inactivity Warning Modal */}
        <InactivityWarning
          isOpen={inactivityWarning.showWarning}
          onReactivate={inactivityWarning.handleContinueSession}
          timeUntilAutoSignout={inactivityWarning.timeUntilAutoSignout}
          warningMessage={inactivityWarning.warningMessage}
        />

        {/* Switch User Button */}
        {!sessionManager.showInactivityAlert && (
          <div className="fixed top-4 right-4 z-10">
            <Button
              variant="light"
              size="sm"
              onPress={handleSwitchUser}
              className="bg-white shadow-md"
              isLoading={signOut.isPending}
            >
              Switch user
            </Button>
          </div>
        )}

        {JSON.stringify(formState.formsession)}
        {/* Render form based on user state */}
        {(formState.accessMode === "authenticated" ||
          formState.accessMode === "guest") &&
          !sessionManager.showInactivityAlert && (
            <MemoizedRespondentForm {...respondentFormProps} />
          )}
      </div>
    );
  }

  return !formReqData.isLoading && !formReqData.formState?.isAuthenticated ? (
    <MemoizedAuthContainer {...authContainerProps} />
  ) : (
    <></>
  );
};

export default React.memo(PublicFormAccess);
