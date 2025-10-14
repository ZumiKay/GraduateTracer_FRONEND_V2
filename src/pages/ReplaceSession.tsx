import { Button, Card, CardBody, CardHeader, Spinner } from "@heroui/react";
import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiAlertTriangle,
  FiLogIn,
  FiX,
  FiShield,
  FiCheckCircle,
} from "react-icons/fi";
import { useMutation } from "@tanstack/react-query";
import ApiRequest from "../hooks/ApiHook";
import SuccessToast, { ErrorToast } from "../component/Modal/AlertModal";
import { saveGuestData, generateStorageKey } from "../helperFunc";
import { GuestData } from "../types/PublicFormAccess.types";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

interface SessionData {
  session_id?: string;
  formId?: string;
  expiredAt?: string;
}

interface ReplaceSessionResponse {
  data?: SessionData;
  message?: string;
}

interface ReplaceSessionPageParamsType {
  code: string;
  formId: string;
}

// Memoized async function to prevent recreations
const asyncReplaceSession = async (
  code: string,
  isSkipLogin?: number
): Promise<ReplaceSessionResponse> => {
  const url = isSkipLogin
    ? `/response/sessionremoval/${code}?skiplogin=${isSkipLogin}`
    : `/response/sessionremoval/${code}`;

  const replaceReq = await ApiRequest({
    url,
    method: "PATCH",
    cookie: true,
    reactQuery: true,
  });

  if (!replaceReq.success) {
    throw new Error(replaceReq.error ?? "Error occurred");
  }

  return replaceReq.data as ReplaceSessionResponse;
};

const ReplaceSessionPage = () => {
  const { code, formId } =
    useParams() as unknown as ReplaceSessionPageParamsType;
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [sessionReplaced, setSessionReplaced] = useState(false);

  // Memoized decoded values to prevent unnecessary recalculations
  const { decodedCode, decodedFormId } = useMemo(
    () => ({
      decodedCode: decodeURIComponent(code),
      decodedFormId: decodeURIComponent(formId),
    }),
    [code, formId]
  );

  // Get user data from Redux store with memoized selector
  const userEmail = useSelector(
    (state: RootState) => state.usersession?.user?.email
  );

  // Memoized navigation URLs
  const { formAccessURL, notFoundURL } = useMemo(
    () => ({
      formAccessURL: `/form-access/${decodedFormId}`,
      notFoundURL: "/notfound",
    }),
    [decodedFormId]
  );

  // Memoized callbacks to prevent unnecessary re-renders
  const handleNavigateToForm = useCallback(
    (delay = 2000) => {
      setTimeout(() => {
        navigate(formAccessURL, { replace: true });
      }, delay);
    },
    [navigate, formAccessURL]
  );

  const handleNavigateToNotFound = useCallback(
    (delay = 3000) => {
      setTimeout(() => {
        navigate(notFoundURL, { replace: true });
      }, delay);
    },
    [navigate, notFoundURL]
  );

  // Separate mutation for terminate and login
  const terminateAndLoginMutation = useMutation({
    mutationFn: () => asyncReplaceSession(decodedCode),
    onSuccess: (data) => {
      setSessionReplaced(true);
      SuccessToast({
        title: "Success",
        content: "Session replaced successfully! Redirecting...",
      });

      if (data.data) {
        const sessionData = data.data as GuestData;
        saveGuestData(sessionData);
      }

      handleNavigateToForm();
    },
    onError: (error) => {
      ErrorToast({
        title: "Error",
        content:
          error instanceof Error ? error.message : "Failed to replace session",
      });
      handleNavigateToNotFound();
    },
  });

  // Separate mutation for dismiss (skip auto-login)
  const dismissMutation = useMutation({
    mutationFn: () => asyncReplaceSession(decodedCode, 1),
    onSuccess: () => {
      SuccessToast({
        title: "Session Dismissed",
        content:
          "Auto-login has been disabled for this form. You can manually login when needed.",
      });
      handleNavigateToForm(1500);
    },
    onError: (error) => {
      console.error("Error setting dismiss state:", error);
      ErrorToast({
        title: "Warning",
        content: error.message ?? "Something Wrong",
      });
      if (error.message === "Invalid code") {
        handleNavigateToNotFound(300);
      }
    },
  });

  // Early return effect for invalid parameters
  useEffect(() => {
    if (!code || !formId) {
      navigate(notFoundURL, { replace: true });
      return;
    }

    // Delayed animation trigger
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [code, formId, navigate, notFoundURL]);

  const handleTerminateAndLogin = useCallback(() => {
    terminateAndLoginMutation.mutate();
  }, [terminateAndLoginMutation]);

  const handleDismiss = useCallback(async () => {
    try {
      await dismissMutation.mutateAsync();

      // Set session state and storage keys after successful API call
      if (userEmail) {
        const sessionState = {
          isActive: false,
          isSwitchedUser: true,
        };

        const key = generateStorageKey({
          suffix: "state",
          formId: formId,
          userKey: userEmail,
        });

        localStorage.setItem(key, JSON.stringify(sessionState));
      }

      // Save guest data to prevent auto-login
      const guestData: Partial<GuestData> = {
        isActive: false,
        timeStamp: Date.now(),
        name: "dismissed_session",
      };

      saveGuestData(
        guestData as GuestData,
        `guest_session_${formId}_dismissed`
      );
    } catch (error) {
      // Error is already handled by the mutation's onError
      console.error("Dismiss operation failed:", error);
    }
  }, [dismissMutation, userEmail, formId]);

  // Check if any mutation is pending
  const isAnyMutationPending =
    terminateAndLoginMutation.isPending || dismissMutation.isPending;

  // Memoized Success Component to prevent unnecessary re-renders
  const SuccessScreen = memo(() => (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="shadow-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-4 bg-success/10 rounded-full">
            <FiCheckCircle size={48} className="text-success" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Session Replaced Successfully!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Redirecting you to the dashboard...
          </p>
          <Spinner size="sm" color="success" />
        </div>
      </Card>
    </div>
  ));

  SuccessScreen.displayName = "SuccessScreen";

  // Memoized Background Animation Component
  const AnimatedBackground = memo(() => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
    </div>
  ));

  AnimatedBackground.displayName = "AnimatedBackground";

  // Success state after session replacement
  if (sessionReplaced) {
    return <SuccessScreen />;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />

      <div
        className={`w-full max-w-md mx-auto transform transition-all duration-700 ease-out ${
          isVisible
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-8 opacity-0 scale-95"
        }`}
      >
        <Card
          className="shadow-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md relative overflow-hidden"
          radius="lg"
        >
          {/* Top accent border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning to-danger"></div>

          <CardHeader className="flex flex-col gap-4 text-center pb-6 pt-8 px-8">
            <div className="flex justify-center">
              <div className="relative">
                <div className="p-5 bg-gradient-to-br from-warning/10 to-danger/10 rounded-full border-2 border-warning/20">
                  <FiAlertTriangle
                    size={52}
                    className="text-warning drop-shadow-sm animate-pulse"
                    aria-hidden="true"
                  />
                </div>
                <div className="absolute -top-1 -right-1">
                  <div className="w-4 h-4 bg-danger rounded-full animate-ping"></div>
                  <div className="absolute inset-0 w-4 h-4 bg-danger rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                Duplicate Session Detected
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
                We've detected that you have another active session. For
                security reasons, only one session is allowed at a time.
              </p>
              <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
                  <strong>Note:</strong> Dismissing will disable auto-login for
                  this form to prevent future conflicts.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardBody className="px-8 pb-8">
            <div className="flex flex-col gap-4">
              <Button
                className="font-semibold text-white bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                type="button"
                size="lg"
                startContent={
                  terminateAndLoginMutation.isPending ? (
                    <Spinner size="sm" color="current" />
                  ) : (
                    <FiLogIn size={18} />
                  )
                }
                onPress={handleTerminateAndLogin}
                radius="lg"
                isDisabled={isAnyMutationPending}
                isLoading={terminateAndLoginMutation.isPending}
              >
                {terminateAndLoginMutation.isPending
                  ? "Processing..."
                  : "Terminate and Login"}
              </Button>

              <Button
                className="font-semibold bg-transparent text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                type="button"
                size="lg"
                variant="bordered"
                startContent={
                  dismissMutation.isPending ? (
                    <Spinner size="sm" color="current" />
                  ) : (
                    <FiX size={18} />
                  )
                }
                onPress={handleDismiss}
                isLoading={dismissMutation.isPending}
                radius="lg"
                isDisabled={isAnyMutationPending}
              >
                {dismissMutation.isPending
                  ? "Dismissing..."
                  : "Dismiss & Skip Auto-Login"}
              </Button>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-indigo-400/5 animate-pulse"></div>
              <div className="relative flex gap-3">
                <FiShield
                  size={16}
                  className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
                />
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    <strong className="font-semibold">Security Options:</strong>
                    <br />• <strong>Terminate:</strong> End other session and
                    log into this device
                    <br />• <strong>Dismiss:</strong> Keep other session active
                    and disable auto-login for this form
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default memo(ReplaceSessionPage);
