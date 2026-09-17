import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useResponseScoring } from "../hooks/useResponseScoring";
import ApiRequest from "../hooks/APIHook/ApiHook";
import SuccessToast, { ErrorToast } from "../component/Modal/AlertModal";
import {
  ResponseDataType,
  ScoringMethod,
} from "../component/Response/Response.type";
import { ContentType, QuestionType } from "../types/Form.types";

const mockQuestion: ContentType = {
  _id: "q1",
  qIdx: 0,
  formId: "form-1",
  type: QuestionType.ShortAnswer,
  page: 1,
};

const mockResponseData: ResponseDataType = {
  _id: "resp-1",
  formId: "form-1",
  scoringMethod: ScoringMethod.AUTO,
  responseset: [
    {
      _id: "set-1",
      question: mockQuestion,
      response: "Sample answer",
      score: 5,
    },
  ],
  totalScore: 5,
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useResponseScoring", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("returns initial state correctly", () => {
    const { result } = renderHook(
      () =>
        useResponseScoring({
          responseId: "resp-1",
          formId: "form-1",
          selectedResponse: mockResponseData,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.pendingScores).toEqual({});
    expect(result.current.isSavingScores).toBe(false);
  });

  describe("handleQuestionScoreUpdate", () => {
    test("sets pending score, updates unsaved changes flag, and debounces mutation", async () => {
      (ApiRequest as jest.Mock).mockResolvedValue({
        success: true,
        data: { updated: true },
      });

      const { result } = renderHook(
        () =>
          useResponseScoring({
            responseId: "resp-1",
            formId: "form-1",
            selectedResponse: mockResponseData,
          }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.handleQuestionScoreUpdate("q1", 10, "Great answer");
      });

      expect(result.current.hasUnsavedChanges).toBe(true);
      expect(result.current.pendingScores).toEqual({ q1: 10 });

      // Before timer finishes, mutation should not be called yet
      expect(ApiRequest).not.toHaveBeenCalled();

      // Fast-forward past 1500ms debounce
      await act(async () => {
        jest.advanceTimersByTime(1500);
      });

      expect(ApiRequest).toHaveBeenCalledWith({
        url: "/response/update-score",
        method: "PUT",
        data: {
          responseId: "resp-1",
          scores: [{ questionId: "q1", score: 10, comment: "Great answer" }],
        },
        cookie: true,
      });

      // After mutation succeeds, pending score should be cleared
      await waitFor(() => {
        expect(result.current.pendingScores).toEqual({});
        expect(result.current.hasUnsavedChanges).toBe(false);
      });
    });

    test("resets debounce timer on rapid successive score updates", async () => {
      (ApiRequest as jest.Mock).mockResolvedValue({
        success: true,
        data: { updated: true },
      });

      const { result } = renderHook(
        () =>
          useResponseScoring({
            responseId: "resp-1",
            formId: "form-1",
            selectedResponse: mockResponseData,
          }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.handleQuestionScoreUpdate("q1", 4);
      });
      // Advance by 1000ms (less than 1500ms debounce)
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Update score again before previous debounce timer elapsed
      act(() => {
        result.current.handleQuestionScoreUpdate("q1", 8);
      });

      expect(ApiRequest).not.toHaveBeenCalled();

      // Advance by another 1000ms (previous timer would have elapsed, but was reset)
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(ApiRequest).not.toHaveBeenCalled();

      // Advance past remaining 500ms
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      expect(ApiRequest).toHaveBeenCalledTimes(1);
      expect(ApiRequest).toHaveBeenCalledWith({
        url: "/response/update-score",
        method: "PUT",
        data: {
          responseId: "resp-1",
          scores: [{ questionId: "q1", score: 8, comment: undefined }],
        },
        cookie: true,
      });
    });

    test("does not update scores if responseId is missing", () => {
      const { result } = renderHook(
        () =>
          useResponseScoring({
            responseId: undefined,
            formId: "form-1",
          }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.handleQuestionScoreUpdate("q1", 5);
      });

      expect(result.current.pendingScores).toEqual({});
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    test("shows error toast when mutation fails", async () => {
      (ApiRequest as jest.Mock).mockResolvedValue({
        success: false,
        message: "Failed to update score in database",
      });

      const { result } = renderHook(
        () =>
          useResponseScoring({
            responseId: "resp-1",
            formId: "form-1",
            selectedResponse: mockResponseData,
          }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.handleQuestionScoreUpdate("q1", 15);
      });

      await act(async () => {
        jest.advanceTimersByTime(1500);
      });

      await waitFor(() => {
        expect(ErrorToast).toHaveBeenCalledWith({
          title: "Error",
          content: "Failed to update score in database",
        });
      });
    });
  });

  describe("handleSaveAllScores", () => {
    test("shows success toast when there are no pending scores to save", async () => {
      const { result } = renderHook(
        () =>
          useResponseScoring({
            responseId: "resp-1",
            formId: "form-1",
            selectedResponse: mockResponseData,
          }),
        { wrapper: createWrapper() },
      );

      await act(async () => {
        await result.current.handleSaveAllScores();
      });

      expect(SuccessToast).toHaveBeenCalledWith({
        title: "Success",
        content: "All scores are already saved",
      });
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(ApiRequest).not.toHaveBeenCalled();
    });

    test("returns early if responseId or selectedResponse is missing", async () => {
      const { result } = renderHook(
        () =>
          useResponseScoring({
            responseId: undefined,
            selectedResponse: undefined,
          }),
        { wrapper: createWrapper() },
      );

      await act(async () => {
        await result.current.handleSaveAllScores();
      });

      expect(ApiRequest).not.toHaveBeenCalled();
      expect(SuccessToast).not.toHaveBeenCalled();
    });

    test("batch saves all pending scores successfully", async () => {
      (ApiRequest as jest.Mock).mockResolvedValue({
        success: true,
        data: { saved: true },
      });

      const { result } = renderHook(
        () =>
          useResponseScoring({
            responseId: "resp-1",
            formId: "form-1",
            selectedResponse: mockResponseData,
          }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.handleQuestionScoreUpdate("q1", 10);
        result.current.handleQuestionScoreUpdate("q2", 20);
      });

      expect(result.current.hasUnsavedChanges).toBe(true);

      await act(async () => {
        await result.current.handleSaveAllScores();
      });

      expect(ApiRequest).toHaveBeenCalledWith({
        url: "/response/update-score",
        method: "PUT",
        data: {
          responseId: "resp-1",
          scores: [
            { questionId: "q1", score: 10 },
            { questionId: "q2", score: 20 },
          ],
        },
        cookie: true,
      });

      expect(SuccessToast).toHaveBeenCalledWith({
        title: "Success",
        content: "All 2 score(s) saved successfully",
      });
      expect(result.current.pendingScores).toEqual({});
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    test("shows error toast when batch save API call fails", async () => {
      (ApiRequest as jest.Mock).mockResolvedValue({
        success: false,
        message: "Network timeout saving batch",
      });

      const { result } = renderHook(
        () =>
          useResponseScoring({
            responseId: "resp-1",
            formId: "form-1",
            selectedResponse: mockResponseData,
          }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.handleQuestionScoreUpdate("q1", 7);
      });

      await act(async () => {
        await result.current.handleSaveAllScores();
      });

      expect(ErrorToast).toHaveBeenCalledWith({
        title: "Error",
        content: "Network timeout saving batch",
      });
    });
  });

  test("cleans up debounce timers upon unmount", () => {
    const clearTimeoutSpy = jest.spyOn(window, "clearTimeout");

    const { result, unmount } = renderHook(
      () =>
        useResponseScoring({
          responseId: "resp-1",
          formId: "form-1",
          selectedResponse: mockResponseData,
        }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.handleQuestionScoreUpdate("q1", 9);
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
