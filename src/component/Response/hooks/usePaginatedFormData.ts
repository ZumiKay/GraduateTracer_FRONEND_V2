import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { FormDataType } from "../../../types/Form.types";
import { useQuery } from "@tanstack/react-query";
import ApiRequest, { ApiRequestReturnType } from "../../../hooks/ApiHook";
import { useNavigate } from "react-router";
import { RespondentInfoType, RespondentSessionType } from "../Response.type";
import { SessionVerificationResponse } from "../../../hooks/useFormsessionAPI";
import { SessionState } from "../../../redux/user.store";

export type accessModeType = "login" | "guest" | "authenticated" | "error";
type fetchtype = "data" | "initial";

export type UseRespondentFormPaginationReturn = {
  isLoading: boolean;
  handlePage: (direction: "prev" | "next") => void;
  formState: FormDataType | undefined;
  currentPage: number | undefined;
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

export interface GetFormStateResponseType extends FormDataType {
  isResponse?: boolean;
  message?: string;
  //For test unique of response for public form
  fingerprintStrength?: number;
}

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
  const [currentPage, setcurrentPage] = useState(1);
  const [fetchType, setfetchType] = useState<fetchtype>("initial");
  const [localformsession, setlocalformsession] =
    useState<RespondentSessionType>();
  const accessModeRef = useRef(accessMode);
  accessModeRef.current = accessMode;

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
      user,
      formsession,
    }: {
      page: number;
      ty: fetchtype;
      formId?: string;
      user?: SessionState;
      formsession?: RespondentSessionType;
    }): Promise<FetchContentReturnType | null> => {
      // Check the passed formsession parameter instead of closure
      if (!formId) {
        return Promise.reject(new Error("FormId is missing"));
      }

      const paramObj: Record<string, string> = {
        p: page.toString(),
        ty,
      };

      // Only add isSwitched if needed to reduce query key variations
      if (formsession?.isSwitchedUser || user?.isAuthenticated) {
        paramObj.isSwitched = String(formsession?.isSwitchedUser ?? false);
      }

      const params = new URLSearchParams(paramObj);

      const getData = await ApiRequest({
        url: `/response/form/${formId}?${params}`,
        method: "GET",
        cookie: true,
        reactQuery: true,
      });

      if (!getData.success) {
        if (getData.status === 401) {
          console.log("Unauthenticated");
          return { ...getData, isAuthenicated: false };
        }

        return Promise.reject(new Error("Error Occured"));
      }

      return getData;
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
    const baseKey = ["respondent-form", formId, currentPage, fetchType];

    // Only add dynamic parts if they exist and are stable
    if (localformsession?.isSwitchedUser) {
      baseKey.push("switched", String(localformsession.isSwitchedUser));
    }
    if (user?.isAuthenticated) {
      baseKey.push("auth", String(user.isAuthenticated));
    }

    return baseKey;
  }, [
    formId,
    currentPage,
    fetchType,
    localformsession?.isSwitchedUser,
    user?.isAuthenticated,
  ]);

  const { data, error, isFetching } = useQuery({
    queryKey: stableQueryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes - better caching
    gcTime: 10 * 60 * 1000, // 10 minutes - retain cached data longer
    enabled: Boolean(enabled && formId),
    retry: false, // Disable retry to prevent multiple failed requests
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
    if (accessMode === "authenticated" && !formState?.isLoggedIn) {
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
      if (page >= 1 && page <= totalPages) {
        setcurrentPage(page);
      }
    },
    [totalPages]
  );

  const navigationState = useMemo(
    () => ({
      canGoNext: currentPage < totalPages,
      canGoPrev: currentPage > 1,
    }),
    [currentPage, totalPages]
  );

  return useMemo(
    () => ({
      isLoading: isFetching, // Use stable loading instead of isPending
      handlePage,
      formState,
      currentPage,
      goToPage,
      canGoNext: navigationState.canGoNext,
      canGoPrev: navigationState.canGoPrev,
      error,
      totalPages,
    }),
    [
      handlePage,
      formState,
      currentPage,
      goToPage,
      navigationState.canGoNext,
      navigationState.canGoPrev,
      error,
      totalPages,
      isFetching,
    ]
  );
};

export default useRespondentFormPaginaition;
