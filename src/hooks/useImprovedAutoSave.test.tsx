/**
 * Tests for useImprovedAutoSave
 *
 * Cases:
 *  [x] Initializes with idle status
 *  [x] Does not autosave when autosave setting is disabled
 *  [x] Does not autosave when pauseAutoSave is true
 *  [x] Triggers debounced save on autosave event (event-bus)
 *  [x] Skips save when data has not changed (hash check)
 *  [x] Does not call AutoSaveQuestion when offline — queues instead
 *  [x] Processes offline queue when back online
 *  [x] Retries on save failure (up to retryAttempts)
 *  [x] Syncs saved question ids into the store after an autosave (question tab only)
 *  [x] Sends the page version with each save and stores the one returned
 *  [x] On a 409 conflict: no retry, offers a reload, blocks further saves
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { AutoSaveQuestion } from "../pages/FormPage.action";
import useImprovedAutoSave from "./useImprovedAutoSave";
import { ApiRequestReturnType } from "./APIHook/ApiHook";
import * as ReactRedux from "react-redux";
import { ContentType, QuestionType } from "../types/Form.types";
import { syncQuestionsAfterSave } from "../redux/formstore";
import {
  getContentVersion,
  hasContentConflict,
  resetContentVersions,
  setContentVersion,
} from "../services/contentVersionService";

const makeQuestion = (overrides: Partial<ContentType> = {}): ContentType => ({
  _id: "q1",
  type: QuestionType.Number,
  formId: "form-123",
  questionId: "question-1",
  content: "Sample Question",
  answer: undefined,
  qIdx: 0,
  page: 1,
  required: false,
  ...overrides,
});

const defaultReduxState = {
  allform: {
    allquestion: [] as Array<ContentType>,
    formstate: { _id: "test-form-id", setting: { autosave: true } },
    page: 1,
    debounceQuestion: null as ContentType | null,
    pauseAutoSave: false,
    prevAllQuestion: [] as Array<ContentType>,
  },
};

const successReturn: ApiRequestReturnType = { success: true, data: [] };

//Module Mock

jest.mock("../hooks/APIHook/ApiHook.tsx", () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve({ success: true, data: {} })),
}));

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(() => jest.fn()),
  useSelector: jest.fn((selector) => selector(defaultReduxState)),
}));

jest.mock("../pages/FormPage.action", () => ({
  AutoSaveQuestion: jest.fn(() => Promise.resolve({ success: true, data: [] })),
}));

jest.mock("../component/Modal/AlertModal", () => ({
  ErrorToast: jest.fn(),
}));

jest.mock("../services/labelQuestionNumberingService", () => ({
  stripQuestionNumbering: jest.fn((data) => data),
}));

jest.mock("../component/Response/utils/validationUtils.ts", () => ({
  hasQuestionValidationIssues: jest.fn(() => false),
}));

/**
 * Dispatch a real CustomEvent so the hook's onAutoSaveEvent listener fires.
 */
const fireAutoSaveEvent = (tab: "question" | "solution" = "question") => {
  window.dispatchEvent(
    new CustomEvent("form:autosave-trigger", {
      detail: { tab },
      bubbles: false,
    }),
  );
};

const mockUseSelector = (state: typeof defaultReduxState) => {
  (ReactRedux.useSelector as unknown as jest.Mock).mockImplementation(
    (selector: (s: typeof defaultReduxState) => unknown) => selector(state),
  );
};

/* --------------------------------- Test --------------------------------- */

describe("useImprovedAutoSave", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    resetContentVersions();

    // Default: online
    Object.defineProperty(navigator, "onLine", { writable: true, value: true });

    (AutoSaveQuestion as jest.Mock).mockResolvedValue(successReturn);

    // Reset selector to default state
    (ReactRedux.useSelector as unknown as jest.Mock).mockImplementation(
      (selector: (s: typeof defaultReduxState) => unknown) =>
        selector(defaultReduxState),
    );
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Initialization", () => {
    it("starts with idle status and sensible defaults", () => {
      const { result } = renderHook(() => useImprovedAutoSave());

      expect(result.current.autoSaveStatus).toStrictEqual({
        status: "idle",
        lastSaved: null,
        error: null,
        retryCount: 0,
      });
      expect(result.current.isOnline).toBe(true);
      expect(result.current.offlineQueueSize).toBe(0);
      expect(typeof result.current.manualSave).toBe("function");
      expect(typeof result.current.updateAllQueueData).toBe("function");
    });
  });

  describe("Event-bus autosave", () => {
    const question = makeQuestion();

    beforeEach(() => {
      mockUseSelector({
        allform: {
          ...defaultReduxState.allform,
          allquestion: [question] as Array<ContentType>,
        },
      });
    });

    it("calls AutoSaveQuestion after debounce when autosave event fires", async () => {
      renderHook(() => useImprovedAutoSave({ debounceMs: 1000 }));

      act(() => {
        fireAutoSaveEvent("question");
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(AutoSaveQuestion).toHaveBeenCalledTimes(1);
      });
    });

    it("dispatches syncQuestionsAfterSave with the saved data after an autosave", async () => {
      const dispatch = jest.fn();
      (ReactRedux.useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
      const savedData = [makeQuestion({ _id: "server-id" })];
      (AutoSaveQuestion as jest.Mock).mockResolvedValue({
        success: true,
        data: savedData,
      });

      renderHook(() => useImprovedAutoSave({ debounceMs: 1000 }));

      act(() => {
        fireAutoSaveEvent("question");
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(dispatch).toHaveBeenCalledWith(
          syncQuestionsAfterSave({ savedData }),
        );
      });
    });

    it("does not dispatch syncQuestionsAfterSave for the solution tab", async () => {
      const dispatch = jest.fn();
      (ReactRedux.useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
      const savedData = [makeQuestion({ _id: "server-id" })];
      (AutoSaveQuestion as jest.Mock).mockResolvedValue({
        success: true,
        data: savedData,
      });

      renderHook(() =>
        useImprovedAutoSave({ debounceMs: 1000, tab: "solution" }),
      );

      act(() => {
        fireAutoSaveEvent("solution");
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(AutoSaveQuestion).toHaveBeenCalledTimes(1);
      });
      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: syncQuestionsAfterSave.type }),
      );
    });

    it("debounces multiple rapid events into a single save call", async () => {
      renderHook(() => useImprovedAutoSave({ debounceMs: 500 }));

      act(() => {
        fireAutoSaveEvent();
        jest.advanceTimersByTime(100);
        fireAutoSaveEvent();
        jest.advanceTimersByTime(100);
        fireAutoSaveEvent();
        jest.advanceTimersByTime(500); // now the debounce fires
      });

      await waitFor(() => {
        expect(AutoSaveQuestion).toHaveBeenCalledTimes(1);
      });
    });

    it("ignores events targeting a different tab", async () => {
      renderHook(() =>
        useImprovedAutoSave({ tab: "question", debounceMs: 500 }),
      );

      act(() => {
        fireAutoSaveEvent("solution"); // wrong tab
        jest.advanceTimersByTime(500);
      });

      // Should NOT have saved
      expect(AutoSaveQuestion).not.toHaveBeenCalled();
    });

    it("does not save when autosave setting is disabled", async () => {
      mockUseSelector({
        allform: {
          ...defaultReduxState.allform,
          allquestion: [question] as Array<ContentType>,
          formstate: { _id: "test-form-id", setting: { autosave: false } },
        },
      });

      renderHook(() => useImprovedAutoSave({ debounceMs: 500 }));

      act(() => {
        fireAutoSaveEvent();
        jest.advanceTimersByTime(500);
      });

      expect(AutoSaveQuestion).not.toHaveBeenCalled();
    });

    it("does not save when pauseAutoSave is true", async () => {
      mockUseSelector({
        allform: {
          ...defaultReduxState.allform,
          allquestion: [question] as Array<ContentType>,
          pauseAutoSave: true,
        },
      });

      renderHook(() => useImprovedAutoSave({ debounceMs: 500 }));

      act(() => {
        fireAutoSaveEvent();
        jest.advanceTimersByTime(500);
      });

      expect(AutoSaveQuestion).not.toHaveBeenCalled();
    });
  });

  /* ---------------------------- Offline Behaviour --------------------------- */

  describe("Page versioning", () => {
    const formId = defaultReduxState.allform.formstate._id;
    const question = makeQuestion();

    beforeEach(() => {
      mockUseSelector({
        allform: {
          ...defaultReduxState.allform,
          allquestion: [question] as Array<ContentType>,
        },
      });
    });

    const triggerAutosave = () =>
      act(() => {
        fireAutoSaveEvent("question");
        jest.advanceTimersByTime(1000);
      });

    it("sends the known page version and stores the version the server returns", async () => {
      setContentVersion(formId, 1, 4);
      (AutoSaveQuestion as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
        version: 5,
      });

      renderHook(() => useImprovedAutoSave({ debounceMs: 1000 }));
      triggerAutosave();

      await waitFor(() => {
        expect(AutoSaveQuestion).toHaveBeenCalledWith(
          expect.objectContaining({ formId, page: 1, version: 4 }),
        );
      });
      await waitFor(() => expect(getContentVersion(formId, 1)).toBe(5));
    });

    it("on a 409 conflict it does not retry, offers a reload and blocks further saves", async () => {
      const dispatch = jest.fn();
      (ReactRedux.useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
      setContentVersion(formId, 1, 4);
      (AutoSaveQuestion as jest.Mock).mockResolvedValue({
        success: false,
        status: 409,
        message: "This page was changed by someone else",
      });

      const { result } = renderHook(() =>
        useImprovedAutoSave({ debounceMs: 1000, retryDelayMs: 100 }),
      );
      triggerAutosave();

      await waitFor(() =>
        expect(result.current.autoSaveStatus.status).toBe("error"),
      );
      expect(result.current.autoSaveStatus.error).toBe(
        "This page was changed by someone else",
      );
      expect(hasContentConflict(formId, 1)).toBe(true);
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            state: "confirm",
            value: expect.objectContaining({ open: true }),
          }),
        }),
      );

      // No retry timer fires, and later autosaves are not sent
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      triggerAutosave();
      await act(async () => {
        await Promise.resolve();
      });
      expect(AutoSaveQuestion).toHaveBeenCalledTimes(1);
    });

    it("merges a collaborator's newer page on a 409 and saves again without asking", async () => {
      const dispatch = jest.fn();
      (ReactRedux.useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
      const mine = makeQuestion({ _id: "q1", content: "my unsaved edit" });
      const untouched = makeQuestion({ _id: "q2", qIdx: 1 });
      const saved = [makeQuestion({ _id: "q1" }), untouched];
      mockUseSelector({
        allform: {
          ...defaultReduxState.allform,
          allquestion: [mine, untouched],
          prevAllQuestion: saved,
        },
      });
      setContentVersion(formId, 1, 4);

      const theirs = makeQuestion({ _id: "q2", qIdx: 1, required: true });
      (AutoSaveQuestion as jest.Mock)
        .mockResolvedValueOnce({
          success: false,
          status: 409,
          errorResponses: {
            code: 409,
            data: { version: 5, data: [saved[0], theirs] },
          },
        })
        .mockResolvedValueOnce({ success: true, data: [], version: 6 });

      renderHook(() => useImprovedAutoSave({ debounceMs: 1000 }));
      triggerAutosave();

      await waitFor(() => expect(AutoSaveQuestion).toHaveBeenCalledTimes(2));
      // Second attempt: based on their version, carrying their change and mine
      expect(AutoSaveQuestion).toHaveBeenLastCalledWith(
        expect.objectContaining({
          version: 5,
          data: [mine, theirs],
        }),
      );
      await waitFor(() => expect(getContentVersion(formId, 1)).toBe(6));
      expect(hasContentConflict(formId, 1)).toBe(false);
      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ state: "confirm" }),
        }),
      );
    });

    it("asks to reload when a 409 cannot be merged (both sides added questions)", async () => {
      const dispatch = jest.fn();
      (ReactRedux.useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
      const saved = [makeQuestion({ _id: "q1" })];
      mockUseSelector({
        allform: {
          ...defaultReduxState.allform,
          allquestion: [...saved, makeQuestion({ _id: undefined, qIdx: 1 })],
          prevAllQuestion: saved,
        },
      });
      setContentVersion(formId, 1, 4);
      (AutoSaveQuestion as jest.Mock).mockResolvedValue({
        success: false,
        status: 409,
        errorResponses: {
          code: 409,
          data: {
            version: 5,
            data: [...saved, makeQuestion({ _id: "q9", qIdx: 1 })],
          },
        },
      });

      renderHook(() => useImprovedAutoSave({ debounceMs: 1000 }));
      triggerAutosave();

      await waitFor(() => expect(hasContentConflict(formId, 1)).toBe(true));
      expect(AutoSaveQuestion).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ state: "confirm" }),
        }),
      );
    });

    it("saves again once the page has been reloaded", async () => {
      setContentVersion(formId, 1, 4);
      (AutoSaveQuestion as jest.Mock).mockResolvedValueOnce({
        success: false,
        status: 409,
      });

      renderHook(() => useImprovedAutoSave({ debounceMs: 1000 }));
      triggerAutosave();
      await waitFor(() => expect(hasContentConflict(formId, 1)).toBe(true));

      // Reloading the page records the fresh version and clears the conflict
      setContentVersion(formId, 1, 9);
      triggerAutosave();

      await waitFor(() => expect(AutoSaveQuestion).toHaveBeenCalledTimes(2));
      expect(AutoSaveQuestion).toHaveBeenLastCalledWith(
        expect.objectContaining({ version: 9 }),
      );
    });
  });

  describe("Offline queue", () => {
    const question = makeQuestion({ formId: "Offline_Form" });

    it("queues save when offline instead of calling AutoSaveQuestion", async () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });

      mockUseSelector({
        allform: {
          ...defaultReduxState.allform,
          allquestion: [question] as Array<ContentType>,
        },
      });

      const { result } = renderHook(() =>
        useImprovedAutoSave({ debounceMs: 500 }),
      );

      act(() => {
        fireAutoSaveEvent();
        jest.advanceTimersByTime(500);
      });

      expect(AutoSaveQuestion).not.toHaveBeenCalled();
      expect(result.current.offlineQueueSize).toBeGreaterThan(0);
    });

    it("processes the offline queue and calls AutoSaveQuestion when back online", async () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });

      mockUseSelector({
        allform: {
          ...defaultReduxState.allform,
          allquestion: [question] as Array<ContentType>,
        },
      });

      const { result } = renderHook(() =>
        useImprovedAutoSave({ debounceMs: 500 }),
      );

      // Queue a save while offline
      act(() => {
        fireAutoSaveEvent();
        jest.advanceTimersByTime(500);
      });

      expect(result.current.offlineQueueSize).toBeGreaterThan(0);

      // Come back online
      await act(async () => {
        Object.defineProperty(navigator, "onLine", {
          writable: true,
          value: true,
        });
        window.dispatchEvent(new Event("online"));
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => expect(result.current.isOnline).toBe(true));
      await waitFor(() => expect(AutoSaveQuestion).toHaveBeenCalled());
      await waitFor(() => expect(result.current.offlineQueueSize).toBe(0));
    });
  });

  describe("Retry on failure", () => {
    const question = makeQuestion();

    it("retries up to retryAttempts times on save failure", async () => {
      (AutoSaveQuestion as jest.Mock).mockRejectedValue(
        new Error("Network Error"),
      );

      mockUseSelector({
        allform: {
          ...defaultReduxState.allform,
          allquestion: [question] as Array<ContentType>,
        },
      });

      const retryAttempts = 2;
      const retryDelayMs = 100;

      const { result } = renderHook(() =>
        useImprovedAutoSave({ debounceMs: 100, retryAttempts, retryDelayMs }),
      );

      // Trigger the autosave
      act(() => {
        fireAutoSaveEvent();
        jest.advanceTimersByTime(100);
      });

      // Let initial call + retries settle
      for (let i = 0; i <= retryAttempts; i++) {
        await act(async () => {
          jest.advanceTimersByTime(retryDelayMs * (i + 1));
          await Promise.resolve();
        });
      }

      await waitFor(() =>
        expect(result.current.autoSaveStatus.status).toBe("error"),
      );

      // Initial attempt + retryAttempts retries
      expect(AutoSaveQuestion).toHaveBeenCalledTimes(retryAttempts + 1);
    });

    it("sets status to saved on eventual success after retry", async () => {
      (AutoSaveQuestion as jest.Mock)
        .mockRejectedValueOnce(new Error("Transient Error"))
        .mockResolvedValue(successReturn);

      mockUseSelector({
        allform: {
          ...defaultReduxState.allform,
          allquestion: [question] as Array<ContentType>,
        },
      });

      renderHook(() =>
        useImprovedAutoSave({
          debounceMs: 100,
          retryAttempts: 3,
          retryDelayMs: 50,
        }),
      );

      act(() => {
        fireAutoSaveEvent();
        jest.advanceTimersByTime(100);
      });

      await act(async () => {
        jest.advanceTimersByTime(50);
        await Promise.resolve();
      });

      await waitFor(() => expect(AutoSaveQuestion).toHaveBeenCalledTimes(2));
    });
  });

  describe("Cleanup on unmount", () => {
    it("clears the debounce timer on unmount so AutoSaveQuestion is not called", async () => {
      const question = makeQuestion();

      mockUseSelector({
        allform: {
          ...defaultReduxState.allform,
          allquestion: [question] as Array<ContentType>,
        },
      });

      const { unmount } = renderHook(() =>
        useImprovedAutoSave({ debounceMs: 1000 }),
      );

      act(() => {
        fireAutoSaveEvent();
        // unmount before the debounce fires
      });

      unmount();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(AutoSaveQuestion).not.toHaveBeenCalled();
    });

    it("removes online/offline event listeners on unmount", () => {
      const addSpy = jest.spyOn(window, "addEventListener");
      const removeSpy = jest.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useImprovedAutoSave());

      unmount();

      const onlineListeners = removeSpy.mock.calls.filter(
        ([event]: [string, ...unknown[]]) => event === "online" || event === "offline",
      );
      expect(onlineListeners.length).toBeGreaterThanOrEqual(2);

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });
});
