/**
 * Testing useImprovedAutoSave
 *
 * Cases
 *  [] Start with idle status
 *  [] Set timer Logic
 *  [] lastSavedHashRef update
 *  [] offlineQueue update when back online
 *
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { AutoSaveQuestion } from "../pages/FormPage.action";
import useImprovedAutoSave from "./useImprovedAutoSave";
import { ApiRequestReturnType } from "./ApiHook";
import * as ReactRedux from "react-redux";
import { ContentType, QuestionType } from "../types/Form.types";

// Mock ApiHook to avoid import.meta issues
jest.mock("../hooks/ApiHook", () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve({ success: true, data: {} })),
}));

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(() => jest.fn()),
  useSelector: jest.fn((selector) =>
    selector({
      allform: {
        allquestion: [],
        formstate: { _id: "test-form-id", setting: { autosave: true } },
        page: 1,
        debounceQuestion: null,
        pauseAutoSave: false,
        prevAllQuestion: [],
      },
    })
  ),
}));

jest.mock("../pages/FormPage.action", () => ({
  AutoSaveQuestion: jest.fn(() => Promise.resolve({ success: true, data: {} })),
}));

jest.mock("../component/Modal/AlertModal", () => ({
  ErrorToast: jest.fn(),
}));

jest.mock("../services/labelQuestionNumberingService", () => ({
  stripQuestionNumbering: jest.fn((data) => data),
}));

const mockedApiRequestReturn: ApiRequestReturnType = {
  success: true,
  data: {},
};

describe("Auto function test", () => {
  beforeEach(() => {
    // Reset and setup mocks before each test
    jest.clearAllMocks();
    jest.useFakeTimers();
    (
      AutoSaveQuestion as jest.MockedFunction<typeof AutoSaveQuestion>
    ).mockResolvedValue(mockedApiRequestReturn);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
  it("Initialization", () => {
    const { result } = renderHook(() => useImprovedAutoSave());
    const expectInititlaizeStatus = {
      status: "idle",
      lastSaved: null,
      error: null,
      retryCount: 0,
    };

    expect(result.current.autoSaveStatus).toStrictEqual(
      expectInititlaizeStatus
    );
  });

  it("Debounce Auto Save", async () => {
    const mockQuestion = {
      _id: "q1",
      questionId: "question-1",
      content: "Test Question",
      answer: {},
      qIdx: 0,
      page: 1,
      required: false,
    };

    // Mock useSelector to return and change debounceQuestion
    const mockUseSelector = jest.spyOn(ReactRedux, "useSelector");
    mockUseSelector.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({
          allform: {
            allquestion: [mockQuestion],
            formstate: { _id: "test-form-id", setting: { autosave: true } },
            page: 1,
            debounceQuestion: mockQuestion,
            pauseAutoSave: false,
            prevAllQuestion: [],
          },
        })
    );

    const { result } = renderHook(() =>
      useImprovedAutoSave({ debounceMs: 1500 })
    );

    // Initially status should be idle
    expect(result.current.autoSaveStatus.status).toBe("idle");

    // Fast forward 1000ms (not enough time)
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Status should still be idle (debounce not complete)
    expect(result.current.autoSaveStatus.status).toBe("idle");

    // Fast forward remaining 500ms (total 1500ms)
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Wait for async operations to complete
    await waitFor(() => {
      expect(result.current.autoSaveStatus.status).toBe("saved");
    });

    // Verify AutoSaveQuestion was called
    expect(AutoSaveQuestion).toHaveBeenCalledTimes(1);

    mockUseSelector.mockRestore();
  });

  it("Offline queue saves when back online", async () => {
    const mockQuestion: ContentType = {
      _id: "q1",
      type: QuestionType.Number,
      formId: "Offline_Form",
      questionId: "question-1",
      content: "Test Question Offline",
      answer: undefined,
      qIdx: 0,
      page: 1,
      required: false,
    };

    // Mock navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false, // Start offline
    });

    // Mock useSelector to return debounceQuestion
    const mockUseSelector = jest.spyOn(ReactRedux, "useSelector");
    mockUseSelector.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({
          allform: {
            allquestion: [mockQuestion],
            formstate: { _id: "test-form-id", setting: { autosave: true } },
            page: 1,
            debounceQuestion: mockQuestion,
            pauseAutoSave: false,
            prevAllQuestion: [],
          },
        })
    );

    const { result } = renderHook(() =>
      useImprovedAutoSave({ debounceMs: 1500 })
    );

    // Initially should be offline
    expect(result.current.isOnline).toBe(false);

    // Trigger debounce while offline
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    // Should have queued data, but not saved (offline)
    expect(AutoSaveQuestion).not.toHaveBeenCalled();
    expect(result.current.offlineQueueSize).toBeGreaterThan(0);

    await act(async () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event("online"));

      // Advance timers to allow state updates to process
      jest.advanceTimersByTime(0);
    });

    // Wait for the hook to detect online status and process queue
    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });

    // Wait for async save operation to complete
    await waitFor(() => {
      expect(AutoSaveQuestion).toHaveBeenCalled();
    });

    // Queue should be empty after processing
    await waitFor(() => {
      expect(result.current.offlineQueueSize).toBe(0);
    });

    mockUseSelector.mockRestore();
  });
});
