import { useCallback, useEffect, useMemo, useState } from "react";
import { FormDataType } from "../../../types/Form.types";
import { useQuery } from "@tanstack/react-query";
import ApiRequest from "../../../hooks/ApiHook";
import { useNavigate } from "react-router";

type useRespondentFormPaginationProps = {
  formId?: string;
  token?: string;
};

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
};

const useRespondentFormPaginaition = ({
  formId,
  token,
}: useRespondentFormPaginationProps): UseRespondentFormPaginationReturn => {
  const navigate = useNavigate();
  const [currentPage, setcurrentPage] = useState(1);

  const isValidAccess = useMemo(() => {
    return !!(formId && token);
  }, [formId, token]);

  useEffect(() => {
    if (!isValidAccess) {
      navigate("/notfound");
    }
  }, [navigate, isValidAccess]);

  const fetchContent = useCallback(
    async (page: number) => {
      if (!formId || !token) return null;

      const getData = await ApiRequest({
        url: `/response/form/${formId}?token=${token}&p=${page}`,
        method: "GET",
      });

      return getData;
    },
    [formId, token]
  );

  const { data, error, isLoading } = useQuery({
    queryKey: ["respondent-form", formId, token, currentPage],
    queryFn: () => fetchContent(currentPage ?? 1),
    staleTime: 5 * 60 * 1000, // 5 minutes - better caching
    gcTime: 10 * 60 * 1000, // 10 minutes - retain cached data longer
    enabled: isValidAccess,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const formState = useMemo(() => {
    return data?.data as FormDataType | undefined;
  }, [data?.data]);

  const handlePage = useCallback(
    (direction: "prev" | "next") => {
      const totalPages = formState?.totalpage ?? 1;

      if (setcurrentPage)
        setcurrentPage((prevPage) => {
          if (direction === "prev") {
            return prevPage > 1 ? prevPage - 1 : prevPage;
          } else {
            return prevPage < totalPages ? prevPage + 1 : prevPage;
          }
        });
    },
    [formState?.totalpage, setcurrentPage]
  );

  const goToPage = useCallback(
    (page: number) => {
      if (!setcurrentPage) return;
      const totalPages = formState?.totalpage ?? 1;
      if (page >= 1 && page <= totalPages) {
        setcurrentPage(page);
      }
    },
    [formState?.totalpage, setcurrentPage]
  );

  const canGoNext = useMemo(() => {
    return !!(currentPage && currentPage < (formState?.totalpage ?? 1));
  }, [currentPage, formState?.totalpage]);

  const canGoPrev = useMemo(() => {
    return !!(currentPage && currentPage > 1);
  }, [currentPage]);

  return {
    isLoading,
    handlePage,
    formState,
    currentPage,
    goToPage,
    canGoNext,
    canGoPrev,
    error,
    totalPages: formState?.totalpage ?? 1,
  };
};

export default useRespondentFormPaginaition;
