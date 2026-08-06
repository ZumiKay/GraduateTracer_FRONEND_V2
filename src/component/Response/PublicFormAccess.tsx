import React, {
  useEffect,
  useCallback,
  useMemo,
  useReducer,
  useState,
} from "react";
import { Button, Alert, Spinner, Card, CardHeader, CardBody, Chip } from "@heroui/react";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorToast } from "../Modal/AlertModal";
import SuccessToast from "../Modal/AlertModal";
import RespondentForm, { RespondentFormProps } from "./RespondentForm";
import useRespondentFormPaginaition from "./hooks/usePaginatedFormData";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { ErrorValidataionPropsType } from "../../types/Form.types";
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
        if (formReqData.isValidationError) {
          dispatch({ type: "SET_ACCESS_MODE", payload: "error" });
        }
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

  // --- Content validation calculations (derived before conditional returns for Rules of Hooks) ---
  const contentValidation = formReqData.formState?.contentValidation;
  const hasContentErrors =
    !contentValidation?.isValid &&
    Array.isArray(contentValidation?.errors) &&
    (contentValidation?.errors?.length ?? 0) > 0;

  const genericErrorMessage =
    formReqData.error instanceof Error
      ? formReqData.error.message
      : "Failed to load form";

  const errorsByPage = useMemo(() => {
    if (!hasContentErrors || !contentValidation?.errors) return {};
    return (contentValidation.errors as ErrorValidataionPropsType[]).reduce<
      Record<number, ErrorValidataionPropsType[]>
    >((acc, err) => {
      const p = err.page ?? 1;
      if (!acc[p]) acc[p] = [];
      acc[p].push(err);
      return acc;
    }, {});
  }, [contentValidation, hasContentErrors]);

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
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-200">
        <Card className="w-full max-w-xl shadow-2xl border border-red-200/80 dark:border-red-900/40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md overflow-hidden rounded-2xl">
          {/* Top Accent Line */}
          <div className="h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 w-full" />

          <CardHeader className="flex flex-col items-center text-center pt-8 pb-4 px-6">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400 ring-8 ring-red-50 dark:ring-red-950/30">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {hasContentErrors
                ? "Form Configuration Error"
                : "Unable to Access Form"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
              {hasContentErrors
                ? "This form contains structural errors or missing configurations that prevent it from being displayed."
                : genericErrorMessage}
            </p>
          </CardHeader>

          <CardBody className="px-6 py-4 space-y-4">
            {hasContentErrors ? (
              <div className="rounded-xl border border-red-200/70 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-red-100/60 dark:bg-red-900/40 border-b border-red-200 dark:border-red-900/60">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-red-600 dark:text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-800 dark:text-red-300">
                      Validation Issues Detected
                    </span>
                  </div>
                  <Chip
                    size="sm"
                    color="danger"
                    variant="flat"
                    className="font-medium"
                  >
                    {contentValidation!.errors!.length}{" "}
                    {contentValidation!.errors!.length === 1
                      ? "Issue"
                      : "Issues"}
                  </Chip>
                </div>

                <div className="divide-y divide-red-200/40 dark:divide-red-900/40 max-h-72 overflow-y-auto">
                  {Object.entries(errorsByPage).map(([pageKey, pageErrors]) => (
                    <div key={pageKey} className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Chip
                          size="sm"
                          variant="bordered"
                          color="danger"
                          className="h-5 text-[11px] font-semibold"
                        >
                          Page {pageKey}
                        </Chip>
                      </div>
                      <div className="space-y-2 pt-1">
                        {(pageErrors as ErrorValidataionPropsType[]).map(
                          (err, idx) => (
                            <div
                              key={`${err.questionId || err._id || idx}-${idx}`}
                              className="flex items-start gap-3 p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-red-100 dark:border-red-950 shadow-xs"
                            >
                              <span className="flex-shrink-0 px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 text-xs font-mono font-bold">
                                Q{err.qIdx !== undefined ? err.qIdx : "?"}
                              </span>
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                                {err.message?.message ||
                                  "Invalid question setup"}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Alert
                color="danger"
                variant="faded"
                title="Error Details"
                description={genericErrorMessage}
                className="rounded-xl border border-red-200 dark:border-red-900/50"
              />
            )}

            <div className="rounded-xl bg-slate-100/70 dark:bg-slate-800/50 p-3.5 border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                <svg
                  className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  {hasContentErrors
                    ? "If you are the owner of this form, please log in to the form builder to correct the question settings."
                    : "Please verify the form URL or contact the administrator if you believe this is a mistake."}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <Button
                variant="flat"
                color="default"
                size="sm"
                className="w-full sm:w-auto font-medium"
                onPress={() => navigate(-1)}
              >
                Go Back
              </Button>
              <Button
                color="danger"
                size="sm"
                className="w-full sm:w-auto font-medium shadow-md shadow-red-500/20"
                onPress={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </CardBody>
        </Card>
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
