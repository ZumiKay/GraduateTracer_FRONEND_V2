import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import ApiRequest, { ApiRequestReturnType } from "./ApiHook";
import queryClient from "./ReactQueryClient";

// Type definitions for formsession API requests
export interface RespondentLoginProps extends Record<string, unknown> {
  formId: string;
  email: string;
  rememberMe: boolean;
  name?: string;
  password?: string;
  isGuest?: boolean;
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

export interface SessionVerificationResponse extends FormsessionResponse {
  data?: {
    isExpired?: boolean;
    sessionId?: string;
  };
}

export const useFormsessionAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiResponse = useCallback((response: ApiRequestReturnType) => {
    if (!response.success) {
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

      try {
        const response = await ApiRequest({
          method: "POST",
          url: "/response/respodnentlogin",
          data: props,
          cookie: true,
        });

        return handleApiResponse(response) as FormsessionResponse;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      //Make sure all data up to date
      queryClient.invalidateQueries({ queryKey: ["sessionVerification"] });
      queryClient.invalidateQueries({ queryKey: ["formsession"] });
    },
    onError: (error: Error) => {
      console.error("❌ Respondent login failed:", error);
      setError(error.message);
    },
  });

  const userRespondentLogin = useMutation({
    mutationKey: ["userRespondentLogin"],
    mutationFn: async (
      props: UserRespondentLoginProps
    ): Promise<FormsessionResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await ApiRequest({
          method: "POST",
          url: "/response/userrespondentlogin",
          data: props,
          cookie: true,
        });

        return handleApiResponse(response) as FormsessionResponse;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessionVerification"] });
    },
    onError: (error: Error) => {
      console.error("User respondent login (public) failed:", error);
      setError(error.message);
    },
  });

  const useSessionVerification = (
    params?: SessionVerificationParams,
    enabled: boolean = false
  ) => {
    return useQuery({
      queryKey: ["sessionVerification", params],
      queryFn: async (): Promise<SessionVerificationResponse> => {
        const queryParams = params ? `?isActive=${params.isActive}` : "";

        const response = await ApiRequest({
          method: "GET",
          url: `/response/verifyformsession${queryParams}`,
          cookie: true,
        });

        return handleApiResponse(response) as SessionVerificationResponse;
      },
      enabled,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 10 * 60 * 1000, // Auto-refetch every 10 minutes
      refetchOnWindowFocus: true,
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
      userRespondentLogin.isPending ||
      replaceSession.isPending ||
      signOut.isPending ||
      sendRemovalEmail.isPending
    );
  }, [
    isLoading,
    respondentLogin.isPending,
    userRespondentLogin,
    replaceSession.isPending,
    signOut.isPending,
    sendRemovalEmail.isPending,
  ]);

  return {
    respondentLogin,
    userRespondentLogin,
    replaceSession,
    signOut,
    sendRemovalEmail,

    useSessionVerification,

    refreshSession,
    clearSessionData,
    clearError,
    isAnyLoading,

    isLoading,
    error,

    // Quick access
    isLoginLoading: respondentLogin.isPending || userRespondentLogin.isPending,
    isSessionLoading: replaceSession.isPending || signOut.isPending,
    isEmailLoading: sendRemovalEmail.isPending,

    loginSuccess: respondentLogin.isSuccess || userRespondentLogin.isSuccess,
    sessionSuccess: replaceSession.isSuccess || signOut.isSuccess,
    emailSuccess: sendRemovalEmail.isSuccess,

    loginError: respondentLogin.error || userRespondentLogin.error,

    sessionError: replaceSession.error || signOut.error,
    emailError: sendRemovalEmail.error,
  };
};

export const useSessionVerification = (
  params?: SessionVerificationParams,
  enabled?: boolean
) => {
  const { useSessionVerification } = useFormsessionAPI();
  return useSessionVerification(params, enabled);
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
