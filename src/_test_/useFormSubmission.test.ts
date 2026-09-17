import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useFormSubmission,
  useSendResponseCopy,
} from "../component/Response/hooks/useFormSubmission";
import ApiRequest from "../hooks/APIHook/ApiHook";
import { ErrorToast } from "../component/Modal/AlertModal";
import { ContentType, FormTypeEnum, QuestionType } from "../types/Form.types";
import { FormResponse } from "../component/Response/hooks/useFormResponses";
import { deleteFormLocalStorage } from "../helperFunc";

jest.mock("../helperFunc", () => {
  const actual = jest.requireActual("../helperFunc");
  return {
    ...actual,
    deleteFormLocalStorage: jest.fn(),
  };
});

const mockQuestion: ContentType = {
  _id: "q1",
  qIdx: 0,
  formId: "form-1",
  type: QuestionType.ShortAnswer,
  page: 1,
  require: true,
};

const mockResponses: FormResponse[] = [
  {
    question: "q1",
    response: "Sample text response",
  },
];

const mockRespondentInfo = {
  respondentEmail: "student@example.com",
  respondentName: "Jane Doe",
  isGuest: false,
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

describe("useFormSubmission", () => {
  const mockCheckIfQuestionShouldShow = jest.fn(() => true);
  const mockValidateForm = jest.fn<
    string | null,
    [ContentType[], FormResponse[]]
  >(() => null);
  const mockClearProgressState = jest.fn();

  const defaultProps = {
    formId: "form-1",
    formType: FormTypeEnum.Normal,
    progressStorageKey: "form_form-1_progress",
    questions: [mockQuestion],
    responses: mockResponses,
    checkIfQuestionShouldShow: mockCheckIfQuestionShouldShow,
    validateForm: mockValidateForm,
    respondentInfo: mockRespondentInfo,
    clearProgressState: mockClearProgressState,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("returns initial state correctly", () => {
    const { result } = renderHook(() => useFormSubmission(defaultProps));

    expect(result.current.submitting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(false);
    expect(result.current.submissionResult).toBeNull();
  });

  describe("Validation and Parameters", () => {
    test("shows error toast when formId is missing", async () => {
      const { result } = renderHook(() =>
        useFormSubmission({
          ...defaultProps,
          formId: undefined,
        }),
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(ErrorToast).toHaveBeenCalledWith({
        toastid: "SubmitError",
        title: "Failed",
        content: "Missing Parameter",
      });
      expect(ApiRequest).not.toHaveBeenCalled();
    });

    test("shows error toast when progressStorageKey is missing", async () => {
      const { result } = renderHook(() =>
        useFormSubmission({
          ...defaultProps,
          progressStorageKey: null,
        }),
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(ErrorToast).toHaveBeenCalledWith({
        toastid: "SubmitError",
        title: "Failed",
        content: "Missing Parameter",
      });
      expect(ApiRequest).not.toHaveBeenCalled();
    });

    test("stops submission and sets error when validateForm fails", async () => {
      mockValidateForm.mockReturnValueOnce("Question 1 is required");

      const { result } = renderHook(() => useFormSubmission(defaultProps));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toBe("Question 1 is required");
      expect(result.current.success).toBe(false);
      expect(ApiRequest).not.toHaveBeenCalled();
    });

    test("stops submission when no visible questions are answered and at least one is required", async () => {
      const { result } = renderHook(() =>
        useFormSubmission({
          ...defaultProps,
          responses: [
            {
              question: "q1",
              response: "", // empty response
            },
          ],
        }),
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toBe(
        "Please fill out at least the required fields before submitting",
      );
      expect(ApiRequest).not.toHaveBeenCalled();
    });
  });

  describe("Submission Handling", () => {
    test("submits form successfully and cleans up progress state", async () => {
      const mockResultData = {
        maxScore: 100,
        totalScore: 85,
        message: "Submission successful",
        responseId: "resp-123",
        isComplete: true,
      };

      (ApiRequest as jest.Mock).mockResolvedValue({
        success: true,
        data: mockResultData,
      });

      // Populate progress in localStorage
      const savedProgress = {
        currentPage: 1,
        responses: mockResponses,
        startedAt: new Date(Date.now() - 60000).toISOString(), // 60s ago
      };
      localStorage.setItem(
        defaultProps.progressStorageKey,
        JSON.stringify(savedProgress),
      );

      const { result } = renderHook(() => useFormSubmission(defaultProps));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(ApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "response/submit-response/form-1",
          method: "POST",
          cookie: true,
          data: expect.objectContaining({
            responseSet: mockResponses,
            respondentEmail: "student@example.com",
            respondentName: "Jane Doe",
            isGuest: false,
            completionTime: expect.any(Number),
          }),
        }),
      );

      expect(result.current.success).toBe(true);
      expect(result.current.submitting).toBe(false);
      expect(result.current.submissionResult).toEqual(mockResultData);
      expect(mockClearProgressState).toHaveBeenCalled();
      expect(deleteFormLocalStorage).toHaveBeenCalledWith({
        formId: "form-1",
        userKey: "student@example.com",
      });
    });

    test("sets error when ApiRequest returns success: false", async () => {
      (ApiRequest as jest.Mock).mockResolvedValue({
        success: false,
        error: "Form closed for submissions",
      });

      const { result } = renderHook(() => useFormSubmission(defaultProps));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.success).toBe(false);
      expect(result.current.error).toBe("Form closed for submissions");
      expect(result.current.submitting).toBe(false);
      expect(mockClearProgressState).not.toHaveBeenCalled();
    });

    test("handles network exception during submission", async () => {
      (ApiRequest as jest.Mock).mockRejectedValue(new Error("Network Error"));

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { result } = renderHook(() => useFormSubmission(defaultProps));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.success).toBe(false);
      expect(result.current.error).toBe("Failed to submit form");
      expect(result.current.submitting).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe("useSendResponseCopy", () => {
    test("calls ApiRequest with responseId and recipientEmail", async () => {
      (ApiRequest as jest.Mock).mockResolvedValue({
        success: true,
        message: "Email sent",
      });

      const { result } = renderHook(
        () => useSendResponseCopy("resp-1", "recipient@example.com"),
        { wrapper: createWrapper() },
      );

      await act(async () => {
        await result.current.mutateAsync();
      });

      expect(ApiRequest).toHaveBeenCalledWith({
        method: "POST",
        url: "/response/send-card-email",
        data: {
          responseId: "resp-1",
          recipientEmail: "recipient@example.com",
        },
      });
    });
  });
});
