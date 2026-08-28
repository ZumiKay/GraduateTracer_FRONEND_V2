import { useQuery, useQueryClient } from "@tanstack/react-query";
import ApiRequest from "./APIHook/ApiHook";
import { ROLE } from "../types/User.types";
import { isSessionTokenValid } from "./useAccessTokenValidator";
import { useEffect } from "react";

export interface UserSessionData {
  _id: string;
  name: string;
  email: string;
  role: ROLE;
  expiresAt?: string;
}

export interface UserSessionResponse {
  user: UserSessionData | null;
  isAuthenticated: boolean;
  expiresAt?: string;
}

/**
 * Main User Session Hook
 * Features:
 * - Client-side token expiry validation before server check
 * - Reduced server load by removing redundant refetchOnWindowFocus
 * - Listens for app:session-expired events to handle server-side session eviction
 */
export const useUserSession = (options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleSessionExpired = () => {
      queryClient.setQueryData(["userSession"], {
        user: null,
        isAuthenticated: false,
      });
      queryClient.invalidateQueries({ queryKey: ["userSession"] });
    };

    window.addEventListener("app:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("app:session-expired", handleSessionExpired);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["userSession"],
    queryFn: async (): Promise<UserSessionResponse> => {
      // Check cached query data first to see if session is still valid locally
      const cached = queryClient.getQueryData<UserSessionResponse>(["userSession"]);
      if (cached?.isAuthenticated && cached.expiresAt) {
        if (isSessionTokenValid(cached.expiresAt)) {
          return cached;
        }
      }

      try {
        const response = await ApiRequest({
          method: "GET",
          cookie: true,
          url: "/checksession",
          reactQuery: true,
        });

        if (!response.success) {
          return {
            user: null,
            isAuthenticated: false,
          };
        }

        const sessionData = response.data as UserSessionResponse;

        return {
          user: sessionData?.user ?? null,
          isAuthenticated: sessionData?.isAuthenticated ?? false,
          expiresAt: sessionData?.expiresAt,
        };
      } catch (error) {
        console.error("Session check failed:", error);
        return {
          user: null,
          isAuthenticated: false,
        };
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes stale time
    retry: false,
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: false, // Cut down unnecessary server requests on tab switch
    refetchOnReconnect: true,
    refetchInterval: false,
  });
};

export default useUserSession;
