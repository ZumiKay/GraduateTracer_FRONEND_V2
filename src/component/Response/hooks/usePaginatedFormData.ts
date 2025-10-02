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
  const [isStableLoading, setIsStableLoading] = useState(false);
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
      if (!formId || !formsession) {
        return null;
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

      //handle session expired
      if (getData.status === 401) {
        return { ...getData, isAuthenicated: false };
      }

      return getData;
    },
    [] // Remove localformsession dependency since we check the parameter
  );

  // Create stable query params to prevent unnecessary refetches
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

  // Stable query function that doesn't change unless params actually change
  const queryFn = useCallback(
    () => fetchContent(stableQueryParams),
    [fetchContent, stableQueryParams]
  );

  // Create stable query key to prevent unnecessary cache invalidation
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

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: stableQueryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes - better caching
    gcTime: 10 * 60 * 1000, // 10 minutes - retain cached data longer
    enabled: enabled && !!formId && !!localformsession,
    refetchOnWindowFocus: false,
    retry: 2,
    refetchOnMount: false, // Don't refetch on mount if data is fresh
    refetchInterval: false, // Disable automatic refetching
    // Add network mode to prevent loading on every network change
    networkMode: "online",
  });

  // Manage stable loading state to prevent glitchy loading
  useEffect(() => {
    if (isPending || isFetching) {
      setIsStableLoading(true);
    } else {
      // Add small delay before hiding loading to prevent flicker
      const timer = setTimeout(() => {
        setIsStableLoading(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isPending, isFetching]);

  const formState = useMemo(
    () => data?.data as GetFormStateResponseType | undefined,
    [data?.data]
  );

  useEffect(() => {
    if (
      formState?.isAuthenticated &&
      (accessMode === "authenticated" || accessMode === "guest")
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
      isLoading: isStableLoading, // Use stable loading instead of isPending
      handlePage,
      formState,
      currentPage,
      goToPage,
      canGoNext: navigationState.canGoNext,
      canGoPrev: navigationState.canGoPrev,
      error,
      totalPages,
      isFetching, // Keep original for debugging if needed
      isPending, // Keep original for debugging if needed
    }),
    [
      isStableLoading, // Use stable loading in dependencies
      handlePage,
      formState,
      currentPage,
      goToPage,
      navigationState.canGoNext,
      navigationState.canGoPrev,
      error,
      totalPages,
      isFetching,
      isPending,
    ]
  );
};

export default useRespondentFormPaginaition;
