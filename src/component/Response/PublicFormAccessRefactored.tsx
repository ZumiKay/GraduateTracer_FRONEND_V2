import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Alert, Spinner } from "@heroui/react";
import { useParams } from "react-router-dom";
import { ErrorToast } from "../Modal/AlertModal";
import SuccessToast from "../Modal/AlertModal";
import RespondentForm from "./RespondentForm";
import {
  storeGuestData,
  clearGuestData,
  validateGuestEmail,
  getGuestData,
} from "../../utils/publicFormUtils";
import useRespondentFormPaginaition from "./hooks/usePaginatedFormData";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { generateStorageKey } from "../../helperFunc";
import { RespondentInfoType, RespondentSessionType } from "./Response.type";
import { FormTypeEnum } from "../../types/Form.types";
import {
  PublicFormAccessProps,
  LoginData,
  GuestData,
} from "../../types/PublicFormAccess.types";
import { useLogin, useSwitchUser } from "../../hooks/usePublicFormAccess";
import { useSessionManager } from "../../hooks/useSessionManager";
import { AuthContainer } from "./AuthContainer";
import { InactivityAlert } from "./InactivityAlert";

const PublicFormAccess: React.FC<PublicFormAccessProps> = () => {
  const { formId } = useParams<{ formId: string; token: string }>();
  const user = useSelector((root: RootState) => root.usersession);

  const [formsession, setformsession] =
    useState<Partial<RespondentSessionType>>();
  const [accessMode, setAccessMode] = useState<
    "login" | "guest" | "authenticated"
  >("login");
  const loginMutation = useLogin({ isGuest: accessMode === "guest" });
  const logoutMutation = useSwitchUser();
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [respondentInfo, setrespondentInfo] = useState<RespondentInfoType>();
  const [initialVerify, setinitialVerify] = useState(true);

  // Form data states
  const [loginData, setLoginData] = useState<LoginData>({
    email: user.user?.email ?? "",
    password: "",
    rememberMe: false,
  });
  const [guestData, setGuestData] = useState<GuestData>({
    name: "",
    email: "",
  });

  const [loading] = useState(false);

  const formReqData = useRespondentFormPaginaition({
    formId,
    initialVerify,
  });

  const isFormRequiredSessionChecked = useMemo(() => {
    if (
      !formReqData.formState ||
      !formReqData.formState.setting?.acceptResponses
    ) {
      return false;
    }

    // If it's a quiz form, authentication is always required
    if (formReqData.formState.type === FormTypeEnum.Quiz) {
      return true;
    }

    // For normal forms, check if email setting is enabled
    return (
      formReqData.formState.type === FormTypeEnum.Normal &&
      formReqData.formState.setting?.email === true
    );
  }, [formReqData.formState]);

  // Determine if guest access should be available
  const isGuestAccessAllowed = useMemo(() => {
    if (
      !formReqData.formState ||
      !formReqData.formState.setting?.acceptResponses
    ) {
      return false;
    }

    // Quiz forms never allow guest access
    if (formReqData.formState.type === FormTypeEnum.Quiz) {
      return false;
    }

    // Normal forms allow guest access when email is not required
    return (
      formReqData.formState.type === FormTypeEnum.Normal &&
      formReqData.formState.setting?.email !== true
    );
  }, [formReqData.formState]);

  const isUserActive = useMemo(() => {
    if (accessMode === "login") return false;
    if (accessMode === "guest") return true;
    return formsession?.isActive === true;
  }, [accessMode, formsession?.isActive]);

  // Session management
  const sessionManager = useSessionManager({
    formId,
    userEmail: user.user?.email,
    accessMode,
    isFormRequiredSessionChecked,
    formsession,
    setformsession,
  });

  // Reset guest form when guest access is not allowed
  useEffect(() => {
    if (!isGuestAccessAllowed && showGuestForm) {
      setShowGuestForm(false);
    }
  }, [isGuestAccessAllowed, showGuestForm]);

  // Load saved session from localStorage
  useEffect(() => {
    if (formId && user.user?.email) {
      const key = generateStorageKey({
        suffix: "state",
        userKey: user.user.email,
        formId: formId,
      });
      const savedSession = localStorage.getItem(key);
      if (savedSession) {
        try {
          const parsedSession = JSON.parse(
            savedSession
          ) as Partial<RespondentSessionType>;
          setformsession(parsedSession);
        } catch (error) {
          console.error("Failed to parse saved session:", error);
        }
      }
    }
  }, [formId, user.user?.email]);

  // Load guest data
  useEffect(() => {
    const savedGuestData = getGuestData();
    if (savedGuestData) {
      setGuestData(savedGuestData);
      // Auto-set guest mode if guest data exists and no user is logged in
      if (!user.user) {
        setAccessMode("guest");
      }
    }
  }, [user.user]);

  // Guest session validation using localStorage (no server requests)
  const validateGuestSession = useCallback(() => {
    if (accessMode !== "guest") return true;

    const savedGuestData = getGuestData();
    if (!savedGuestData) {
      // No guest data found, redirect to login
      setAccessMode("login");
      setGuestData({ name: "", email: "" });
      return false;
    }

    // Validate guest data
    if (!savedGuestData.email || !validateGuestEmail(savedGuestData.email)) {
      // Invalid guest data, clear and redirect to login
      clearGuestData();
      setAccessMode("login");
      setGuestData({ name: "", email: "" });
      return false;
    }

    // Update state with valid guest data
    setGuestData(savedGuestData);
    return true;
  }, [accessMode]);

  useEffect(() => {
    if (accessMode === "guest") {
      validateGuestSession();
    }
  }, [accessMode, validateGuestSession]);

  // Form state handling
  useEffect(() => {
    if (!formReqData.formState) return;

    //Disable form verify
    setinitialVerify(false);

    if (!isFormRequiredSessionChecked) {
      // Public form - no authentication required
      setAccessMode("authenticated");
      return;
    }

    // Form requires authentication
    if (user.user && !formsession?.isSwitchedUser) {
      const sessionState = { isActive: true, isSwitchedUser: false };
      sessionManager.saveLoginStateToStorage(sessionState);
      setformsession(sessionState);
      setAccessMode("authenticated");
    } else {
      setAccessMode("login");
    }
  }, [
    formReqData.formState,
    isFormRequiredSessionChecked,
    user.user,
    formsession?.isSwitchedUser,
    sessionManager,
  ]);

  // Event handlers
  const handleLoginChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setLoginData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    },
    []
  );

  const handleGuestChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setGuestData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await loginMutation.mutateAsync(loginData);
        const sessionState = { isActive: true, isSwitchedUser: false };
        sessionManager.saveLoginStateToStorage(sessionState);
        setformsession(sessionState);
        setAccessMode("authenticated");
        SuccessToast({ title: "Success", content: "Login successful!" });
      } catch (error) {
        ErrorToast({
          title: "Error",
          content: error instanceof Error ? error.message : "Login failed",
        });
      }
    },
    [loginData, loginMutation, sessionManager]
  );

  const handleLoginExisted = useCallback(() => {
    const sessionState = { isActive: true, isSwitchedUser: false };
    sessionManager.saveLoginStateToStorage(sessionState);
    setformsession(sessionState);
    setAccessMode("authenticated");
  }, [sessionManager]);

  const handleGuestAccess = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!guestData.name || !guestData.email) {
        ErrorToast({
          title: "Error",
          content: "Please provide both name and email",
        });
        return;
      }

      if (!validateGuestEmail(guestData.email)) {
        ErrorToast({
          title: "Error",
          content: "Please enter a valid email address",
        });
        return;
      }

      storeGuestData(guestData);
      setAccessMode("guest");
      SuccessToast({ title: "Success", content: "Guest access granted!" });
    },
    [guestData]
  );

  const handleSwitchUser = useCallback(
    async (isGuest: boolean = false) => {
      try {
        await logoutMutation.mutateAsync({
          isGuest,
          formId,
          userKey: user.user?.email,
        });

        if (isGuest) {
          clearGuestData();
          setGuestData({ name: "", email: "" });
        }

        setformsession(undefined);
        setAccessMode("login");
        setShowGuestForm(false);
        SuccessToast({
          title: "Success",
          content: "Switched user successfully!",
        });
      } catch (error) {
        ErrorToast({
          title: "Error",
          content:
            error instanceof Error ? error.message : "Failed to switch user",
        });
      }
    },
    [logoutMutation, formId, user.user?.email]
  );

  // Loading state
  if (formReqData.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (formReqData.error && !formReqData.formState) {
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
  if (accessMode === "authenticated" || accessMode === "guest") {
    return (
      <div className="w-full min-h-screen">
        {/* Inactivity Alert */}
        <InactivityAlert
          showFloatingAlert={Boolean(
            sessionManager.showInactivityAlert && isUserActive
          )}
          showFullScreenAlert={Boolean(
            sessionManager.showInactivityAlert && !isUserActive
          )}
          isLoading={logoutMutation.isPending}
          accessMode={accessMode}
          onReactivateSession={sessionManager.handleReactivateSession}
          onSwitchUser={handleSwitchUser}
        />

        {/* Switch User Button */}
        {(isUserActive || accessMode === "guest") &&
          !sessionManager.showInactivityAlert && (
            <div className="fixed top-4 right-4 z-10">
              <Button
                variant="light"
                size="sm"
                onPress={() => handleSwitchUser(accessMode === "guest")}
                className="bg-white shadow-md"
                isLoading={loading}
              >
                Switch User
              </Button>
            </div>
          )}

        {/* Render form based on user state */}
        {(isUserActive || accessMode === "guest") &&
          !sessionManager.showInactivityAlert && (
            <RespondentForm
              data={formReqData}
              isGuest={accessMode === "guest"}
              RespondentData={
                accessMode === "guest"
                  ? guestData
                  : user.user
                  ? {
                      email: user.user?.email as string,
                      name: user.user?.name as string,
                    }
                  : undefined
              }
              userId={user.user?._id}
              respondentInfo={respondentInfo}
              setrespondentInfo={setrespondentInfo}
              accessMode={accessMode}
              isUserActive={isUserActive}
            />
          )}
      </div>
    );
  }

  // Login/Guest form selection
  return (
    <AuthContainer
      formTitle={formReqData.formState?.title}
      formType={formReqData.formState?.type as FormTypeEnum}
      showGuestForm={showGuestForm}
      isGuestAccessAllowed={isGuestAccessAllowed}
      loginData={loginData}
      guestData={guestData}
      isLoginLoading={loginMutation.isPending}
      user={{
        user: user.user as unknown as Record<string, unknown>,
        isAuthenticated: user.isAuthenticated,
      }}
      onLoginChange={handleLoginChange}
      onGuestChange={handleGuestChange}
      onLoginSubmit={handleLogin}
      onGuestSubmit={handleGuestAccess}
      onLoginExisted={handleLoginExisted}
      onShowGuestForm={() => setShowGuestForm(true)}
      onBackToLogin={() => setShowGuestForm(false)}
      onRememberMeChange={(checked) =>
        setLoginData((prev) => ({ ...prev, rememberMe: checked }))
      }
    />
  );
};

export default PublicFormAccess;
