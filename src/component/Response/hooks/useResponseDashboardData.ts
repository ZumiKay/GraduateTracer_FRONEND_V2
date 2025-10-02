import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchResponseList,
  ResponseListItem,
  ResponseListResponse,
} from "../../../services/responseService";
import { useSearchParams } from "react-router-dom";
import { ResponseDashboardFilterType } from "../Response.type";

interface UseFetchResponseDashboardDataType {
  formId: string;
  filterValue?: ResponseDashboardFilterType;
}

interface UseFetchResponseDashboardDataReturn {
  responseList?: Array<ResponseListItem>;
  isLoading: boolean;
  error: Error | null;
  pagination: ResponseListResponse["pagination"] | undefined;
  currentPage: number;
  limit: number;
  handlePageChange: (page: number) => void;
  handleLimitChange: (limit: number) => void;
}

export const useFetchResponseDashbardData = ({
  formId,
  filterValue,
}: UseFetchResponseDashboardDataType): UseFetchResponseDashboardDataReturn => {
  const [searchParams, setSearchParams] = useSearchParams();

  const { currentPage, limit } = useMemo(() => {
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("lt");

    return {
      currentPage: pageParam && Number(pageParam) > 0 ? Number(pageParam) : 1,
      limit: limitParam && Number(limitParam) > 0 ? Number(limitParam) : 10,
    };
  }, [searchParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["responses", formId, currentPage, limit, filterValue],
    queryFn: () =>
      fetchResponseList({
        formId,
        page: currentPage,
        limit,
        search: filterValue?.searchTerm,
        startDate: filterValue?.dateRange?.start?.toString(),
        endDate: filterValue?.dateRange?.end?.toString(),
        minScore: filterValue?.scoreRange?.start?.toString(),
        maxScore: filterValue?.scoreRange?.end?.toString(),
        completionStatus: filterValue?.completionStatus,
      }),
    enabled: !!formId,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount) => failureCount < 3,
    refetchOnWindowFocus: false,
  });

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1) return;

      const totalPages = data?.pagination?.totalPages;
      if (totalPages && page > totalPages) return;

      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("page", page.toString());
        return newParams;
      });
    },
    [data?.pagination?.totalPages, setSearchParams]
  );

  // Memoized limit change handler
  const handleLimitChange = useCallback(
    (newLimit: number) => {
      if (newLimit <= 0) return;

      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("page", "1"); // Reset to first page
        newParams.set("lt", newLimit.toString());
        return newParams;
      });
    },
    [setSearchParams]
  );

  return {
    responseList: data?.responses,
    isLoading,
    error,
    pagination: data?.pagination,
    currentPage,
    limit,
    handlePageChange,
    handleLimitChange,
  };
};
