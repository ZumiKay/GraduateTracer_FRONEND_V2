import { useEffect } from "react";
import { useSessionVerification } from "./useFormsessionAPI";

// 🎯 Custom hook for automatic session verification
export const useAutoSessionCheck = (formId?: string) => {
  const {
    data: sessionData,
    error,
    refetch,
  } = useSessionVerification(
    { isActive: true },
    !!formId // Only enable when formId is provided
  );

  // ⚠️ Auto redirect if session is invalid
  useEffect(() => {
    if (error && formId) {
      console.warn("⚠️ Session verification failed, redirecting to login...");
      // window.location.href = `/login?formId=${formId}`;
    }
  }, [error, formId]);

  // 🔄 Auto refresh session if expiring
  useEffect(() => {
    if (sessionData?.data?.isExpired) {
      console.log("⚠️ Session expiring, refreshing...");
      setTimeout(() => refetch(), 1000);
    }
  }, [sessionData, refetch]);

  return {
    isSessionValid: !!sessionData && !error,
    isExpiring: sessionData?.data?.isExpired,
    sessionData,
    error,
    refetch,
  };
};

export default useAutoSessionCheck;
