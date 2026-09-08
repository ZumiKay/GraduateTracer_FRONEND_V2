import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import ApiRequest, { ApiError, ApiRequestReturnType } from "./APIHook/ApiHook";
import queryClient from "./ReactQueryClient";

let isSwitchingUser = false;

export const setUserSwitching = (value: boolean) => {
  isSwitchingUser = value;
};

export const isUserSwitching = () => isSwitchingUser;

// Type definitions for formsession API requests
export interface RespondentLoginProps extends Record<string, unknown> {
  formId: string;
  email?: string;
  rememberMe?: boolean;
  name?: string;
  password?: string;
  isGuest?: boolean;
  existed?: string;
}

export interface UserRespondentLoginProps extends Record<string, unknown> {
  formId: string;
  rememberMe: boolean;
  isSwitched?: boolean;
  email?: string;
  password?: string;
}

export interface SendRemovalEmailProps extends Record<string, unknown> {
  respondentEmail: string;
  removeCode: string;
  formId?: string;
}

export interface SessionVerificationParams {
  isActive?: boolean;
}

export interface ReplaceSessionParams {
  code: string;
  isSkipLogin?: boolean;
}

export interface FormsessionResponse {
  success: boolean;
  status: number;
  message?: string;
  data?: unknown;
}

export interface SessionVerificationResponse extends ApiRequestReturnType {
  data?: {
    respondentEmail: string;
    respondentName: string;
    isGuest?: boolean;
    isNormalForm?: boolean;
    expiresAt?: string | Date;
  };
}

export const useFormsessionAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError>();

  const respondentLogin = useMutation({
    mutationKey: ["respondentLogin"],
    mutationFn: (props: RespondentLoginProps) => {
      return ApiRequest({
        method: "POST",
        url: "/response/respondentlogin",
        data: props,
        cookie: true,
        reactQuery: true,
      });
    },
    onError: setError,
  });

  const useSessionVerification = (
    formId?: string,
    handleSessionExpired?: () => void,
  ) => {
    return useMutation({
      mutationKey: ["SessionVerification", formId],
      mutationFn() {
        if (!formId) {
          throw new Error("Invalid FormId");
        }
        setError(undefined);
        return ApiRequest({
          method: "GET",
          url: `/response/verifyformsession/${formId}`,
          cookie: true,
          reactQuery: true,
        });
      },
      onSuccess() {
        queryClient.invalidateQueries({ queryKey: ["SessionVerification"] });
      },
      onError: (error) => {
        //Show session renewal modal
        const err = error as ApiError;

        if (handleSessionExpired && err.status === 401) handleSessionExpired();

        setError(error);
      },
    });
  };

  const replaceSession = useMutation({
    mutationKey: ["replaceSession"],
    mutationFn(params: ReplaceSessionParams) {
      setError(undefined);
      return ApiRequest({
        method: "PATCH",
        url: `/response/sessionremoval/${params.code}${params.isSkipLogin ? "?skiplogin=1" : ""}`,
        cookie: true,
        reactQuery: true,
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["SessionVerification"] });
    },
  });

  const signOut = useMutation({
    mutationKey: ["signOut"],
    mutationFn(formId: string) {
      setError(undefined);

      return ApiRequest({
        method: "DELETE",
        url: "/response/sessionlogout/" + formId,
        cookie: true,
        reactQuery: true,
        skipRefresh: true,
      });
    },
  });

  const sendRemovalEmail = useMutation({
    mutationKey: ["sendRemovalEmail"],
    mutationFn(props: SendRemovalEmailProps) {
      setError(undefined);

      return ApiRequest({
        method: "POST",
        url: "/response/send-removal-email", // Assuming this endpoint exists
        data: props,
        reactQuery: true,
      });
    },
    onError: setError,
  });

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: ["SessionVerification"],
      });
      await queryClient.refetchQueries({ queryKey: ["SessionVerification"] });
    } catch (error) {
      console.error("Session refresh failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSessionData = useCallback(() => {
    queryClient.removeQueries({ queryKey: ["SessionVerification"] });
    queryClient.removeQueries({ queryKey: ["formsession"] });
  }, []);

  const clearError = useCallback(() => setError(undefined), []);

  return {
    respondentLogin,
    replaceSession,
    signOut,
    sendRemovalEmail,
    useSessionVerification,
    refreshSession,
    clearSessionData,
    clearError,
    isLoading,
    error,
  };
};

export default useFormsessionAPI;
