//Condition Validation Testing
//
//

import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { FormResponse } from "../component/Response";
import {
  GetFormStateResponseType,
  UseRespondentFormPaginationReturn,
} from "../component/Response/hooks/usePaginatedFormData";
import RespondentForm, { RespondentFormProps } from "../component/Response/RespondentForm";
import { RespondentInfoType, SaveProgressType } from "../component/Response/Response.type";
import { ContentType, FormTypeEnum, QuestionType } from "../types/Form.types";
import { localStorageMock, renderWithMockedSession } from "./__mocks__/helper";
import { SessionContextType } from "../context/SessionContext";
import { generateStorageKey } from "../helperFunc";

//Mocks

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => jest.fn(),
}));

jest.mock("../component/Response/hooks/useFormSubmission.ts", () => ({
  __esModule: true,
  useFormSubmission: jest.fn(() => {
    const [success, setSuccess] = React.useState(false);
    return {
      submitting: false,
      error: null,
      success,
      setSuccess,
      submissionResult: null,
      handleSubmit: jest.fn(),
    };
  }),
  useSendResponseCopy: jest.fn(() => ({
    mutateAsync: jest.fn().mockReturnThis(),
    mutate: jest.fn(),
    isPending: false,
  })),
}));

//Assign Mock localstorage
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

jest.mock("@heroui/ripple", () => ({
  __esModule: true,
  Ripple: () => null,
  useRipple: () => ({
    ripples: [],
    onClear: jest.fn(),
    onPress: jest.fn(),
  }),
}));

jest.mock("../component/Response/hooks/useFormResponses.ts", () => ({
  __esModule: true,
  useFormResponses: () => ({
    responses: [],
    updateResponse: jest.fn(),
    checkIfQuestionShouldShow: jest.fn().mockReturnValue(false),
  }),
}));

//Sample Const
//
const globalFormId = "uniqueFormId";
const sampleQuestionsData: Array<ContentType> = [
  {
    _id: "q1",
    qIdx: 0,
    formId: globalFormId,
    title: "Question1",
    type: QuestionType.CheckBox,
    checkbox: [
      {
        content: "opt1",
        idx: 0,
      },
      {
        content: "opt2",
        idx: 1,
      },
    ],
    answer: {
      isCorrect: true,
      answer: 1,
    },
  },
  {
    _id: "q2",
    qIdx: 1,
    formId: globalFormId,
    title: "Question2",
    type: QuestionType.RangeDate,
    rangedate: {
      start: "2026-11-02",
      end: "2026-11-30",
    },
    answer: {
      isCorrect: true,
      answer: {
        start: "2026-11-13",
        end: "2026-11-20",
      },
    },
  },

  //Condition Question mock ,
  {
    _id: "q3",
    qIdx: 2,
    formId: globalFormId,
    title: "Condition Question 1",
    type: QuestionType.MultipleChoice,
    multiple: [
      {
        content: "cOpt1",
        idx: 0,
      },
      {
        content: "cOpt2",
        idx: 1,
      },
    ],
    conditional: [
      { contentId: "q4", contentIdx: 3, key: 1 },
      {
        contentId: "q5",
        contentIdx: 4,
        key: 0,
      },
    ],
  },
  {
    _id: "q4",
    qIdx: 3,
    formId: globalFormId,
    title: "Child Question 1",
    type: QuestionType.ShortAnswer,
    answer: {
      isCorrect: true,
      answer: "shortanswer",
    },
    parentcontent: {
      qId: "q3",
      qIdx: 2,
      optIdx: 1,
    },
  },
  {
    _id: "q5",
    qIdx: 4,
    formId: globalFormId,
    title: "Child Question 2",
    type: QuestionType.Date,
    date: "2026-12-12",
    answer: {
      isCorrect: true,
      answer: "2026-11-12",
    },
    parentcontent: {
      qId: "q3",
      qIdx: 2,
      optIdx: 0,
    },
  },

  //Page 2 questions
  {
    _id: "q6",
    qIdx: 5,
    formId: globalFormId,
    title: "Question 1 page 2",
    type: QuestionType.RangeNumber,
    page: 2,
    rangenumber: {
      start: 10,
      end: 20,
    },
  },
];

const sampleResponse: Array<FormResponse> = [
  {
    question: "q1",
    response: new Date(),
  },
  { question: "q2", response: 3 },
  { question: "q3", response: "Gaeho yaho" },
];

const formSessionInfoSample: RespondentInfoType = {
  respondentEmail: "testUser@example.com",
  respondentName: "testUser",
};

const SampleFormData: GetFormStateResponseType = {
  _id: globalFormId,
  type: FormTypeEnum.Quiz,
  title: "TestQuizForm",
  totalpage: 1,
  contentIds: sampleQuestionsData.map((i) => i._id as string),
  contents: sampleQuestionsData,
};

const SampleStorageData: SaveProgressType = {
  currentPage: 1,
  responses: [],
  respondentInfo: formSessionInfoSample,
  timestamp: new Date().toISOString(),
  formId: "uniqueFormId",
  version: "1.0",
  startedAt: new Date().toISOString(),
};

const UseRespondentFormPaginationReturnSampleData: UseRespondentFormPaginationReturn = {
  isFetching: false,
  handlePage: jest.fn() as never,
  formState: SampleFormData,
  currentPage: 1,
  goToPage: jest.fn() as never,
  error: null,
  totalPages: 1,
  canGoNext: undefined,
  canGoPrev: undefined,
};

/*
 * Respondent Form Tests
 * [] Error Cases
 *  [] If exist of formError the error alert need to be render
 *  [] If no formdata return null
 *  [] If AccessMode is not authenticated it should not be render
 * */

//Mock Fake Timers
jest.useFakeTimers();
jest.spyOn(window, "setTimeout");

describe("Respondent Component Tests", () => {
  let respondentParam: RespondentFormProps;
  let mockedSessionConext: SessionContextType;
  let testStorageKey: string;
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSessionConext = {
      checkSession: jest.fn().mockResolvedValue(true),
      isChecking: false,
      lastCheckSuccess: null,
      onSessionExpired: jest.fn(),
    };
    testStorageKey = generateStorageKey({
      suffix: "progress",
      formId: globalFormId,
      userKey: formSessionInfoSample.respondentEmail,
    });

    respondentParam = {
      userId: "uniqueUserId",
      data: UseRespondentFormPaginationReturnSampleData,
      formSessionInfo: formSessionInfoSample,
      accessMode: "authenticated",
      isUserActive: true,
      isLoading: false,
      isPreview: false,
    };
  });
  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("Respondent component error test", () => {
    test("Render Erorr Alert if FormError exist", () => {
      respondentParam = {
        ...respondentParam,
        data: {
          ...UseRespondentFormPaginationReturnSampleData,
          error: Error("Error Loading Form"),
        },
      };

      render(React.createElement(RespondentForm, respondentParam));
      expect(screen.getByTestId("erroralert")).toBeInTheDocument();
      expect(screen.getByText("Error Loading Form")).toBeInTheDocument();
    });
    test("Render Error Alert if formState is undefined", () => {
      respondentParam = {
        ...respondentParam,
        data: undefined,
      } as never;
      render(React.createElement(RespondentForm, respondentParam));
      expect(screen.getByTestId("erroralert")).toBeInTheDocument();
    });
  });
  describe("Respondent component locatstorage progression test", () => {
    test("Should set initial storage data when successfull loaded the form", async () => {
      await act(async () => {
        renderWithMockedSession(RespondentForm as never, respondentParam, mockedSessionConext);
      });

      const cuurentstorageKey = generateStorageKey({
        suffix: "progress",
        formId: globalFormId,
        userKey: formSessionInfoSample.respondentEmail,
      });

      // Advance through initial 50ms loadProgress timeout
      act(() => {
        jest.advanceTimersByTime(50);
      });

      // Advance through 1000ms debounced auto-save timeout
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(cuurentstorageKey, expect.any(String));
      expect(localStorageMock.getItem(cuurentstorageKey)).toBeDefined();
    });

    test("Should trigger check sessiton & save to stroage when switch page", async () => {
      respondentParam = {
        ...respondentParam,
        data: {
          ...respondentParam.data,
          totalPages: 2,
          canGoNext: true,
        },
      };
      await act(async () => {
        renderWithMockedSession(RespondentForm as never, respondentParam, mockedSessionConext);
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const nextPageBtn = await screen.findByRole("button", { name: /Next/i }, { timeout: 2000 });
      await act(async () => {
        fireEvent.click(nextPageBtn);
      });

      expect(mockedSessionConext.checkSession).toHaveBeenCalled();

      const storageItem = localStorageMock.getItem(testStorageKey) as string;

      expect(storageItem).toBeDefined();

      const convertedItem = JSON.parse(storageItem) as SaveProgressType;

      expect(convertedItem.currentPage).toBe(2);
    });

    test("Should save progress on debounced", async () => {
      localStorageMock.clear();
      const baseTime = new Date("2026-09-16T10:00:00.000Z");
      jest.setSystemTime(baseTime);

      await act(async () => {
        renderWithMockedSession(RespondentForm as never, respondentParam, mockedSessionConext);
      });

      // 1. Initial 50ms to load progress
      act(() => {
        jest.advanceTimersByTime(50);
      });

      // 2. Advance 500ms (debounce in progress, should NOT have saved yet)
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(localStorageMock.getItem(testStorageKey)).toBeNull();

      // 3. Advance remaining 500ms (total 1000ms debounce completed)
      act(() => {
        jest.advanceTimersByTime(500);
      });

      const storageItem = localStorageMock.getItem(testStorageKey) as string;
      expect(storageItem).not.toBeNull();

      const parsed = JSON.parse(storageItem) as SaveProgressType;
      expect(parsed.formId).toBe(globalFormId);
      expect(parsed.currentPage).toBe(1);

      // Verify the timestamp is updated by 1000ms debounce (plus the initial 50ms)
      const expectedTime = new Date(baseTime.getTime() + 1050).toISOString();
      expect(parsed.timestamp).toBe(expectedTime);
    });

    test("Should restore saved progress and navigate to stored currentPage on mount", async () => {
      localStorageMock.clear();
      const savedProgress: SaveProgressType = {
        currentPage: 2,
        responses: [{ question: "q1", response: 1 }],
        respondentInfo: formSessionInfoSample,
        timestamp: new Date().toISOString(),
        formId: globalFormId,
        version: "1.0",
        startedAt: new Date().toISOString(),
      };
      localStorageMock.setItem(testStorageKey, JSON.stringify(savedProgress));

      const mockGoToPage = jest.fn();
      respondentParam = {
        ...respondentParam,
        data: {
          ...respondentParam.data,
          totalPages: 2,
          currentPage: 1,
          goToPage: mockGoToPage,
        },
      };

      await act(async () => {
        renderWithMockedSession(RespondentForm as never, respondentParam, mockedSessionConext);
      });

      // Advance through 50ms initial load and 100ms goToPage delay in useProgressStorage
      act(() => {
        jest.advanceTimersByTime(150);
      });

      expect(mockGoToPage).toHaveBeenCalledWith(2);
    });

    test("Should display Preview Mode notice and not persist progress to localStorage", async () => {
      localStorageMock.clear();
      respondentParam = {
        ...respondentParam,
        isPreview: true,
      };

      await act(async () => {
        renderWithMockedSession(RespondentForm as never, respondentParam, mockedSessionConext);
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(
        screen.getByText("Preview Mode — Answers are not saved to localStorage"),
      ).toBeInTheDocument();
      expect(localStorageMock.getItem(testStorageKey)).toBeNull();
    });
  });

  describe("Form session testing", () => {
    test("When is closed navigation should be securely locked", async () => {
      localStorageMock.clear();
      // closed form
      respondentParam = {
        ...respondentParam,
        data: {
          ...respondentParam.data,
          totalPages: 2,
          canGoNext: true,
          canGoPrev: true,
          formState: {
            ...respondentParam.data.formState,
            setting: {
              ...(respondentParam.data.formState?.setting ?? {}),
              acceptResponses: false,
            },
          } as never,
        },
      };

      await act(async () => {
        renderWithMockedSession(RespondentForm as never, respondentParam, mockedSessionConext);
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByText("Form Closed")).toBeInTheDocument();
      expect(screen.getByText("This form is no longer accepting responses.")).toBeInTheDocument();
      expect(screen.getByText(/The form owner has disabled new submissions/i)).toBeInTheDocument();

      expect(screen.queryByRole("button", { name: /Next/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Previous/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Submit/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Go to page/i })).not.toBeInTheDocument();

      expect(screen.queryByText("Question1")).not.toBeInTheDocument();
      expect(screen.queryByText("Question2")).not.toBeInTheDocument();

      expect(respondentParam.data.handlePage).not.toHaveBeenCalled();
      expect(respondentParam.data.goToPage).not.toHaveBeenCalled();
    });

    test("Should block navigation and progress saving when user session is expired", async () => {
      localStorageMock.clear();
      // Configure checkSession to return false (session expired)
      mockedSessionConext.checkSession = jest.fn().mockResolvedValue(false);

      respondentParam = {
        ...respondentParam,
        data: {
          ...respondentParam.data,
          totalPages: 2,
          canGoNext: true,
          handlePage: jest.fn(),
          goToPage: jest.fn(),
        },
      };

      await act(async () => {
        renderWithMockedSession(RespondentForm as never, respondentParam, mockedSessionConext);
      });

      // Advance through initial 50ms loadProgress and 1000ms debounce
      act(() => {
        jest.advanceTimersByTime(1050);
      });

      const nextPageBtn = await screen.findByRole("button", { name: /Next/i }, { timeout: 2000 });
      await act(async () => {
        fireEvent.click(nextPageBtn);
      });

      // 1. checkSession was called to verify session status
      expect(mockedSessionConext.checkSession).toHaveBeenCalled();

      // 2. Navigation handlers were NOT called
      expect(respondentParam.data.handlePage).not.toHaveBeenCalled();
      expect(respondentParam.data.goToPage).not.toHaveBeenCalled();

      // 3. Stored progress in localStorage should not have advanced to page 2
      const storageKey = generateStorageKey({
        suffix: "progress",
        formId: globalFormId,
        userKey: formSessionInfoSample.respondentEmail,
      });
      const storageItem = localStorageMock.getItem(storageKey);
      if (storageItem) {
        const parsed = JSON.parse(storageItem) as SaveProgressType;
        expect(parsed.currentPage).toBe(1);
      }
    });

    test("Should display inactive warning and pause progress auto-saving when isUserActive is false", async () => {
      localStorageMock.clear();
      respondentParam = {
        ...respondentParam,
        isUserActive: false,
        accessMode: "authenticated",
      };

      await act(async () => {
        renderWithMockedSession(RespondentForm as never, respondentParam, mockedSessionConext);
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // 1. Verify inactive session banner
      expect(screen.getByText("Session Inactive")).toBeInTheDocument();
      expect(
        screen.getByText("Your progress is not being saved. Please reactivate your session to continue."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Progress saving is paused due to inactive session"),
      ).toBeInTheDocument();

      // 2. Verify auto-save is paused (not written to storage)
      expect(localStorageMock.getItem(testStorageKey)).toBeNull();
    });

    test("Should navigate to previous page and decrement currentPage when clicking Previous", async () => {
      respondentParam = {
        ...respondentParam,
        data: {
          ...respondentParam.data,
          currentPage: 2,
          totalPages: 2,
          canGoPrev: true,
          handlePage: jest.fn(),
        },
      };

      await act(async () => {
        renderWithMockedSession(RespondentForm as never, respondentParam, mockedSessionConext);
      });

      act(() => {
        jest.advanceTimersByTime(1050);
      });

      const prevPageBtn = await screen.findByRole("button", { name: /Go to previous page/i }, { timeout: 2000 });
      await act(async () => {
        fireEvent.click(prevPageBtn);
      });

      expect(mockedSessionConext.checkSession).toHaveBeenCalled();
      expect(respondentParam.data.handlePage).toHaveBeenCalledWith("prev");

      const storageItem = localStorageMock.getItem(testStorageKey) as string;
      expect(storageItem).toBeDefined();
      const parsed = JSON.parse(storageItem) as SaveProgressType;
      expect(parsed.currentPage).toBe(1);
    });

    test("Should render SubmissionSuccessView when submitonce is enabled and user already responded", async () => {
      respondentParam = {
        ...respondentParam,
        data: {
          ...respondentParam.data,
          formState: {
            ...respondentParam.data.formState,
            setting: {
              ...(respondentParam.data.formState?.setting ?? {}),
              submitonce: true,
            },
            isResponsed: {
              responseId: "resp-submitted-123",
              respondentEmail: formSessionInfoSample.respondentEmail,
            } as never,
          } as never,
        },
      };

      await act(async () => {
        renderWithMockedSession(RespondentForm as never, respondentParam, mockedSessionConext);
      });

      expect(await screen.findByText("Submitted Successfully!")).toBeInTheDocument();
      expect(screen.getByText(/Thank you for your response/i)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Next/i })).not.toBeInTheDocument();
      expect(screen.queryByText("Question1")).not.toBeInTheDocument();
    });
  });

  describe("Preview Mode (isPreview) Testing", () => {
    test("Should enable preview mode when formState.isPreview is true", async () => {
      localStorageMock.clear();
      respondentParam = {
        ...respondentParam,
        isPreview: false,
        data: {
          ...respondentParam.data,
          formState: {
            ...respondentParam.data.formState,
            isPreview: true,
          } as never,
        },
      };

      await act(async () => {
        renderWithMockedSession(RespondentForm as never, respondentParam, mockedSessionConext);
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(
        screen.getByText("Preview Mode — Answers are not saved to localStorage"),
      ).toBeInTheDocument();
      expect(localStorageMock.getItem(testStorageKey)).toBeNull();
    });

    test("Should not restore existing localStorage data on mount when in preview mode", async () => {
      localStorageMock.clear();
      // Pre-populate storage with existing user progress
      const savedProgress: SaveProgressType = {
        currentPage: 2,
        responses: [{ question: "q1", response: 1 }],
        respondentInfo: formSessionInfoSample,
        timestamp: new Date().toISOString(),
        formId: globalFormId,
        version: "1.0",
        startedAt: new Date().toISOString(),
      };
      localStorageMock.setItem(testStorageKey, JSON.stringify(savedProgress));

      const mockGoToPage = jest.fn();
      respondentParam = {
        ...respondentParam,
        isPreview: true,
        data: {
          ...respondentParam.data,
          totalPages: 2,
          currentPage: 1,
          goToPage: mockGoToPage,
        },
      };

      await act(async () => {
        renderWithMockedSession(RespondentForm as never, respondentParam, mockedSessionConext);
      });

      // Advance timers past any mount load delays
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // goToPage must NOT have been called because preview mode ignores storage
      expect(mockGoToPage).not.toHaveBeenCalled();
    });

    test("Should allow page navigation in preview mode without saving progress to localStorage", async () => {
      localStorageMock.clear();
      respondentParam = {
        ...respondentParam,
        isPreview: true,
        data: {
          ...respondentParam.data,
          totalPages: 2,
          currentPage: 1,
          canGoNext: true,
          handlePage: jest.fn(),
        },
      };

      await act(async () => {
        renderWithMockedSession(RespondentForm as never, respondentParam, mockedSessionConext);
      });

      const nextPageBtn = await screen.findByRole("button", { name: /Next/i }, { timeout: 2000 });
      await act(async () => {
        fireEvent.click(nextPageBtn);
      });

      // Navigation succeeds in preview
      expect(respondentParam.data.handlePage).toHaveBeenCalledWith("next");
      // But localStorage remains untouched
      expect(localStorageMock.getItem(testStorageKey)).toBeNull();
    });
  });
});
