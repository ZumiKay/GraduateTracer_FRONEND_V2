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
import SuccessToast, { ErrorToast } from "../component/Modal/AlertModal";
import useFormsessionAPI from "../hooks/useFormsessionAPI";
import ApiRequest, { ApiRequestReturnType } from "../hooks/APIHook/ApiHook";
import { useQuery } from "@tanstack/react-query";

interface ReplaceSessionPageParamsType {
  code: string;
  formId: string;
}

const ReplaceSessionPage = () => {
  const { code, formId } =
    useParams() as unknown as ReplaceSessionPageParamsType;
  const { replaceSession, error } = useFormsessionAPI();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [sessionReplaced, setSessionReplaced] = useState(false);

  const {
    isLoading: isVerify,
    isError: isVerifyError,
    isSuccess: isVerified,
  } = useQuery({
    queryKey: ["SessionRemoval", code],
    queryFn: () => {
      return ApiRequest({
        method: "PATCH",
        url: `/response/sessionremoval/${code}?verify=1`,
        reactQuery: true,
      });
    },
    networkMode: "always",
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: false,
  });

  useEffect(() => {
    if (!isVerify && isVerifyError) {
      navigate("/notfound", { replace: true });
    }
  }, [isVerify, isVerifyError, navigate]);

  const { decodedCode, decodedFormId } = useMemo(
    () => ({
      decodedCode: decodeURIComponent(code),
      decodedFormId: decodeURIComponent(formId),
    }),
    [code, formId],
  );

  const { formAccessURL, notFoundURL } = useMemo(
    () => ({
      formAccessURL: `/form-access/${decodedFormId}`,
      notFoundURL: "/notfound",
    }),
    [decodedFormId],
  );

  const handleNavigate = useCallback(
    (accessUrl: string, delay = 2000) => {
      setTimeout(() => {
        navigate(accessUrl, { replace: true });
      }, delay);
    },
    [navigate],
  );

  const handleReplaceOrDismiss = useCallback(
    (isSkipLogin: boolean) => {
      const replaceSessionOpt: typeof replaceSession.variables = {
        code: decodedCode,
        isSkipLogin,
      };

      replaceSession.mutate(replaceSessionOpt, {
        onSuccess(res) {
          console.log({ res });
          setSessionReplaced(true);
          SuccessToast({
            toastid: "SuccessReplace",
            title: "Success",
            content: (res?.data as ApiRequestReturnType)?.message ?? "",
          });
          handleNavigate(formAccessURL, 2000);
        },

        onError() {
          const toastid = "uniqueToastId";
          if (error?.status === 500) {
            ErrorToast({
              toastid,
              title: "Error",
              content: "Error replacing session",
            });

            return;
          }
          if (error?.status === 404) {
            ErrorToast({ toastid, title: "Invalid", content: "" });
            return;
          }
        },
      });
    },
    [decodedCode, error?.status, formAccessURL, handleNavigate, replaceSession],
  );

  useEffect(() => {
    if (!code || !formId) {
      navigate(notFoundURL, { replace: true });
      return;
    }

    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [code, formId, navigate, notFoundURL]);

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

          <Spinner size="sm" color="success" />
        </div>
      </Card>
    </div>
  ));

  SuccessScreen.displayName = "SuccessScreen";

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

  // Block render until code is verified
  if (isVerify || !isVerified) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" color="primary" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Verifying...
          </p>
        </div>
      </div>
    );
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
                  replaceSession.isPending ? (
                    <Spinner size="sm" color="current" />
                  ) : (
                    <FiLogIn size={18} />
                  )
                }
                onPress={() => handleReplaceOrDismiss(false)}
                radius="lg"
                isDisabled={replaceSession.isPending}
                isLoading={replaceSession.isPending}
              >
                {replaceSession.isPending
                  ? "Processing..."
                  : "Terminate and Login"}
              </Button>

              <Button
                className="font-semibold bg-transparent text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                type="button"
                size="lg"
                variant="bordered"
                startContent={
                  replaceSession.isPending ? (
                    <Spinner size="sm" color="current" />
                  ) : (
                    <FiX size={18} />
                  )
                }
                onPress={() => handleReplaceOrDismiss(true)}
                isLoading={replaceSession.isPending}
                radius="lg"
                isDisabled={replaceSession.isPending}
              >
                {replaceSession.isPending
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
