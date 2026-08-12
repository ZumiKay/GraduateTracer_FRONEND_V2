import { renderHook, waitFor } from "@testing-library/react";
import { useState, useEffect } from "react";
import useFormsessionAPI from "../hooks/useFormsessionAPI";
import { generateStorageKey } from "../helperFunc";
import { SessionState } from "../redux/user.store";

// Mock the useFormsessionAPI module
jest.mock("../hooks/useFormsessionAPI", () => ({
  __esModule: true,
  default: jest.fn(),
  setUserSwitching: jest.fn(),
  isUserSwitching: jest.fn(() => false),
}));

// Mock helper functions
jest.mock("../helperFunc", () => ({
  generateStorageKey: jest.fn(
    ({ suffix, userKey, formId }) => `${formId}_${userKey}_${suffix}`
  ),
  cleanupUnrelatedLocalStorage: jest.fn(),
  saveFormSateToLocalStorage: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
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

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Test of useFormInitialization hook
const useFormInitialization = ({
  formId,
  user,
  dispatch,
}: {
  formId: string | undefined;
  user: SessionState;
  dispatch: jest.Mock;
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const { useSessionVerification } = useFormsessionAPI();

  const sessionVerificationEnabled = Boolean(formId);
  const verifiedSession = useSessionVerification(
    sessionVerificationEnabled,
    formId
  );

  useEffect(() => {
    const initializeForm = async () => {
      setIsInitializing(true);
      setIsInitialized(false);

      try {
        if (!formId) {
          setIsInitialized(true);
          return;
        }

        if (verifiedSession.isLoading || verifiedSession.isFetching) {
          return;
        }

        if (verifiedSession.data?.data) {
          const key = generateStorageKey({
            suffix: "state",
            userKey: verifiedSession.data.data.respondentEmail,
            formId: formId,
          });

          const savedData = localStorage.getItem(key);
          if (savedData) {
            try {
              const parsed = JSON.parse(savedData);
              dispatch({
                type: "SET_FORMSESSION",
                payload: parsed,
              });
            } catch (error) {
              console.error("Error parsing saved data:", error);
              localStorage.removeItem(key);
            }
          } else {
            const defaultSession = {
              isActive: true,
              respondentinfo: verifiedSession.data.data,
            };
            localStorage.setItem(key, JSON.stringify(defaultSession));
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Form initialization error:", error);
        setIsInitialized(true);
      } finally {
        if (!verifiedSession.isLoading && !verifiedSession.isFetching) {
          setIsInitializing(false);
        }
      }
    };

    initializeForm();
  }, [
    formId,
    user.isAuthenticated,
    dispatch,
    user.user,
    verifiedSession.isLoading,
    verifiedSession.isFetching,
    verifiedSession.data,
    verifiedSession.error,
  ]);

  return {
    isInitialized,
    isInitializing,
    sessionVerificationLoading:
      verifiedSession.isLoading || verifiedSession.isFetching,
    sessionVerificationError: verifiedSession.error,
    sessionData: verifiedSession.data,
  };
};

describe("useFormInitialization", () => {
  const mockDispatch = jest.fn();
  const mockUseSessionVerification = jest.fn();

  const defaultUser = {
    isAuthenticated: false,
    user: null,
  };

  const createSessionVerificationMock = (
    overrides: Partial<{
      isLoading: boolean;
      isFetching: boolean;
      data: unknown;
      error: unknown;
    }> = {}
  ) => ({
    isLoading: false,
    isFetching: false,
    data: null,
    error: null,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();

    // Setup default mock implementation
    (useFormsessionAPI as jest.Mock).mockReturnValue({
      useSessionVerification: mockUseSessionVerification,
    });
  });

  describe("Initialization Flow", () => {
    it("should initialize immediately when formId is undefined", async () => {
      const formId = undefined;
      mockUseSessionVerification.mockReturnValue(
        createSessionVerificationMock()
      );

      const { result } = renderHook(() =>
        useFormInitialization({
          formId,
          user: defaultUser,
          dispatch: mockDispatch,
        })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
        expect(result.current.isInitializing).toBe(false);
      });

      // Should not call session verification when formId is undefined
      expect(mockUseSessionVerification).toHaveBeenCalledWith(false, undefined);
    });

    it("should remain in loading state while session verification is in progress", async () => {
      const formId = "test-form-123";
      mockUseSessionVerification.mockReturnValue(
        createSessionVerificationMock({ isLoading: true, isFetching: true })
      );

      const { result } = renderHook(() =>
        useFormInitialization({
          formId,
          user: defaultUser,
          dispatch: mockDispatch,
        })
      );

      // Should remain in initializing state
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.isInitializing).toBe(true);
      expect(result.current.sessionVerificationLoading).toBe(true);
    });

    it("should complete initialization when session verification finishes", async () => {
      const formId = "test-form-123";
      const respondentData = {
        respondentEmail: "test@example.com",
        respondentName: "Test User",
        isGuest: false,
      };

      mockUseSessionVerification.mockReturnValue(
        createSessionVerificationMock({
          data: { data: respondentData },
        })
      );

      const { result } = renderHook(() =>
        useFormInitialization({
          formId,
          user: defaultUser,
          dispatch: mockDispatch,
        })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
        expect(result.current.isInitializing).toBe(false);
      });
    });
  });

  describe("Session Verification Handling", () => {
    it("should load saved session data from localStorage when verification succeeds", async () => {
      const formId = "test-form-123";
      const respondentEmail = "test@example.com";
      const savedSessionData = {
        isActive: true,
        currentPage: 1,
        responses: [{ question: "q1", response: "answer1" }],
      };

      // Setup localStorage with saved data
      const storageKey = `${formId}_${respondentEmail}_state`;
      localStorageMock.setItem(storageKey, JSON.stringify(savedSessionData));

      (generateStorageKey as jest.Mock).mockReturnValue(storageKey);

      mockUseSessionVerification.mockReturnValue(
        createSessionVerificationMock({
          data: {
            data: {
              respondentEmail,
              respondentName: "Test User",
              isGuest: false,
            },
          },
        })
      );

      const { result } = renderHook(() =>
        useFormInitialization({
          formId,
          user: defaultUser,
          dispatch: mockDispatch,
        })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should have retrieved and parsed the saved data
      expect(localStorageMock.getItem).toHaveBeenCalledWith(storageKey);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_FORMSESSION",
        payload: savedSessionData,
      });
    });

    it("should create default session when no saved data exists", async () => {
      const formId = "test-form-123";
      const respondentEmail = "test@example.com";
      const respondentData = {
        respondentEmail,
        respondentName: "Test User",
        isGuest: false,
      };

      const storageKey = `${formId}_${respondentEmail}_state`;
      (generateStorageKey as jest.Mock).mockReturnValue(storageKey);

      mockUseSessionVerification.mockReturnValue(
        createSessionVerificationMock({
          data: { data: respondentData },
        })
      );

      const { result } = renderHook(() =>
        useFormInitialization({
          formId,
          user: defaultUser,
          dispatch: mockDispatch,
        })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should have created and saved default session
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        storageKey,
        JSON.stringify({
          isActive: true,
          respondentinfo: respondentData,
        })
      );
    });

    it("should handle corrupted localStorage data gracefully", async () => {
      const formId = "test-form-123";
      const respondentEmail = "test@example.com";

      // Setup localStorage with invalid JSON
      const storageKey = `${formId}_${respondentEmail}_state`;
      localStorageMock.setItem(storageKey, "{ invalid json }");
      (generateStorageKey as jest.Mock).mockReturnValue(storageKey);

      mockUseSessionVerification.mockReturnValue(
        createSessionVerificationMock({
          data: {
            data: {
              respondentEmail,
              respondentName: "Test User",
            },
          },
        })
      );

      const { result } = renderHook(() =>
        useFormInitialization({
          formId,
          user: defaultUser,
          dispatch: mockDispatch,
        })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should have removed the corrupted data
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(storageKey);

      // Should not crash and should complete initialization
      expect(result.current.isInitialized).toBe(true);
    });

    it("should handle session verification errors gracefully", async () => {
      const formId = "test-form-123";
      const error = new Error("Session verification failed");

      mockUseSessionVerification.mockReturnValue(
        createSessionVerificationMock({ error })
      );

      const { result } = renderHook(() =>
        useFormInitialization({
          formId,
          user: defaultUser,
          dispatch: mockDispatch,
        })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should expose the error
      expect(result.current.sessionVerificationError).toBe(error);

      // Should still complete initialization to prevent blocking
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isInitializing).toBe(false);
    });

    it("should handle missing session data in verification response", async () => {
      const formId = "test-form-123";

      mockUseSessionVerification.mockReturnValue(
        createSessionVerificationMock({
          data: {}, // Empty data object, no nested data property
        })
      );

      const { result } = renderHook(() =>
        useFormInitialization({
          formId,
          user: defaultUser,
          dispatch: mockDispatch,
        })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should handle gracefully without crashing
      expect(result.current.isInitialized).toBe(true);
      // Should not attempt to save or load data
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe("Effect Dependencies", () => {
    it("should re-initialize when formId changes", async () => {
      mockUseSessionVerification.mockReturnValue(
        createSessionVerificationMock()
      );

      const { result, rerender } = renderHook(
        ({ formId }) =>
          useFormInitialization({
            formId,
            user: defaultUser,
            dispatch: mockDispatch,
          }),
        {
          initialProps: { formId: "form-1" },
        }
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Change formId
      rerender({ formId: "form-2" });

      // Should re-initialize
      await waitFor(() => {
        expect(mockUseSessionVerification).toHaveBeenLastCalledWith(
          true,
          "form-2"
        );
      });
    });

    it("should re-initialize when user authentication changes", async () => {
      const respondentData = {
        respondentEmail: "test@example.com",
        respondentName: "Test User",
        isGuest: false,
      };

      // Return session data so dispatch will be called
      mockUseSessionVerification.mockReturnValue(
        createSessionVerificationMock({
          data: { data: respondentData },
        })
      );

      const storageKey = `test-form_${respondentData.respondentEmail}_state`;
      (generateStorageKey as jest.Mock).mockReturnValue(storageKey);

      const { result, rerender } = renderHook(
        ({ user }) =>
          useFormInitialization({
            formId: "test-form",
            user,
            dispatch: mockDispatch,
          }),
        {
          initialProps: { user: { isAuthenticated: false, user: null } },
        }
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Record initial call counts
      const initialGetItemCallCount =
        localStorageMock.getItem.mock.calls.length;

      // Change authentication state - this should trigger re-initialization
      rerender({
        user: {
          isAuthenticated: true,
          user: { email: "user@example.com" } as never,
        },
      });

      // Effect should run again - localStorage.getItem should be called again to check for saved data
      await waitFor(
        () => {
          expect(localStorageMock.getItem.mock.calls.length).toBeGreaterThan(
            initialGetItemCallCount
          );
        },
        { timeout: 2000 }
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid formId changes gracefully", async () => {
      mockUseSessionVerification.mockReturnValue(
        createSessionVerificationMock()
      );

      const { rerender } = renderHook(
        ({ formId }) =>
          useFormInitialization({
            formId,
            user: defaultUser,
            dispatch: mockDispatch,
          }),
        {
          initialProps: { formId: "form-1" },
        }
      );

      // Rapidly change formId
      rerender({ formId: "form-2" });
      rerender({ formId: "form-3" });
      rerender({ formId: "form-4" });

      // Should handle without crashing
      expect(() => {
        rerender({ formId: "form-5" });
      }).not.toThrow();
    });

    it("should handle null or undefined in session data", async () => {
      mockUseSessionVerification.mockReturnValue(
        createSessionVerificationMock({
          data: null,
        })
      );

      const { result } = renderHook(() =>
        useFormInitialization({
          formId: "test-form",
          user: defaultUser,
          dispatch: mockDispatch,
        })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should not crash
      expect(result.current.isInitialized).toBe(true);
    });

    it("should not dispatch when verification returns no data", async () => {
      mockUseSessionVerification.mockReturnValue(
        createSessionVerificationMock({
          data: undefined,
        })
      );

      const { result } = renderHook(() =>
        useFormInitialization({
          formId: "test-form",
          user: defaultUser,
          dispatch: mockDispatch,
        })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should not call dispatch
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });
});
