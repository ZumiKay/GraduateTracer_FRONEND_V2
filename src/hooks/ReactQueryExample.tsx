import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ApiRequest, { createQueryFn, createMutationFn } from "./ApiHook";

// Example 1: Using ApiRequest directly with useQuery
export const useGetFilteredForm = (
  formId: string,
  tab: string,
  page: number
) => {
  return useQuery({
    queryKey: ["filteredForm", formId, tab, page],
    queryFn: async () => {
      const response = await ApiRequest({
        method: "GET",
        url: `/filteredform?ty=${tab}&q=${formId}&page=${page}`,
        refreshtoken: true,
        cookie: true,
        reactQuery: true, // This will throw errors for React Query to handle
      });
      return response.data;
    },
    enabled: !!formId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 403/404 errors
      if ("status" in error && (error.status === 403 || error.status === 404)) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Example 2: Using the createQueryFn wrapper
export const useGetFormAnalytics = (formId: string) => {
  return useQuery({
    queryKey: ["formAnalytics", formId],
    queryFn: createQueryFn({
      method: "GET",
      url: `/forms/${formId}/analytics`,
      refreshtoken: true,
      cookie: true,
    }),
    enabled: !!formId,
  });
};

// Example 3: Using mutations with React Query
export const useUpdateForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      formId,
      data,
    }: {
      formId: string;
      data: Record<string, unknown>;
    }) => {
      const response = await ApiRequest({
        method: "PUT",
        url: `/forms/${formId}`,
        data,
        refreshtoken: true,
        cookie: true,
        reactQuery: true,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch form queries
      queryClient.invalidateQueries({
        queryKey: ["filteredForm", variables.formId],
      });

      // Optionally update the cache directly
      queryClient.setQueryData(["filteredForm", variables.formId], data);
    },
    onError: (error) => {
      console.error("Failed to update form:", error);
      // Error will be automatically handled by React Query's error boundaries
    },
  });
};

// Example 4: Using the createMutationFn wrapper
export const useCreateForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMutationFn({
      method: "POST",
      url: "/forms",
      refreshtoken: true,
      cookie: true,
    }),
    onSuccess: () => {
      // Invalidate forms list
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
};

// Example 5: Auto-save mutation with optimistic updates
export const useAutoSaveForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      formId,
      changes,
    }: {
      formId: string;
      changes: Record<string, unknown>;
    }) => {
      const response = await ApiRequest({
        method: "PATCH",
        url: `/forms/${formId}/autosave`,
        data: changes,
        refreshtoken: true,
        cookie: true,
        reactQuery: true,
      });
      return response.data;
    },
    // Optimistic updates for better UX
    onMutate: async ({ formId, changes }) => {
      await queryClient.cancelQueries({ queryKey: ["filteredForm", formId] });

      const previousForm = queryClient.getQueryData(["filteredForm", formId]);

      queryClient.setQueryData(["filteredForm", formId], (old: unknown) => ({
        ...(old as Record<string, unknown>),
        ...changes,
      }));

      return { previousForm, formId };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousForm) {
        queryClient.setQueryData(
          ["filteredForm", context.formId],
          context.previousForm
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: ["filteredForm", variables.formId],
      });
    },
  });
};

// Example 6: Simple paginated query (not infinite)
export const useFormResponses = (formId: string, page: number = 1) => {
  return useQuery({
    queryKey: ["formResponses", formId, page],
    queryFn: async () => {
      const response = await ApiRequest({
        method: "GET",
        url: `/forms/${formId}/responses?page=${page}`,
        refreshtoken: true,
        cookie: true,
        reactQuery: true,
      });
      return response.data;
    },
    enabled: !!formId,
  });
};
