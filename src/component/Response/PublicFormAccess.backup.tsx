import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Checkbox,
  Form,
  Alert,
  Spinner,
} from "@heroui/react";
import { FiUser, FiMail, FiLock, FiUserCheck } from "react-icons/fi";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import ApiRequest from "../../hooks/ApiHook";
import { PasswordInput } from "../FormComponent/Input";
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
import { UserType } from "../../types/User.types";
import { FormTypeEnum } from "../../types/Form.types";

interface PublicFormAccessProps {
  token?: string;
}

interface LoginData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface GuestData {
  name: string;
  email: string;
}

interface CheckRequestReturnType {
  session_id?: string;
  isExpired?: boolean;
  isError?: boolean;
  userdata?: Partial<UserType>;
}

const ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

// Custom hooks for React Query
const useLogin = () => {
  return useMutation({
    mutationFn: async (loginData: { email: string; password: string }) => {
      const result = await ApiRequest({
        url: "user/respondent/login",
        method: "POST",
        data: loginData,
        cookie: true,
      });

      if (!result.success) {
        throw new Error(result.error || "Invalid credentials");
      }

      return result;
    },
  });
};

const useSwitchUser = () => {
  return useMutation({
    mutationFn: async () => {
      const result = await ApiRequest({
        url: "user/respondent/logout",
        method: "DELETE",
        cookie: true,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to switch user");
      }

      return result;
    },
  });
};

const useCheckRespondentSession = (
  refetchKey: Record<string, boolean | undefined>,
  session_id?: string,
  enable?: boolean
) => {
  return useQuery({
    queryKey: [session_id, { ...refetchKey }],
    queryFn: async () => {
      const result = await ApiRequest({
        url: "user/respondent/session",
        method: "GET",
        cookie: true,
      });
      return result;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!session_id || enable, // Only run when enabled
    refetchOnWindowFocus: true,
    refetchOnMount: false,
  });
};

const PublicFormAccess: React.FC<PublicFormAccessProps> = () => {
  const { formId } = useParams<{ formId: string; token: string }>();
  const user = useSelector((root: RootState) => root.usersession);

  const loginMutation = useLogin();
  const logoutMutation = useSwitchUser();

  const [formsession, setformsession] =
    useState<Partial<RespondentSessionType>>();
  const [accessMode, setAccessMode] = useState<
    "login" | "guest" | "authenticated"
  >("login");
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [userInactive, setUserInactive] = useState(false);
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

  const activityTimeoutRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
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
    return formsession?.isActive === true && !userInactive;
  }, [accessMode, formsession?.isActive, userInactive]);

  // Reset guest form when guest access is not allowed
  useEffect(() => {
    if (!isGuestAccessAllowed && showGuestForm) {
      setShowGuestForm(false);
    }
  }, [isGuestAccessAllowed, showGuestForm]);

  // Storage management
  const saveLoginStateToStorage = useCallback(
    (state: Partial<RespondentSessionType>) => {
      if (!formId) return;
      const key = generateStorageKey({
        suffix: "state",
        userKey: user.user?.email ?? "user",
        formId: formId,
      });
      localStorage.setItem(key, JSON.stringify({ ...state }));
    },
    [formId, user.user?.email]
  );

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

  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setUserInactive(false);

    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    if (
      accessMode === "authenticated" &&
      isFormRequiredSessionChecked &&
      formsession?.isActive
    ) {
      activityTimeoutRef.current = window.setTimeout(() => {
        setUserInactive(true);
        setformsession((prev) => ({
          ...prev,
          isActive: false,
          alert: true,
        }));

        if (formId) {
          const key = generateStorageKey({
            suffix: "state",
            userKey: user.user?.email ?? "user",
            formId: formId,
          });
          localStorage.removeItem(key);
        }
      }, ACTIVITY_TIMEOUT);
    }
  }, [
    accessMode,
    isFormRequiredSessionChecked,
    formsession?.isActive,
    formId,
    user.user?.email,
  ]);

  const handleUserActivity = useCallback(() => {
    if (
      accessMode === "authenticated" &&
      formsession?.isActive &&
      !userInactive
    ) {
      resetActivityTimer();
    }
  }, [accessMode, formsession?.isActive, userInactive, resetActivityTimer]);

  useEffect(() => {
    if (
      accessMode === "authenticated" &&
      isFormRequiredSessionChecked &&
      isUserActive
    ) {
      const events = [
        "mousedown",
        "mousemove",
        "keypress",
        "scroll",
        "touchstart",
        "click",
      ];

      events.forEach((event) => {
        document.addEventListener(event, handleUserActivity, { passive: true });
      });

      resetActivityTimer();

      return () => {
        events.forEach((event) => {
          document.removeEventListener(event, handleUserActivity);
        });

        if (activityTimeoutRef.current) {
          clearTimeout(activityTimeoutRef.current);
        }
      };
    }
  }, [
    accessMode,
    isFormRequiredSessionChecked,
    isUserActive,
    handleUserActivity,
    resetActivityTimer,
  ]);

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
      saveLoginStateToStorage(sessionState);
      setformsession(sessionState);
      setAccessMode("authenticated");
      setrespondentInfo({ email: user.user.email, name: user.user.name });
    } else {
      setAccessMode("login");
    }
  }, [
    formReqData.formState,
    isFormRequiredSessionChecked,
    user.user,
    formsession?.isSwitchedUser,
    saveLoginStateToStorage,
  ]);

  const checkSession = useCheckRespondentSession(
    {
      isActive: formsession?.isActive,
      isSwitchedUser: formsession?.isSwitchedUser,
    },
    formsession?.session_id,
    !!(
      isFormRequiredSessionChecked &&
      accessMode === "authenticated" &&
      formsession?.session_id
    )
  );

  useEffect(() => {
    if (
      !isFormRequiredSessionChecked ||
      accessMode === "guest" || // Guests don't need server session validation
      accessMode !== "authenticated" ||
      !formsession?.session_id
    ) {
      return;
    }

    if (checkSession.data) {
      if (!checkSession.data.success) {
        const data = checkSession.data?.data as CheckRequestReturnType;

        if (data?.isExpired) {
          // Session expired - mark as inactive
          setUserInactive(true);
          setformsession((prev) => ({
            ...prev,
            isActive: false,
            alert: true,
          }));

          // Clear storage
          if (formId) {
            const key = generateStorageKey({
              suffix: "state",
              userKey: user.user?.email ?? "user",
              formId: formId,
            });
            localStorage.removeItem(key);
          }
          return;
        }

        // Other session errors - back to login
        setAccessMode("login");
        setformsession(undefined);
        setrespondentInfo(undefined);
        setUserInactive(false);
      } else if (checkSession.data.data) {
        // Valid session - update state
        const verifiedSession = checkSession.data.data as RespondentSessionType;
        setformsession((prev) => ({
          ...prev,
          isActive: true,
          session_id: verifiedSession.session_id,
        }));
        setrespondentInfo(verifiedSession.respondentinfo);
        setUserInactive(false);
      }
    }
  }, [
    checkSession.data,
    isFormRequiredSessionChecked,
    accessMode,
    formsession?.session_id,
    formId,
    user.user?.email,
  ]);

  const handleSwitchUser = async (isGuest?: boolean) => {
    // Clear activity timer when switching users
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    if (isGuest) {
      clearGuestData();
      setGuestData({ name: "", email: "" });
    } else {
      // Clear login data for fresh start
      setLoginData({ email: "", password: "", rememberMe: false });
    }

    // Clear session and mark as switched
    const switchedState = { isSwitchedUser: true, isActive: false };
    if (user.user && formId) {
      saveLoginStateToStorage(switchedState);
    }

    if (!isGuest && formsession?.isSwitchedUser) {
      const res = await logoutMutation.mutateAsync();
      if (!res.success) {
        ErrorToast({ title: "Error", content: res.error ?? "Error Occured" });
        return;
      }
    }

    setformsession(switchedState);
    setAccessMode("login");
    setUserInactive(false);
    setrespondentInfo(undefined);
  };

  const setGuestSession = useCallback((data: GuestData) => {
    storeGuestData(data);
    setGuestData(data);
    setAccessMode("guest");
    setformsession(undefined);
    setUserInactive(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      ErrorToast({
        title: "Error",
        content: "Please enter both email and password",
      });
      return;
    }

    try {
      const login = await loginMutation.mutateAsync({
        email: loginData.email,
        password: loginData.password,
      });

      if (login.success && login.data) {
        const loggedinformsession: RespondentSessionType = {
          isActive: true,
          isSwitchedUser: false,
        };

        // Save session and set authenticated
        saveLoginStateToStorage(loggedinformsession);
        setformsession(loggedinformsession);
        setAccessMode("authenticated");
        setUserInactive(false);

        SuccessToast({
          title: "Success",
          content: "Login successful!",
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Invalid credentials";
      ErrorToast({
        title: "Login Failed",
        content: errorMessage,
      });
    }
  };

  const handleGuestAccess = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if guest access is allowed for this form
    if (!isGuestAccessAllowed) {
      ErrorToast({
        title: "Access Denied",
        content:
          formReqData.formState?.type === FormTypeEnum.Quiz
            ? "Authentication is required for quiz forms"
            : "Guest access is not enabled for this form",
      });
      setShowGuestForm(false);
      return;
    }

    if (!guestData.email) {
      ErrorToast({
        title: "Error",
        content: "Please enter both name and email",
      });
      return;
    }

    // Email validation
    if (!validateGuestEmail(guestData.email)) {
      ErrorToast({
        title: "Error",
        content: "Please enter a valid email address",
      });
      return;
    }

    try {
      setGuestSession(guestData);
      SuccessToast({
        title: "Success",
        content: "Guest access granted!",
      });
    } catch {
      ErrorToast({
        title: "Error",
        content: "Failed to process guest access",
      });
    }
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleGuestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGuestData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLoginExisted = useCallback(() => {
    if (user.user) {
      const activeSession = { isActive: true, isSwitchedUser: false };
      setformsession(activeSession);
      setAccessMode("authenticated");
      setrespondentInfo(user.user);
      setUserInactive(false);

      if (isFormRequiredSessionChecked) {
        saveLoginStateToStorage(activeSession);
      }
    } else {
      ErrorToast({ title: "Account Error", content: "No session found" });
    }
  }, [user.user, isFormRequiredSessionChecked, saveLoginStateToStorage]);

  // Show inactive user alert - only for authenticated users with session requirements
  const showInactivityAlert = useMemo(() => {
    return (
      accessMode === "authenticated" &&
      isFormRequiredSessionChecked &&
      (userInactive || (formsession?.alert && !formsession?.isActive))
    );
  }, [
    accessMode,
    isFormRequiredSessionChecked,
    userInactive,
    formsession?.alert,
    formsession?.isActive,
  ]);

  const handleReactivateSession = useCallback(() => {
    setUserInactive(false);
    setformsession((prev) => ({
      ...prev,
      isActive: true,
      alert: false,
    }));

    if (formId && isFormRequiredSessionChecked) {
      const activeSession = { isActive: true, alert: false };
      saveLoginStateToStorage(activeSession);
    }
  }, [formId, isFormRequiredSessionChecked, saveLoginStateToStorage]);

  if (formReqData.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

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

  if (accessMode === "authenticated" || accessMode === "guest") {
    return (
      <div className="w-full min-h-screen">
        {/* Inactivity Alert - only for authenticated users with session requirements */}
        {showInactivityAlert && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20">
            <Alert
              color="warning"
              title="Session Inactive"
              className="max-w-md"
            >
              <div className="flex flex-col gap-2">
                <p>
                  Your session has been inactive. Please reactivate to continue.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="warning"
                    variant="solid"
                    onPress={handleReactivateSession}
                  >
                    Reactivate Session
                  </Button>
                  <Button
                    size="sm"
                    variant="light"
                    onPress={() => handleSwitchUser(accessMode === "guest")}
                  >
                    Switch User
                  </Button>
                </div>
              </div>
            </Alert>
          </div>
        )}

        {(isUserActive || accessMode === "guest") && (
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
        {(isUserActive || accessMode === "guest") && !showInactivityAlert ? (
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
        ) : showInactivityAlert ? (
          <div className="flex justify-center items-center min-h-screen">
            <Card className="w-full max-w-md">
              <CardBody className="text-center">
                <Alert color="warning" title="Session Inactive">
                  Your session is currently inactive. Please reactivate to
                  continue with the form.
                </Alert>
                <div className="mt-4 space-y-2">
                  <Button
                    color="primary"
                    className="w-full"
                    onPress={handleReactivateSession}
                  >
                    Reactivate Session
                  </Button>
                  <Button
                    variant="light"
                    className="w-full"
                    isLoading={logoutMutation.isPending}
                    onPress={() => handleSwitchUser(accessMode === "guest")}
                  >
                    Switch User
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        ) : (
          <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <Card className="backdrop-blur-sm bg-white/95 shadow-xl border-0">
                <CardHeader className="text-center pb-4 pt-8">
                  <div className="w-full flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <FiUser className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-2xl opacity-20 blur-sm"></div>
                    </div>
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        {formReqData.formState?.title || "Form Access"}
                      </h1>
                      <p className="text-gray-500 text-sm">
                        Please sign in to continue
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardBody className="pt-0 pb-8 px-8">
                  {!showGuestForm || !isGuestAccessAllowed ? (
                    // Enhanced Login Form
                    <div className="space-y-6">
                      <Form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1">
                          <Input
                            name="email"
                            type="email"
                            label="Email"
                            placeholder="Enter your email"
                            value={loginData.email}
                            onChange={handleLoginChange}
                            variant="bordered"
                            radius="lg"
                            size="lg"
                            className="w-full"
                            classNames={{
                              input: "text-gray-700",
                              inputWrapper:
                                "border-gray-200 hover:border-blue-400 focus-within:border-blue-500 bg-white/50 transition-colors",
                              label: "text-gray-600 font-medium",
                            }}
                            startContent={
                              <FiMail className="w-4 h-4 text-gray-400" />
                            }
                            isRequired
                          />
                        </div>

                        <div className="space-y-1">
                          <PasswordInput
                            name="password"
                            label="Password"
                            placeholder="Enter your password"
                            value={loginData.password}
                            onChange={handleLoginChange}
                            variant="bordered"
                            radius="lg"
                            size="lg"
                            className="w-full"
                            classNames={{
                              input: "text-gray-700",
                              inputWrapper:
                                "border-gray-200 hover:border-blue-400 focus-within:border-blue-500 bg-white/50 transition-colors",
                              label: "text-gray-600 font-medium",
                            }}
                            isRequired
                          />
                        </div>

                        <div className="flex items-center justify-between py-2">
                          <Checkbox
                            name="rememberMe"
                            isSelected={loginData.rememberMe}
                            onValueChange={(checked) =>
                              setLoginData((prev) => ({
                                ...prev,
                                rememberMe: checked,
                              }))
                            }
                            size="sm"
                            radius="md"
                            classNames={{
                              base: "data-[selected=true]:bg-blue-500",
                              wrapper: "border-gray-300",
                            }}
                          >
                            <span className="text-sm text-gray-600">
                              Remember me
                            </span>
                          </Checkbox>
                          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors bg-transparent border-none cursor-pointer">
                            Forgot password?
                          </button>
                        </div>

                        <div className="space-y-3">
                          <Button
                            type="submit"
                            color="primary"
                            size="lg"
                            radius="lg"
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                            isLoading={loginMutation.isPending}
                            startContent={<FiLock className="w-4 h-4" />}
                          >
                            {loginMutation.isPending
                              ? "Signing in..."
                              : "Sign In"}
                          </Button>

                          {user.isAuthenticated && user.user && (
                            <Button
                              onPress={() => handleLoginExisted()}
                              type="button"
                              color="secondary"
                              size="lg"
                              radius="lg"
                              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                            >
                              {`Continue as ${user.user?.email}`}
                            </Button>
                          )}
                        </div>
                      </Form>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-white text-gray-500 font-medium">
                            Or continue with
                          </span>
                        </div>
                      </div>

                      {/* Guest Access Option - Conditional based on form type and settings */}
                      {isGuestAccessAllowed ? (
                        <div className="text-center space-y-3">
                          <p className="text-gray-600 text-sm">
                            Don't have an account?
                          </p>
                          <Button
                            variant="bordered"
                            color="default"
                            size="lg"
                            radius="lg"
                            className="w-full border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition-all duration-200"
                            onPress={() => setShowGuestForm(true)}
                            startContent={<FiUserCheck className="w-4 h-4" />}
                          >
                            Continue as Guest
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          {formReqData.formState?.type === FormTypeEnum.Quiz ? (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-blue-700 text-sm">
                                <strong>Quiz Form:</strong> Authentication is
                                required to take this quiz.
                              </p>
                            </div>
                          ) : (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-amber-700 text-sm">
                                <strong>Email Required:</strong> Please sign in
                                to access this form.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto shadow-lg">
                          <FiUserCheck className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">
                          Guest Access
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Please provide your details to continue
                        </p>
                      </div>

                      <Form onSubmit={handleGuestAccess} className="space-y-5">
                        <div className="space-y-1">
                          <Input
                            name="name"
                            type="text"
                            label="Full Name"
                            placeholder="Enter your full name"
                            value={guestData.name}
                            onChange={handleGuestChange}
                            variant="bordered"
                            radius="lg"
                            size="lg"
                            className="w-full"
                            classNames={{
                              input: "text-gray-700",
                              inputWrapper:
                                "border-gray-200 hover:border-emerald-400 focus-within:border-emerald-500 bg-white/50 transition-colors",
                              label: "text-gray-600 font-medium",
                            }}
                            startContent={
                              <FiUser className="w-4 h-4 text-gray-400" />
                            }
                            isRequired
                          />
                        </div>

                        <div className="space-y-1">
                          <Input
                            name="email"
                            type="email"
                            label="Email"
                            placeholder="Enter your email"
                            value={guestData.email}
                            onChange={handleGuestChange}
                            variant="bordered"
                            radius="lg"
                            size="lg"
                            className="w-full"
                            classNames={{
                              input: "text-gray-700",
                              inputWrapper:
                                "border-gray-200 hover:border-emerald-400 focus-within:border-emerald-500 bg-white/50 transition-colors",
                              label: "text-gray-600 font-medium",
                            }}
                            startContent={
                              <FiMail className="w-4 h-4 text-gray-400" />
                            }
                            isRequired
                          />
                        </div>

                        <div className="flex space-x-3 pt-2">
                          <Button
                            type="button"
                            variant="bordered"
                            size="lg"
                            radius="lg"
                            className="flex-1 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition-all duration-200"
                            onPress={() => setShowGuestForm(false)}
                          >
                            Back to Login
                          </Button>

                          <Button
                            type="submit"
                            color="secondary"
                            size="lg"
                            radius="lg"
                            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                            isLoading={false}
                            startContent={<FiUserCheck className="w-4 h-4" />}
                          >
                            Continue as Guest
                          </Button>
                        </div>
                      </Form>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      </div>
    );
  }
};

export default PublicFormAccess;
