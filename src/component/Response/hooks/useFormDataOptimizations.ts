import { useMemo } from "react";
import { accessModeType } from "./usePaginatedFormData";
import { RespondentSessionType } from "../Response.type";
import { SessionState } from "../../../redux/user.store";

/**
 * Optimized hook for managing query parameters
 * Reduces object creation and improves memoization
 */
export const useOptimizedQueryParams = ({
  formId,
  currentPage,
  fetchType,
  formsession,
  user,
}: {
  formId?: string;
  currentPage: number;
  fetchType: string;
  formsession?: RespondentSessionType;
  user?: SessionState;
}) => {
  // Memoize session-related parameters separately to reduce dependencies
  const sessionParams = useMemo(() => {
    const params: Record<string, string> = {};

    if (formsession?.isSwitchedUser || user?.isAuthenticated) {
      params.isSwitched = String(formsession?.isSwitchedUser ?? false);
    }

    return params;
  }, [formsession?.isSwitchedUser, user?.isAuthenticated]);

  // Memoize base parameters
  const baseParams = useMemo(
    () => ({
      p: currentPage.toString(),
      ty: fetchType,
    }),
    [currentPage, fetchType]
  );

  // Combine parameters efficiently
  const queryParams = useMemo(
    () => ({
      formId,
      page: currentPage,
      ty: fetchType,
      formsession,
      user,
    }),
    [formId, currentPage, fetchType, formsession, user]
  );

  // Generate optimized query key
  const queryKey = useMemo(
    () => [
      "respondent-form",
      formId,
      currentPage,
      fetchType,
      ...(formsession?.isSwitchedUser
        ? ["switched", formsession.isSwitchedUser]
        : []),
      ...(user?.isAuthenticated ? ["auth", user.isAuthenticated] : []),
    ],
    [
      formId,
      currentPage,
      fetchType,
      formsession?.isSwitchedUser,
      user?.isAuthenticated,
    ]
  );

  return {
    queryParams,
    queryKey,
    sessionParams,
    baseParams,
  };
};

/**
 * Hook for optimized navigation state management
 * Combines related state to reduce re-renders
 */
export const useNavigationState = (currentPage: number, totalPages: number) => {
  return useMemo(
    () => ({
      canGoNext: currentPage < totalPages,
      canGoPrev: currentPage > 1,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages,
      progressPercentage: totalPages > 0 ? (currentPage / totalPages) * 100 : 0,
    }),
    [currentPage, totalPages]
  );
};

/**
 * Hook for optimized access mode management
 * Reduces unnecessary re-renders during mode transitions
 */
export const useAccessModeOptimization = (accessMode: accessModeType) => {
  const modeState = useMemo(
    () => ({
      isAuthenticated: accessMode === "authenticated",
      isGuest: accessMode === "guest",
      isLogin: accessMode === "login",
      isError: accessMode === "error",
      needsAuth: accessMode === "login" || accessMode === "error",
      hasAccess: accessMode === "authenticated" || accessMode === "guest",
    }),
    [accessMode]
  );

  return modeState;
};
