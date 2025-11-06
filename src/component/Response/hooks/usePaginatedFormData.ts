import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { FormDataType } from "../../../types/Form.types";
import { useQuery } from "@tanstack/react-query";
import ApiRequest, { ApiRequestReturnType } from "../../../hooks/ApiHook";
import { useNavigate } from "react-router";
import {
  RespondentInfoType,
  RespondentSessionType,
  SaveProgressType,
  SubmittionProcessionReturnType,
} from "../Response.type";
import { SessionVerificationResponse } from "../../../hooks/useFormsessionAPI";
import { SessionState } from "../../../redux/user.store";
import { generateStorageKey } from "../../../helperFunc";
import { ErrorToast } from "../../Modal/AlertModal";

export type accessModeType = "login" | "guest" | "authenticated" | "error";
type fetchtype = "data" | "initial";
export interface GetFormStateResponseType extends FormDataType {
  isResponsed?: SubmittionProcessionReturnType;
  message?: string;
  //For test unique of response for public form
  fingerprintStrength?: number;
}

export type UseRespondentFormPaginationReturn = {
  isLoading: boolean;
  handlePage: (direction: "prev" | "next") => void;
  formState: GetFormStateResponseType | undefined;
  currentPage: number | null;
  goToPage: (page: number) => void;
  canGoNext: boolean | undefined;
  canGoPrev: boolean | undefined;
  error: Error | null;
  totalPages: number;
  showInactiveAlert?: boolean;
  // Additional debugging states
  isFetching?: boolean;
  isPending?: boolean;
};

type useRespondentFormPaginationProps = {
  formId?: string;
  initialVerify?: boolean;
  //Response Info for verify initital form state
  respondentInfo?: RespondentInfoType;
  formsessioncheck?: SessionVerificationResponse;
  user?: SessionState;
  //Helper Type
  formsession?: RespondentSessionType;
  accessMode: accessModeType;
  enabled?: boolean;
};

interface FetchContentReturnType extends ApiRequestReturnType {
  isAuthenicated?: boolean;
}

const useRespondentFormPaginaition = ({
  formId,
  user,
  formsession,
  accessMode,
  enabled = false,
}: useRespondentFormPaginationProps): UseRespondentFormPaginationReturn => {
  const navigate = useNavigate();
  const [currentPage, setcurrentPage] = useState<number | null>(null);
  const [fetchType, setfetchType] = useState<fetchtype>("initial");
  const [localformsession, setlocalformsession] =
    useState<RespondentSessionType>();
  const accessModeRef = useRef(accessMode);
  accessModeRef.current = accessMode;

  // Memoize storage key to avoid recalculation
  const storageKey = useMemo(
    () =>
      formId && formsession?.respondentinfo?.respondentEmail
        ? generateStorageKey({
            suffix: "progress",
            formId,
            userKey: formsession.respondentinfo.respondentEmail,
          })
        : null,
    [formId, formsession?.respondentinfo?.respondentEmail]
  );

  // Memoize localStorage retrieval
  const savedPageData = useMemo(() => {
    if (!storageKey) return null;
    try {
      const storedData = localStorage.getItem(storageKey);
      return storedData ? (JSON.parse(storedData) as SaveProgressType) : null;
    } catch (error) {
      console.error("Failed to parse saved page data:", error);
      return null;
    }
  }, [storageKey]);

  //Page Inititalize
  useEffect(() => {
    if (savedPageData?.currentPage) {
      setcurrentPage(savedPageData.currentPage);
    } else {
      setcurrentPage(1);
    }
  }, [savedPageData]);

  // Debounce formsession updates to prevent rapid changes
  const stableFormsession = useMemo(() => {
    if (
      formsession &&
      JSON.stringify(formsession) !== JSON.stringify(localformsession)
    ) {
      return formsession;
    }
    return localformsession;
  }, [formsession, localformsession]);

  useEffect(() => {
    if (stableFormsession && stableFormsession !== localformsession) {
      // Add a small delay to prevent rapid updates
      const timer = setTimeout(() => {
        setlocalformsession(stableFormsession);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [stableFormsession, localformsession]);

  const fetchContent = useCallback(
    async ({
      page,
      ty,
      formId,
    }: {
      page: number | null;
      ty: fetchtype;
      formId?: string;
    }): Promise<FetchContentReturnType | null> => {
      // Validate required parameters early
      if (!formId) {
        return Promise.reject(new Error("FormId is missing"));
      }

      if (!page || page < 1) {
        return Promise.reject(new Error("Invalid page number"));
      }

      // Build URL with query parameters
      const params = new URLSearchParams({
        p: page.toString(),
        ty,
      });

      try {
        const getData = await ApiRequest({
          url: `/response/form/${formId}?${params}`,
          method: "GET",
          cookie: true,
          reactQuery: true,
        });

        if (!getData.success) {
          if (getData.status === 401) {
            ErrorToast({ title: "Session", content: "Unauthenticated" });
            console.log("Unauthenticated - user session expired");
            return { ...getData, isAuthenicated: false };
          }

          // Log error details for debugging
          console.error("Fetch content error:", {
            status: getData.status,
            formId,
            page,
            ty,
          });
          return Promise.reject(
            new Error(`Failed to fetch form data: ${getData.status}`)
          );
        }

        return getData;
      } catch (error) {
        console.error("Network error during fetch:", error);
        return Promise.reject(error);
      }
    },
    []
  );

  const stableQueryParams = useMemo(
    () => ({
      formId,
      page: currentPage,
      ty: fetchType,
      user,
      formsession: localformsession,
    }),
    [formId, currentPage, fetchType, user, localformsession]
  );

  const queryFn = useCallback(
    () => fetchContent(stableQueryParams),
    [fetchContent, stableQueryParams]
  );

  const stableQueryKey = useMemo(() => {
    // Only include parameters that affect the query result
    return ["respondent-form", formId, currentPage, fetchType];
  }, [formId, currentPage, fetchType]);

  const { data, error, isFetching } = useQuery({
    queryKey: stableQueryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes - better caching
    gcTime: 10 * 60 * 1000, // 10 minutes - retain cached data longer
    enabled: Boolean(enabled && formId && currentPage && currentPage >= 1),
    retry: (failureCount, error: Error) => {
      // Retry on network errors, but not on 401 (auth errors)
      const status = (error as unknown as { status?: number }).status;
      if (status === 401) return false;
      return failureCount < 2; // Max 2 retries
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount if data is fresh
    refetchInterval: false, // Disable automatic refetching
    refetchOnReconnect: false, // Don't refetch when network reconnects
    refetchIntervalInBackground: false, // Don't refetch in background
    // Add network mode to prevent loading on every network change
    networkMode: "online",
  });

  const formState = useMemo(() => {
    return data?.data as GetFormStateResponseType | undefined;
  }, [data]);

  // Log errors for debugging when query fails
  useEffect(() => {
    if (error) {
      console.error("Form pagination query failed:", {
        error: error.message,
        formId,
        currentPage,
        fetchType,
        accessMode,
        timestamp: new Date().toISOString(),
      });
    }
  }, [error, formId, currentPage, fetchType, accessMode]);

  useEffect(() => {
    if (
      (accessMode === "authenticated" || accessMode === "guest") &&
      !formState?.isLoggedIn
    ) {
      setfetchType("data");
    }
  }, [accessMode, formState]);

  useEffect(() => {
    if (!formId) {
      navigate("/notfound");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  const totalPages = useMemo(
    () => formState?.totalpage ?? 1,
    [formState?.totalpage]
  );

  const handlePage = useCallback(
    (direction: "prev" | "next") => {
      setcurrentPage((prevPage) => {
        if (!prevPage || prevPage < 1) return prevPage;

        if (direction === "prev") {
          return prevPage > 1 ? prevPage - 1 : prevPage;
        } else {
          return prevPage < totalPages ? prevPage + 1 : prevPage;
        }
      });
    },
    [totalPages]
  );

  const goToPage = useCallback(
    (page: number) => {
      // Validate page bounds before setting
      if (page >= 1 && page <= totalPages) {
        setcurrentPage(page);
      } else {
        console.warn(
          `Invalid page number: ${page}. Valid range: 1-${totalPages}`
        );
      }
    },
    [totalPages]
  );

  const navigationState = useMemo(
    () => ({
      canGoNext: currentPage ? currentPage < totalPages : undefined,
      canGoPrev: currentPage ? currentPage > 1 : undefined,
    }),
    [currentPage, totalPages]
  );

  return useMemo(
    () => ({
      isLoading: isFetching,
      handlePage,
      formState,
      currentPage,
      goToPage,
      canGoNext: navigationState.canGoNext,
      canGoPrev: navigationState.canGoPrev,
      error,
      totalPages,
      // Additional states for debugging and loading management
      isFetching,
      isPending: isFetching, // Alias for isPending
    }),
    [
      isFetching,
      handlePage,
      formState,
      currentPage,
      goToPage,
      navigationState.canGoNext,
      navigationState.canGoPrev,
      error,
      totalPages,
    ]
  );
};

export default useRespondentFormPaginaition;
