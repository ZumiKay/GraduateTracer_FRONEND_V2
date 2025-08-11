import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import ApiRequest, { ApiRequestReturnType } from "../../../hooks/ApiHook";
import { FormDataType, ContentType } from "../../../types/Form.types";

interface PaginatedFormData {
  form: FormDataType | null;
  allQuestions: ContentType[];
  currentPageQuestions: ContentType[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  fetchPage: (page: number) => Promise<void>;
  retryPage: (page: number) => Promise<void>;
  isPageLoaded: (page: number) => boolean;
  loadedPages: Set<number>;
  failedPages: Set<number>;
  isPageLoading: boolean;
}

export const usePaginatedFormData = (): PaginatedFormData => {
  const { formId, token } = useParams<{ formId: string; token?: string }>();
  const [form, setForm] = useState<FormDataType | null>(null);
  const [allQuestions, setAllQuestions] = useState<ContentType[]>([]);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [failedPages, setFailedPages] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchingPage, setFetchingPage] = useState<Set<number>>(new Set());

  // Calculate total pages from all loaded questions
  const totalPages = useMemo(() => {
    if (allQuestions.length === 0) return 1;
    return Math.max(...allQuestions.map((q) => q.page || 1));
  }, [allQuestions]);

  // Get questions for current page
  const currentPageQuestions = useMemo(() => {
    return allQuestions.filter((q) => q.page === currentPage);
  }, [allQuestions, currentPage]);

  // Fetch form metadata (without all questions)
  const fetchForm = useCallback(async () => {
    if (!formId) return;

    try {
      setLoading(true);
      const url = token
        ? `response/form/${formId}?token=${token}`
        : `response/form/${formId}`;

      const result = (await ApiRequest({
        url,
        method: "GET",
      })) as ApiRequestReturnType;

      if (result.success && result.data) {
        const formData = result.data as FormDataType & {
          contentIds: ContentType[];
        };

        // Set form data without questions initially
        setForm({
          ...formData,
          contentIds: [], // We'll load questions separately
        });

        if (import.meta.env.DEV) {
          console.log("Form metadata loaded:", {
            formId: formData._id,
            title: formData.title,
            type: formData.type,
          });
        }
      } else {
        setError("Form not found or access denied");
      }
    } catch (error) {
      console.error("Error fetching form:", error);
      setError("Failed to load form");
    } finally {
      setLoading(false);
    }
  }, [formId, token]);

  // Fetch questions for a specific page
  const fetchPage = useCallback(
    async (page: number) => {
      if (!formId || fetchingPage.has(page) || loadedPages.has(page)) {
        return;
      }

      try {
        setFetchingPage((prev) => new Set(prev).add(page));
        setFailedPages((prev) => {
          const newSet = new Set(prev);
          newSet.delete(page); // Remove from failed if retrying
          return newSet;
        });

        const url = `question/getAllQuestion?formid=${formId}&page=${page}`;
        const result = (await ApiRequest({
          url,
          method: "GET",
        })) as ApiRequestReturnType;

        if (result.success && result.data) {
          const pageQuestions = result.data as ContentType[];

          setAllQuestions((prevQuestions) => {
            // Remove any existing questions from this page to avoid duplicates
            const filteredQuestions = prevQuestions.filter(
              (q) => q.page !== page
            );
            // Add new page questions
            const updatedQuestions = [...filteredQuestions, ...pageQuestions];

            if (import.meta.env.DEV) {
              console.log(`Page ${page} questions loaded:`, {
                pageQuestions: pageQuestions.length,
                totalQuestions: updatedQuestions.length,
                questionsWithParents: pageQuestions.filter(
                  (q) => q.parentcontent
                ).length,
                questionsWithConditionals: pageQuestions.filter(
                  (q) => q.conditional && q.conditional.length > 0
                ).length,
                pageQuestionsData: pageQuestions.map((q) => ({
                  id: q._id,
                  type: q.type,
                  hasParent: !!q.parentcontent,
                  parentContent: q.parentcontent,
                  hasConditionals: !!(
                    q.conditional && q.conditional.length > 0
                  ),
                  page: q.page,
                })),
              });
            }

            return updatedQuestions;
          });

          setLoadedPages((prev) => new Set(prev).add(page));
        } else {
          console.error(`Failed to load page ${page}:`, result.error);
          setFailedPages((prev) => new Set(prev).add(page));
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        setFailedPages((prev) => new Set(prev).add(page));
      } finally {
        setFetchingPage((prev) => {
          const newSet = new Set(prev);
          newSet.delete(page);
          return newSet;
        });
      }
    },
    [formId, fetchingPage, loadedPages]
  );

  // Check if a page is loaded
  const isPageLoaded = useCallback(
    (page: number) => loadedPages.has(page),
    [loadedPages]
  );

  // Retry loading a failed page
  const retryPage = useCallback(
    async (page: number) => {
      if (!failedPages.has(page)) return;
      await fetchPage(page);
    },
    [fetchPage, failedPages]
  );

  // Handle page changes
  const handleSetCurrentPage = useCallback(
    (page: number) => {
      setCurrentPage(page);
      // Automatically fetch the page if not loaded
      if (!loadedPages.has(page) && !fetchingPage.has(page)) {
        fetchPage(page);
      }
    },
    [loadedPages, fetchingPage, fetchPage]
  );

  // Initial load
  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  // Load first page after form is loaded
  useEffect(() => {
    if (form && !loadedPages.has(1)) {
      fetchPage(1);
    }
  }, [form, loadedPages, fetchPage]);

  // Preload adjacent pages for better UX
  useEffect(() => {
    if (loadedPages.has(currentPage)) {
      // Preload next page (higher priority)
      if (
        currentPage < totalPages &&
        !loadedPages.has(currentPage + 1) &&
        !fetchingPage.has(currentPage + 1)
      ) {
        setTimeout(() => fetchPage(currentPage + 1), 100);
      }
      // Preload previous page (lower priority)
      if (
        currentPage > 1 &&
        !loadedPages.has(currentPage - 1) &&
        !fetchingPage.has(currentPage - 1)
      ) {
        setTimeout(() => fetchPage(currentPage - 1), 300);
      }
    }
  }, [currentPage, totalPages, loadedPages, fetchingPage, fetchPage]);

  return {
    form,
    allQuestions,
    currentPageQuestions,
    loading: loading || fetchingPage.has(currentPage),
    error,
    totalPages,
    currentPage,
    setCurrentPage: handleSetCurrentPage,
    fetchPage,
    retryPage,
    isPageLoaded,
    loadedPages,
    failedPages,
    isPageLoading: fetchingPage.size > 0,
  };
};
