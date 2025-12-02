import { useQuery } from "@tanstack/react-query";
import ApiRequest from "./ApiHook";
import { ROLE } from "../types/User.types";

export interface UserSessionData {
  _id: string;
  name: string;
  email: string;
  role: ROLE;
}

export interface UserSessionResponse {
  user: UserSessionData | null;
  isAuthenticated: boolean;
}

/**
 * Features:
 * - Automatic caching with 5 minute stale time
 * - Refetch on window focus to keep session fresh
 */
export const useUserSession = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["userSession"],
    queryFn: async (): Promise<UserSessionResponse> => {
      try {
        const response = await ApiRequest({
          method: "GET",
          cookie: true,
          url: "/checksession",
          reactQuery: true,
        });

        if (!response.success) {
          // Return unauthenticated state instead of throwing
          return {
            user: null,
            isAuthenticated: false,
          };
        }

        const sessionData = response.data as UserSessionResponse;

        return {
          user: sessionData?.user ?? null,
          isAuthenticated: sessionData?.isAuthenticated ?? false,
        };
      } catch (error) {
        console.error("Session check failed:", error);
        return {
          user: null,
          isAuthenticated: false,
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - same as useSessionVerification
    retry: 1,
    enabled: options?.enabled ?? true, // Use the passed enabled option or default to true
    refetchOnWindowFocus: true, // Recheck when user returns to tab
    refetchOnReconnect: true, // Recheck on network reconnect
    refetchInterval: false,
  });
};

export default useUserSession;
