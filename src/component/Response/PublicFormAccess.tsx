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
import useRespondentFormPaginaition from "./hooks/usePaginatedFormData";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  cleanupUnrelatedLocalStorage,
  generateStorageKey,
  saveFormStateToLocalStorage,
} from "../../helperFunc";
import { RespondentInfoType, RespondentSessionType } from "./Response.type";
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
import { FormState } from "./types/PublicFormAccessTypes";
import { formStateReducer } from "./reducers/formStateReducer";
import { SubmissionSuccessView } from "./components/SubmissionSuccessView";
import { useSendResponseCopy } from "./hooks/useFormSubmission";
import { ApiError } from "../../hooks/APIHook/ApiHook";

export type PublicFormAccessProps = Record<string, never>;

const initialFormState: FormState = {
  accessMode: "login",
  showGuestForm: false,
  loginData: { email: "", password: "", rememberMe: false },
};

const PublicFormAccess: React.FC<PublicFormAccessProps> = () => {
  const { formId } = useParams<{ formId: string; token: string }>();
  const user = useSelector((root: RootState) => root.usersession);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!formId) {
      navigate("/notfound");
    }
  }, [formId, navigate]);

  const [formState, dispatch] = useReducer(formStateReducer, {
    ...initialFormState,
    loginData: { ...initialFormState.loginData, email: user.user?.email ?? "" },
  });
  const [showExpiredAlert, setShowExpiredAlert] = useState(false);

  const { isInitialized, isInitializing } = useFormInitialization({
    formId,
    dispatch,
  });

  const MIN_LOADING_TIME = 500;

  const [loadingState, setLoadingState] = useState({
    isLoading: true,
    phase: "initializing" as "initializing" | "loading-form" | "ready",
    loadingStartTime: Date.now(),
    allowPaginationLoading: false,
  });

  const { respondentLogin, signOut, useSessionVeriftication } =
    useFormsessionAPI();

  const manuallyCheckSession = useSessionVeriftication(formId, () =>
    setShowExpiredAlert(true),
  );

  const formDataEnabled = Boolean(isInitialized && formId);
  const formReqData = useRespondentFormPaginaition({
    formId,
    accessMode: formState.accessMode,
    formsession: formState.formsession as never,
    enabled: formDataEnabled,
  });

  useEffect(() => {
    if (!isInitialized) return; // Wait for initialization to complete

    if (!formReqData.isFetching) {
      if (formReqData.isSuccess && formReqData.formState) {
        const state = formReqData.formState;

        if (!state.isAuthenticated && state.setting?.email) {
          dispatch({ type: "SET_ACCESS_MODE", payload: "login" });
          return;
        }

        const isAuthenticated = state.isAuthenticated || !state.setting?.email;

        if (
          isAuthenticated &&
          !state.setting?.email &&
          !formState.formsession?.isActive
        ) {
          dispatch({ type: "SET_FORMSESSION", payload: { isActive: true } });
        }

        dispatch({
          type: "SET_ACCESS_MODE",
          payload: isAuthenticated ? "authenticated" : "login",
        });
      } else if (formReqData.error) {
        if (!isUserSwitching() && formState.accessMode !== "login") {
          dispatch({ type: "SET_ACCESS_MODE", payload: "error" });
        }
      }
    }
  }, [
    formReqData,
    formState.accessMode,
    formState.formsession?.isActive,
    isInitialized,
  ]);

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
      formReqData.isFetching &&
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
      (!formReqData.isFetching || loadingState.allowPaginationLoading) &&
      isInitialized
    ) {
      const shouldWait = timeSinceStart < MIN_LOADING_TIME;

      if (!shouldWait && loadingState.isLoading) {
        setLoadingState((prev) => ({
          ...prev,
          isLoading: false,
          phase: "ready",
          allowPaginationLoading: true, // Now allow form to handle its own loading
        }));
      } else if (shouldWait) {
        const remainingTime = MIN_LOADING_TIME - timeSinceStart;
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
    formReqData.isFetching,
    isInitialized,
    loadingState.phase,
    loadingState.loadingStartTime,
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
        const currentSession = formState.formsession;
        const newSession = sessionOrUpdater(currentSession);
        dispatch({ type: "SET_FORMSESSION", payload: newSession });
      } else {
        dispatch({ type: "SET_FORMSESSION", payload: sessionOrUpdater });
      }
    },
    [formState.formsession],
  );

  const sessionManager = useSessionManager({
    accessMode: formState.accessMode,
    formsession: formState.formsession,
    setformsession: setFormsessionStable as never,
    onAutoSignOut: () => handleSwitchUser,
    isFormRequiredSessionChecked:
      formReqData.isFormRequiredSessionChecked ?? false,
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

  const handleLogin = useCallback(
    async (e?: React.FormEvent, additional?: { existed: "1" }) => {
      e?.preventDefault();
      if (!formId) return;
      const { rememberMe, email, name, password, isGuest } =
        formState.loginData;

      respondentLogin.mutate(
        {
          existed: additional?.existed,
          formId,
          ...(!additional?.existed && {
            rememberMe,
            email,
            name,
            password,
            isGuest,
          }),
        },
        {
          onSuccess: () => {
            const sessionState: Partial<RespondentSessionType> = {
              isActive: true,
              respondentinfo: {
                respondentEmail: additional?.existed
                  ? (user.user?.email ?? "")
                  : email,
                respondentName: name || undefined,
                isGuest,
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
              userKey: formState.loginData.email,
              suffix: ["state", "progress"],
            });

            dispatch({ type: "SET_FORMSESSION", payload: sessionState });
            dispatch({
              type: "SET_ACCESS_MODE",
              payload: "authenticated",
            });
            SuccessToast({
              toastid: "Respondent LoggedIn",
              title: "Success",
              content: "Logged in",
            });
          },
        },
      );
    },
    [
      formId,
      formState.loginData,
      localFormSessionStateKey,
      respondentLogin,
      user.user?.email,
      dispatch,
    ],
  );

  const handleSwitchUser = useCallback(() => {
    if (!formId) return;

    setUserSwitching(true);

    signOut.mutate(formId, {
      onSuccess: () => {
        //Clean cache
        queryClient.removeQueries({ queryKey: ["respondent-form", formId] });
        setUserSwitching(false);

        if (user.isAuthenticated) {
          const updateFormSession = { isActive: undefined };
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
      },
      onError: (error) => {
        console.error("Error during switch user:", error);
        setUserSwitching(false);
        ErrorToast({
          toastid: "switchusererror",
          title: "Error",
          content: "Can't logout. Please try again.",
        });
      },
    });
  }, [
    formId,
    formState.formsession?.respondentinfo?.respondentEmail,
    localFormSessionStateKey,
    queryClient,
    signOut,
    user.isAuthenticated,
  ]);

  const alreadyRespondedData = useMemo(
    () =>
      formReqData.formState?.setting?.submitonce
        ? formReqData.formState?.isResponsed
        : undefined,
    [
      formReqData.formState?.isResponsed,
      formReqData.formState?.setting?.submitonce,
    ],
  );

  const sendResponseCopy = useSendResponseCopy(
    alreadyRespondedData?.responseId,
    alreadyRespondedData?.respondentEmail,
  );

  const respondentFormProps: RespondentFormProps = useMemo(
    () => ({
      data: formReqData,
      userId: user.user?._id,
      formSessionInfo:
        formState.formsession?.respondentinfo || ({} as RespondentInfoType),
      accessMode:
        formState.accessMode === "error" ? "login" : formState.accessMode,
      isUserActive: formState.formsession?.isActive,
      isLoading: loadingState.isLoading,
    }),
    [
      formReqData,
      user.user?._id,
      formState.formsession?.respondentinfo,
      formState.formsession?.isActive,
      formState.accessMode,
      loadingState.isLoading,
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

  if (formState.accessMode === "authenticated") {
    return (
      <>
        {showExpiredAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <Alert
                color="warning"
                variant="faded"
                title="Session Expired"
                description={`Your session for "${formState.formsession?.respondentinfo?.respondentName || formState.formsession?.respondentinfo?.respondentEmail}" has expired. Please login again`}
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

        <div className="w-full min-h-screen">
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

          {isInitialized &&
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
                checkOnVisibilityChange={true}
              >
                <RespondentForm {...respondentFormProps} />
              </SessionProvider>
            ))}
        </div>
      </>
    );
  }

  return !formReqData.isFetching && !formReqData.formState?.isAuthenticated ? (
    <AuthContainer
      formTitle={formReqData.formState?.title}
      showGuestForm={formState.showGuestForm}
      loginData={formState.loginData}
      error={
        (respondentLogin?.error as ApiError)?.status !== 500
          ? respondentLogin.error?.message
          : undefined
      }
      isLoginLoading={respondentLogin.isPending}
      updateLoginState={dispatch}
      user={user}
      onLogin={handleLogin}
    />
  ) : null;
};

export default React.memo(PublicFormAccess);
