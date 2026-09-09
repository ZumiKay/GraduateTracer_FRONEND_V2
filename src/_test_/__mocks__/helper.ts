import { AxiosInstance, AxiosResponse } from "axios";
import {
  ApiRequestProps,
  ApiRequestReturnType,
} from "../../hooks/APIHook/ApiHook";

// Mock localStorage
export const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

//Mock Api Request
export const ApiRequestMock = ({
  reactQuery,
  returnawait,
  throwError,
}: ApiRequestProps): Promise<ApiRequestReturnType> => {
  if (returnawait) {
    return new Promise(
      jest.fn().mockReturnThis(),
    ) as Promise<ApiRequestReturnType>;
  }

  const response = jest.fn() as unknown as AxiosResponse;

  if (throwError) {
    return {
      success: false,
      status: 500,
      error: "Error occured",
      reactQuery,
    } as never;
  }

  return {
    success: true,
    data: response.data,
    status: response.status,
    message: response.data.message,
    pagination: response.data.pagination,
    reactQuery,
  } as never;
};
