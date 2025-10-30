import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import ApiRequest, { ApiRequestReturnType } from "./ApiHook";
import queryClient from "./ReactQueryClient";
import { ErrorToast } from "../component/Modal/AlertModal";

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
  };
}

export const useFormsessionAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiResponse = useCallback((response: ApiRequestReturnType) => {
    if (!response.success) {
      if (response.status === 401) {
        return { ...response, session: { isExpired: true } };
      }
      const errorMessage =
        response.error || response.message || "An error occurred";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
    setError(null);
    return response;
  }, []);

  const respondentLogin = useMutation({
    mutationKey: ["respondentLogin"],
    mutationFn: async (
      props: RespondentLoginProps
    ): Promise<FormsessionResponse> => {
      setIsLoading(true);
      setError(null);

      const response = await ApiRequest({
        method: "POST",
        url: "/response/respondentlogin",
        data: props,
        cookie: true,
      });
      setIsLoading(false);

      return handleApiResponse(response) as FormsessionResponse;
    },
    onSuccess: () => {
      //Make sure all data up to date
      queryClient.invalidateQueries({ queryKey: ["sessionVerification"] });
      queryClient.invalidateQueries({ queryKey: ["formsession"] });
    },
    onError: (error: Error) => {
      console.log("Respondent Login", error);
      ErrorToast({ title: "Failed", content: error.message });
      setError(error.message);
    },
  });

  const useSessionVerification = (
    enabled: boolean = false,
    formId: string = ""
  ) => {
    return useQuery({
      queryKey: ["sessionVerification"],
      queryFn: async () => {
        if (!formId) {
          throw Error("No form found");
        }

        const response = await ApiRequest({
          method: "GET",
          url: `/response/verifyformsession/${formId}`,
          cookie: true,
        });

        return handleApiResponse(response) as SessionVerificationResponse;
      },
      enabled,
      retry: false, // Disable retry to prevent multiple failed requests
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: false, // Disable automatic refetching
      refetchOnWindowFocus: false, // Disable refetch on window focus
      refetchOnReconnect: false, // Disable refetch on network reconnect
    });
  };

  const useManuallySessionVeriftication = (formId?: string) => {
    return useMutation({
      mutationKey: ["manualSessionVerification", formId],
      mutationFn: async () => {
        if (!formId) {
          throw new Error("Invalid FormId");
        }

        const response = await ApiRequest({
          method: "GET",
          url: `/response/verifyformsession/${formId}`,
          cookie: true,
        });

        return handleApiResponse(response);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["sessionVerification"] });
      },
      onError: (error: Error) => {
        console.error("❌ Manual session verification failed:", error);
        ErrorToast({
          toastid: "Manually check session",
          title: "Verification Failed",
          content: error.message,
        });
        setError(error.message);
      },
    });
  };

  const replaceSession = useMutation({
    mutationKey: ["replaceSession"],
    mutationFn: async (
      params: ReplaceSessionParams
    ): Promise<FormsessionResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await ApiRequest({
          method: "PATCH",
          url: `/response/sessionremoval/${params.code}`,
          cookie: true,
        });

        return handleApiResponse(response) as FormsessionResponse;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessionVerification"] });
      queryClient.invalidateQueries({ queryKey: ["formsession"] });
      queryClient.removeQueries({ queryKey: ["sessionVerification"] });
    },
    onError: (error: Error) => {
      console.error("❌ Session replacement failed:", error);
      setError(error.message);
    },
  });

  const signOut = useMutation({
    mutationKey: ["signOut"],
    mutationFn: async (formId: string): Promise<FormsessionResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await ApiRequest({
          method: "DELETE",
          url: "/response/sessionlogout/" + formId,
          cookie: true,
        });

        return handleApiResponse(response) as FormsessionResponse;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.clear();
      localStorage.removeItem("formsession");
      localStorage.removeItem("accessToken");
    },
    onError: (error: Error) => {
      console.error("❌ Sign out failed:", error);
      setError(error.message);
    },
  });

  const sendRemovalEmail = useMutation({
    mutationKey: ["sendRemovalEmail"],
    mutationFn: async (
      props: SendRemovalEmailProps
    ): Promise<FormsessionResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await ApiRequest({
          method: "POST",
          url: "/response/send-removal-email", // Assuming this endpoint exists
          data: props,
        });

        return handleApiResponse(response) as FormsessionResponse;
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error: Error) => {
      console.error("❌ Send removal email failed:", error);
      setError(error.message);
    },
  });

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: ["sessionVerification"],
      });
      await queryClient.refetchQueries({ queryKey: ["sessionVerification"] });
    } catch (error) {
      console.error("❌ Session refresh failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSessionData = useCallback(() => {
    queryClient.removeQueries({ queryKey: ["sessionVerification"] });
    queryClient.removeQueries({ queryKey: ["formsession"] });
    localStorage.removeItem("formsession");
  }, []);

  // 🔧 Utility functions
  const clearError = useCallback(() => setError(null), []);

  const isAnyLoading = useCallback(() => {
    return (
      isLoading ||
      respondentLogin.isPending ||
      replaceSession.isPending ||
      signOut.isPending ||
      sendRemovalEmail.isPending
    );
  }, [
    isLoading,
    respondentLogin.isPending,
    replaceSession.isPending,
    signOut.isPending,
    sendRemovalEmail.isPending,
  ]);

  return {
    respondentLogin,
    replaceSession,
    signOut,
    sendRemovalEmail,
    useSessionVerification,
    useManuallySessionVeriftication,
    refreshSession,
    clearSessionData,
    clearError,
    isAnyLoading,
    isLoading,
    error,

    // Quick access
    isLoginLoading: respondentLogin.isPending,
    isSessionLoading: replaceSession.isPending,
    isEmailLoading: sendRemovalEmail.isPending,

    loginSuccess: respondentLogin.isSuccess,
    sessionSuccess: replaceSession.isSuccess,
    emailSuccess: sendRemovalEmail.isSuccess,

    loginError: respondentLogin.error,

    sessionError: replaceSession.error || signOut.error,
    emailError: sendRemovalEmail.error,
  };
};

export const useSessionActions = () => {
  const {
    replaceSession,
    signOut,
    isSessionLoading,
    sessionSuccess,
    sessionError,
  } = useFormsessionAPI();

  return {
    replace: replaceSession.mutate,
    replaceAsync: replaceSession.mutateAsync,
    signOut: signOut.mutate,
    signOutAsync: signOut.mutateAsync,
    isLoading: isSessionLoading,
    isSuccess: sessionSuccess,
    error: sessionError,
    resetReplace: replaceSession.reset,
    resetSignOut: signOut.reset,
  };
};

export default useFormsessionAPI;
