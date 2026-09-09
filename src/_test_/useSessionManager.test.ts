import { renderHook, act } from "@testing-library/react";
import { useSessionManager } from "../hooks/useSessionManager";
import { ErrorToast } from "../component/Modal/AlertModal";
import { RespondentSessionType } from "../component/Response/Response.type";

describe("useSessionManager", () => {
  const mockSetFormSession = jest.fn();
  const mockOnAutoSignOut = jest.fn();

  const defaultProps = {
    accessMode: "authenticated" as const,
    isFormRequiredSessionChecked: true,
    formsession: {
      isActive: true,
      respondentinfo: { respondentEmail: "test@example.com" },
    } as Partial<RespondentSessionType>,
    setformsession: mockSetFormSession,
    onAutoSignOut: mockOnAutoSignOut,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("returns initial state correctly", () => {
    const { result } = renderHook(() => useSessionManager(defaultProps));

    expect(result.current.userInactive).toBe(false);
    expect(result.current.showWarning).toBe(false);
    expect(result.current.isSessionActive).toBe(true);
    expect(result.current.isPageVisible).toBe(true);
    expect(result.current.warningMessage).toBe("");
    expect(result.current.showInactivityAlert).toBe(false);
    expect(result.current.timeUntilAutoSignout).toBe(20 * 60 * 1000);
    expect(result.current.debugInfo.accessMode).toBe("authenticated");
    expect(result.current.debugInfo.isFormRequiredSessionChecked).toBe(true);
    expect(result.current.debugInfo.formsessionActive).toBe(true);
  });

  test("triggers inactivity warning after 10 minutes of inactivity", () => {
    const { result } = renderHook(() => useSessionManager(defaultProps));

    expect(result.current.userInactive).toBe(false);

    // Advance 10 minutes
    act(() => {
      jest.advanceTimersByTime(10 * 60 * 1000);
    });

    expect(result.current.userInactive).toBe(true);
    expect(result.current.showWarning).toBe(true);
    expect(result.current.isSessionActive).toBe(false);
    expect(result.current.warningMessage).toBe(
      "You will be automatically signed out due to inactivity.",
    );

    // Verify formsession is marked inactive
    expect(mockSetFormSession).toHaveBeenCalled();
    const updaterFn = mockSetFormSession.mock.calls[0][0];
    const updated = updaterFn({ isActive: true });
    expect(updated.isActive).toBe(false);
  });

  test("triggers auto-signout after warning + 20 minutes (30 mins total)", () => {
    renderHook(() => useSessionManager(defaultProps));

    // Advance 10 minutes to trigger warning
    act(() => {
      jest.advanceTimersByTime(10 * 60 * 1000);
    });

    expect(mockOnAutoSignOut).not.toHaveBeenCalled();

    // Advance remaining 20 minutes
    act(() => {
      jest.advanceTimersByTime(20 * 60 * 1000);
    });

    expect(mockOnAutoSignOut).toHaveBeenCalledTimes(1);
  });

  test("user activity resets the inactivity timer", () => {
    const { result } = renderHook(() => useSessionManager(defaultProps));

    // Advance 7 minutes (no warning yet)
    act(() => {
      jest.advanceTimersByTime(7 * 60 * 1000);
    });
    expect(result.current.userInactive).toBe(false);

    // Simulate user activity event
    act(() => {
      document.dispatchEvent(new Event("mousemove"));
    });

    // Advance another 7 minutes (total 14 min elapsed, but only 7 min since activity)
    act(() => {
      jest.advanceTimersByTime(7 * 60 * 1000);
    });
    expect(result.current.userInactive).toBe(false);

    // Advance past the 10-minute threshold from the last activity (remaining 3 mins)
    act(() => {
      jest.advanceTimersByTime(3 * 60 * 1000);
    });
    expect(result.current.userInactive).toBe(true);
    expect(result.current.showWarning).toBe(true);
  });

  test("skips rapid activity timer resets if called within 1000ms", () => {
    const setTimeoutSpy = jest.spyOn(window, "setTimeout");
    const { result } = renderHook(() => useSessionManager(defaultProps));

    // Advance 2 seconds so timeSinceLastReset >= 1000
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const callsBefore = setTimeoutSpy.mock.calls.length;

    // Reset activity timer at t = 2000
    act(() => {
      result.current.resetActivityTimer();
    });
    expect(setTimeoutSpy.mock.calls.length).toBe(callsBefore + 1);

    // Rapid call within 500ms (should be skipped)
    act(() => {
      jest.advanceTimersByTime(500);
      result.current.resetActivityTimer();
    });
    expect(setTimeoutSpy.mock.calls.length).toBe(callsBefore + 1);

    // Call after > 1000ms (advance 1000ms more, total 1500ms since last reset)
    act(() => {
      jest.advanceTimersByTime(1000);
      result.current.resetActivityTimer();
    });
    expect(setTimeoutSpy.mock.calls.length).toBe(callsBefore + 2);

    setTimeoutSpy.mockRestore();
  });

  test("reactivates session when handleReactivateSession is called", () => {
    const { result } = renderHook(() => useSessionManager(defaultProps));

    // Incur inactivity warning
    act(() => {
      jest.advanceTimersByTime(10 * 60 * 1000);
    });
    expect(result.current.userInactive).toBe(true);
    expect(result.current.showWarning).toBe(true);

    // Reactivate session
    act(() => {
      result.current.handleReactivateSession();
    });

    expect(result.current.userInactive).toBe(false);
    expect(result.current.showWarning).toBe(false);
    expect(result.current.isSessionActive).toBe(true);

    // Verify setformsession updated to active
    const lastCall = mockSetFormSession.mock.calls.slice(-1)[0][0];
    const reactivated = lastCall({ isActive: false });
    expect(reactivated.isActive).toBe(true);
  });

  describe("page visibility alert", () => {
    test("shows alert toast when page remains hidden for 5 seconds", () => {
      const { result } = renderHook(() => useSessionManager(defaultProps));

      expect(result.current.isPageVisible).toBe(true);

      // Simulate tab blur / page hide
      act(() => {
        Object.defineProperty(document, "hidden", {
          configurable: true,
          get: () => true,
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(result.current.isPageVisible).toBe(false);

      // Advance 5 seconds (PAGE_VISIBILITY_ALERT_THRESHOLD)
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(ErrorToast).toHaveBeenCalledWith({
        toastid: "UniquePageVisibilityAlert",
        title: "Page Not Visible",
        content: "Please keep this page visible to maintain your session.",
      });
    });

    test("does not show alert toast if page becomes visible again before 5 seconds", () => {
      const { result } = renderHook(() => useSessionManager(defaultProps));

      // Page becomes hidden
      act(() => {
        Object.defineProperty(document, "hidden", {
          configurable: true,
          get: () => true,
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      // Advance 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Page becomes visible again
      act(() => {
        Object.defineProperty(document, "hidden", {
          configurable: true,
          get: () => false,
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      // Advance past remaining 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(ErrorToast).not.toHaveBeenCalled();
      expect(result.current.isPageVisible).toBe(true);
    });
  });

  test("does not start timers if accessMode is not authenticated", () => {
    const { result } = renderHook(() =>
      useSessionManager({
        ...defaultProps,
        accessMode: "login",
      }),
    );

    act(() => {
      jest.advanceTimersByTime(35 * 60 * 1000);
    });

    expect(result.current.userInactive).toBe(false);
    expect(mockOnAutoSignOut).not.toHaveBeenCalled();
  });

  test("does not start timers if isFormRequiredSessionChecked is false", () => {
    const { result } = renderHook(() =>
      useSessionManager({
        ...defaultProps,
        isFormRequiredSessionChecked: false,
      }),
    );

    act(() => {
      jest.advanceTimersByTime(35 * 60 * 1000);
    });

    expect(result.current.userInactive).toBe(false);
    expect(mockOnAutoSignOut).not.toHaveBeenCalled();
  });

  test("cleans up timers and event listeners on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(document, "removeEventListener");
    const clearTimeoutSpy = jest.spyOn(window, "clearTimeout");

    const { unmount } = renderHook(() => useSessionManager(defaultProps));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalled();

    removeEventListenerSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });
});
