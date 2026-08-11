import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { FormDataType, ValidationResult } from "../../../types/Form.types";
import { useQuery } from "@tanstack/react-query";
import ApiRequest, {
  ApiRequestReturnType,
} from "../../../hooks/APIHook/ApiHook";
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

export type accessModeType = "login" | "authenticated" | "error";
type fetchtype = "data" | "initial";
export interface GetFormStateResponseType extends FormDataType {
  isResponsed?: SubmittionProcessionReturnType;
  isLoggedin?: boolean;
  message?: string;
  //For test unique of response for public form
  fingerprintStrength?: number;
  /** Content-level validation result returned from the backend */
  contentValidation?: ValidationResult;
}

export type UseRespondentFormPaginationReturn = {
  isFetching: boolean;
  handlePage: (direction: "prev" | "next") => void;
  formState: GetFormStateResponseType | undefined;
  currentPage: number | null;
  goToPage: (page: number) => void;
  canGoNext: boolean | undefined;
  canGoPrev: boolean | undefined;
  error: Error | null;
  totalPages: number;
  showInactiveAlert?: boolean;
  isSuccess?: boolean;
  isFormRequiredSessionChecked?: boolean;
  isValidationError?: boolean;
};

type useRespondentFormPaginationProps = {
  formId?: string;
  initialVerify?: boolean;
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

  const storageKey = useMemo(
    () =>
      formId && formsession?.respondentinfo?.respondentEmail
        ? generateStorageKey({
            suffix: "progress",
            formId,
            userKey: formsession.respondentinfo.respondentEmail,
          })
        : null,
    [formId, formsession?.respondentinfo?.respondentEmail],
  );

  const savedPageData = useMemo(() => {
    if (!formId) return null;
    if (storageKey) {
      try {
        const storedData = localStorage.getItem(storageKey);
        return storedData ? (JSON.parse(storedData) as SaveProgressType) : null;
      } catch (error) {
        console.error("Failed to parse saved page data:", error);
        return null;
      }
    }
    // Fallback for open/guest forms: no email-based key available
    if (enabled) {
      try {
        const noEmailKey = generateStorageKey({ suffix: "progress", formId });
        const storedData = localStorage.getItem(noEmailKey);
        return storedData ? (JSON.parse(storedData) as SaveProgressType) : null;
      } catch {
        return null;
      }
    }
    return null;
  }, [storageKey, formId, enabled]);

  useEffect(() => {
    if (currentPage !== null) return; // already initialized
    if (storageKey !== null || enabled) {
      setcurrentPage(savedPageData?.currentPage ?? 1);
    }
  }, [storageKey, enabled, savedPageData, currentPage]);

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
    //set session to exsit one
    if (stableFormsession && stableFormsession !== localformsession) {
      const timer = setTimeout(() => {
        setlocalformsession(stableFormsession);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [stableFormsession, localformsession]);

  const fetchContent = useCallback(
    ({
      page,
      ty,
      formId,
    }: {
      page: number | null;
      ty: fetchtype;
      formId?: string;
    }): Promise<FetchContentReturnType | null> => {
      if (!formId) {
        return Promise.reject(new Error("FormId is missing"));
      }

      if (!page || page < 1) {
        return Promise.reject(new Error("Invalid page number"));
      }

      const params = new URLSearchParams({
        p: page.toString(),
        ty,
      });
      return ApiRequest({
        url: `/response/form/${formId}?${params}`,
        method: "GET",
        cookie: true,
        reactQuery: true,
      });
    },
    [],
  );

  const stableQueryParams = useMemo(
    () => ({
      formId,
      page: currentPage,
      ty: fetchType,
    }),
    [formId, currentPage, fetchType],
  );

  const queryFn = useCallback(
    () => fetchContent(stableQueryParams),
    [fetchContent, stableQueryParams],
  );

  const { data, error, isFetching, isSuccess } = useQuery({
    queryKey: [
      "respondent-form",
      formId,
      currentPage,
      fetchType,
      formsession?.respondentinfo?.respondentEmail ?? null,
    ],
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: Boolean(enabled && formId && currentPage && currentPage >= 1),
    retry: (failureCount, error: Error) => {
      const status = (error as unknown as { status?: number }).status;
      if (status === 401) return false;
      return failureCount < 2; // Max 2 retries
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    refetchOnReconnect: false,
    refetchIntervalInBackground: false,
    networkMode: "online",
  });

  const formState = useMemo(() => {
    return data?.data as GetFormStateResponseType | undefined;
  }, [data]);

  useEffect(() => {
    if (accessMode === "authenticated" && !formState?.isAuthenticated) {
      setfetchType("initial");
    } else if (
      formState &&
      !formState?.setting?.email &&
      !formState?.isResponsed
    ) {
      setfetchType("data");
    }
  }, [
    accessMode,
    formState,
    formState?.isAuthenticated,
    formState?.isResponsed,
    formState?.setting?.email,
  ]);

  useEffect(() => {
    if (!formId) {
      navigate("/notfound");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  const totalPages = useMemo(
    () => formState?.totalpage ?? 1,
    [formState?.totalpage],
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
    [totalPages],
  );

  const goToPage = useCallback(
    (page: number) => {
      // Validate page bounds before setting
      if (page >= 1 && page <= totalPages) {
        setcurrentPage(page);
      } else {
        console.warn(
          `Invalid page number: ${page}. Valid range: 1-${totalPages}`,
        );
      }
    },
    [totalPages],
  );

  const navigationState = useMemo(
    () => ({
      canGoNext: currentPage ? currentPage < totalPages : undefined,
      canGoPrev: currentPage ? currentPage > 1 : undefined,
    }),
    [currentPage, totalPages],
  );

  return useMemo(
    () => ({
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
      isSuccess,
      isFormRequiredSessionChecked: !!formState?.setting?.email,
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
      isSuccess,
    ],
  );
};

export default useRespondentFormPaginaition;
