import ApiRequest from "./ApiHook";
import type { ApiRequestProps } from "./ApiHook";

/* --------------------------- React Query Helpers -------------------------- */

export const createQueryFn = (
  requestConfig: Omit<ApiRequestProps, "reactQuery">,
) => {
  return async () => {
    return await ApiRequest({ ...requestConfig, reactQuery: true });
  };
};

export const createMutationFn = (
  requestConfig: Omit<ApiRequestProps, "reactQuery" | "data">,
) => {
  return async (data?: Record<string, unknown>) => {
    const response = await ApiRequest({
      ...requestConfig,
      data,
      reactQuery: true,
    });
    return response.data;
  };
};
