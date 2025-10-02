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
import { validateGuestEmail, getGuestData } from "../../utils/publicFormUtils";
import useRespondentFormPaginaition, {
  accessModeType,
} from "./hooks/usePaginatedFormData";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { generateStorageKey } from "../../helperFunc";
import { RespondentInfoType, RespondentSessionType } from "./Response.type";
import {
  PublicFormAccessProps,
  LoginData,
  GuestData,
} from "../../types/PublicFormAccess.types";
import { useSessionManager } from "../../hooks/useSessionManager";
import { AuthContainer } from "./AuthContainer";
import { InactivityAlert } from "./InactivityAlert";
import useFormsessionAPI from "../../hooks/useFormsessionAPI";

// ===== STATE MANAGEMENT WITH REDUCER =====
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
  guestData: { name: "", email: "", rememberMe: false },
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

// ===== HOOKS AND UTILITIES =====
const useFormInitialization = (
  formId: string | undefined,
  user: RootState["usersession"],
  dispatch: React.Dispatch<FormAction>
) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeForm = async () => {
      setIsInitializing(true);
      setIsInitialized(false);

      try {
        if (!formId || !user.user?.email) {
          if (!user.isAuthenticated) {
            console.log("Starting guest session initialization");
          }
          // For guest users or when no formId, mark as initialized immediately
          setIsInitialized(true);
          return;
        }

        const key = generateStorageKey({
          suffix: "state",
          userKey: user.user.email,
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
        const guestData = getGuestData();
        if (guestData) {
          dispatch({
            type: "INIT_GUEST_USER",
            payload: guestData,
          });
        }

        // Mark initialization as complete
        setIsInitialized(true);
      } catch (error) {
        console.error("Form initialization error:", error);
        setIsInitialized(true); // Still mark as initialized to prevent blocking
      } finally {
        setIsInitializing(false);
      }
    };

    initializeForm();
  }, [formId, user.user?.email, user.isAuthenticated, dispatch]);

  return {
    isInitialized,
    isInitializing,
  };
};

const MemoizedAuthContainer = React.memo(AuthContainer);
const MemoizedRespondentForm = React.memo(RespondentForm);
const MemoizedInactivityAlert = React.memo(InactivityAlert);

// ===== MAIN COMPONENT =====
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
  const { respondentLogin, loginError, signOut, userRespondentLogin } =
    useFormsessionAPI();

  // Only enable form data fetching after initialization is complete
  const formReqData = useRespondentFormPaginaition({
    formId,
    accessMode: formState.accessMode,
    formsession: formState.formsession as never,
    user,
    enabled: isInitialized && !!formId,
  });

  const isFormRequiredSessionChecked = useMemo(() => {
    return Boolean(
      formReqData.formState?.setting?.acceptResponses &&
        formReqData.formState.setting.email
    );
  }, [formReqData.formState?.setting]);

  useEffect(() => {
    if (!isInitialized) return; // Wait for initialization to complete

    if (!formReqData.isPending && !getGuestData()) {
      if (formReqData.formState) {
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
          dispatchState.payload = "authenticated";
        }
        dispatch(dispatchState);
      } else {
        dispatch({ type: "SET_ACCESS_MODE", payload: "error" });
      }
    }
  }, [formReqData, isInitialized]);

  const isUserActive = useMemo(() => {
    if (formState.accessMode === "login") return false;
    if (formState.accessMode === "guest") return true;
    return formState.formsession?.isActive === true;
  }, [formState.accessMode, formState.formsession?.isActive]);

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

      if (formId && user.user?.email) {
        const key = generateStorageKey({
          suffix: "state",
          userKey: user.user.email,
          formId: formId,
        });
        localStorage.setItem(key, JSON.stringify(sessionState));
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
  ]);

  const setFormsessionStable = useCallback(
    (session: Partial<RespondentSessionType>) => {
      dispatch({ type: "SET_FORMSESSION", payload: session });
    },
    []
  );

  const sessionManager = useSessionManager({
    formId,
    userEmail: user.user?.email,
    accessMode: formState.accessMode,
    isFormRequiredSessionChecked,
    formsession: formState.formsession,
    setformsession: setFormsessionStable as never,
    onAutoSignOut: handleAutoSignOut,
  });

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

      const loginReq = await userRespondentLogin.mutateAsync({
        formId,
        rememberMe: formState.loginData.rememberMe,
        email: formState.loginData.email,
        password: formState.loginData.password,
        isSwitched: formState.formsession?.isSwitchedUser,
      });

      if (!loginReq.success) {
        ErrorToast({
          title: "Error",
          content: loginError?.message ?? "Error Occurred",
        });
        return;
      }

      const sessionState: Partial<RespondentSessionType> = {
        isActive: true,
        ...(user.isAuthenticated && { isSwitchedUser: false }),
      };

      sessionManager.saveLoginStateToStorage(sessionState);
      dispatch({ type: "SET_FORMSESSION", payload: sessionState });
      dispatch({ type: "SET_ACCESS_MODE", payload: "authenticated" });

      SuccessToast({ title: "Success", content: "Login successful!" });
    },
    [
      formId,
      formState.loginData,
      formState.formsession?.isSwitchedUser,
      userRespondentLogin,
      loginError?.message,
      user.isAuthenticated,
      sessionManager,
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

      dispatch({ type: "SET_ACCESS_MODE", payload: "guest" });
      SuccessToast({ title: "Success", content: "Guest access granted!" });
    },
    [formId, formState.guestData, respondentLogin]
  );

  const handleSwitchUser = useCallback(async () => {
    if (!formId) return;

    const asyncLogout = await signOut.mutateAsync(formId);
    if (!asyncLogout.success) {
      ErrorToast({
        toastid: "loginerror",
        title: "Error",
        content: "Can't Login",
      });
      return;
    }

    const sessionState: Partial<RespondentSessionType> = {
      isActive: false,
      ...(formState.formsession?.isSwitchedUser !== undefined && {
        isSwitchedUser: true,
      }),
    };

    sessionManager.saveLoginStateToStorage(sessionState);
    dispatch({ type: "SET_FORMSESSION", payload: sessionState });

    window.location.reload();
  }, [formId, formState.formsession?.isSwitchedUser, sessionManager, signOut]);

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
    }),
    [
      formReqData,
      formState.accessMode,
      formState.guestData,
      formState.respondentInfo,
      user.user,
      isUserActive,
      handleRespondentInfoChange,
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

  // Loading state - show spinner during initialization or form data loading
  if (isInitializing || formReqData.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">
            {isInitializing ? "Initializing form..." : "Loading form data..."}
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
        {/* Inactivity Alert */}
        <MemoizedInactivityAlert {...inactivityAlertProps} />

        {/* Switch User Button */}
        {isUserActive && !sessionManager.showInactivityAlert && (
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
