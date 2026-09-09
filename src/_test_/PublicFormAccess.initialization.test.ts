import { renderHook } from "@testing-library/react";
import { RespondentInfoType } from "../component/Response/Response.type";
import { ROLE, UserType } from "../types/User.types";
import { localStorageMock } from "./__mocks__/helper";
import useFormInitialization from "../component/Response/hooks/useFormInitialization";
import { FormAction } from "../component/Response/types/PublicFormAccessTypes";
import { useQuery } from "@tanstack/react-query";

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
    ({ suffix, userKey, formId }) => `${formId}_${userKey}_${suffix}`,
  ),
  cleanupUnrelatedLocalStorage: jest.fn(),
  saveFormSateToLocalStorage: jest.fn(),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

//Mock localstorage
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

//Mock dispatch
const mockedDispatch = jest.fn() as React.ActionDispatch<[action: FormAction]>;

/**
 * [x] Error Case
 *  [x] invalid params
 *  [x] invalid return data
 *  [x] error parsing JSON
 * [x] Logic CASE
 *  [x] Default the form session should be set if no formsession exist.
 *  [x] if data is successfully verified it should set correct data in the local storage
 *  [x] if error occured in the proccess of set it should remove the data back.
 */

describe("useFormInitialization Hook Test", () => {
  let RespondentSessionMock: RespondentInfoType | undefined = undefined;
  let SampleUserTest: UserType | undefined = undefined;

  beforeAll(() => {
    SampleUserTest = {
      email: "test@example.com",
      role: ROLE.USER,
      password: "password1234",
    };
    RespondentSessionMock = {
      respondentEmail: SampleUserTest.email,
      respondentName: "TestUser",
      expiresAt: new Date("2026-09-10T14:30:00Z"), //1 day
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe("Error handle", () => {
    test("Initialized should be true if form is undefined", () => {
      (useQuery as unknown as jest.Mock).mockReturnValue({
        data: undefined,
        error: null,
        isPending: false,
        isLoading: false,
      });
      const formIni = renderHook(() =>
        useFormInitialization({ formId: undefined, dispatch: mockedDispatch }),
      );

      expect(formIni.result.current.isInitializing).toBe(false);
      expect(formIni.result.current.isInitialized).toBe(true);
      expect(formIni.result.current.sessionData).not.toBeDefined();
    });

    test("error sessionVerification isInitialized should be true and sessionVerificationError should be defined", () => {
      (useQuery as unknown as jest.Mock).mockReturnValue({
        error: new Error("Error occued"),
        isPending: false,
      });

      const formIni = renderHook(() =>
        useFormInitialization({
          formId: "UniqueForm",
          dispatch: mockedDispatch,
        }),
      );

      expect(formIni.result.current.isInitializing).toBe(false);
      expect(formIni.result.current.isInitialized).toBe(true);
      expect(formIni.result.current.sessionData).not.toBeDefined();
      expect(formIni.result.current.sessionVerificationError).toBeDefined();
    });
    test("parse json error should be handle", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const formId = "uniqueForm";
      const key = `${formId}_${RespondentSessionMock?.respondentEmail}_state`;

      localStorage.setItem(key, "invalid-json-string{");

      (useQuery as unknown as jest.Mock).mockReturnValue({
        data: { data: RespondentSessionMock },
        isPending: false,
        isLoading: false,
      });

      const formIni = renderHook(() =>
        useFormInitialization({
          formId,
          dispatch: mockedDispatch,
        }),
      );

      expect(localStorage.removeItem).toHaveBeenCalledWith(key);
      expect(localStorage.getItem(key)).toBeNull();
      expect(mockedDispatch).not.toHaveBeenCalled();
      expect(formIni.result.current.isInitialized).toBe(true);
      expect(formIni.result.current.isInitializing).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe("Logic CASE", () => {
    test("Default the form session should be set if no formsession exist", () => {
      const formId = "uniqueForm";
      const key = `${formId}_${RespondentSessionMock?.respondentEmail}_state`;

      (useQuery as unknown as jest.Mock).mockReturnValue({
        data: { data: RespondentSessionMock },
        isPending: false,
        isLoading: false,
      });

      const formIni = renderHook(() =>
        useFormInitialization({
          formId,
          dispatch: mockedDispatch,
        }),
      );

      const defaultSession = {
        isActive: true,
        respondentinfo: {
          ...RespondentSessionMock,
          expiresAt: RespondentSessionMock?.expiresAt,
        },
        expiresAt: RespondentSessionMock?.expiresAt,
      };

      expect(mockedDispatch).toHaveBeenCalledWith({
        type: "SET_FORMSESSION",
        payload: defaultSession,
      });
      expect(localStorage.setItem).toHaveBeenCalledWith(
        key,
        JSON.stringify(defaultSession),
      );
      expect(formIni.result.current.isInitialized).toBe(true);
      expect(formIni.result.current.isInitializing).toBe(false);
    });

    test("if data is successfully verified it should set correct data in the local storage", () => {
      const formId = "uniqueForm";
      const key = `${formId}_${RespondentSessionMock?.respondentEmail}_state`;

      const existingSavedSession = {
        isActive: true,
        session_id: "prev-session-123",
        respondentinfo: {
          respondentEmail: SampleUserTest!.email,
          respondentName: "OldName",
          expiresAt: "2026-09-08T00:00:00Z",
        },
        expiresAt: "2026-09-08T00:00:00Z",
      };
      localStorage.setItem(key, JSON.stringify(existingSavedSession));

      (useQuery as unknown as jest.Mock).mockReturnValue({
        data: { data: RespondentSessionMock },
        isPending: false,
        isLoading: false,
      });

      const formIni = renderHook(() =>
        useFormInitialization({
          formId,
          dispatch: mockedDispatch,
        }),
      );

      const updatedSession = {
        ...existingSavedSession,
        expiresAt: RespondentSessionMock?.expiresAt,
        respondentinfo: {
          ...existingSavedSession.respondentinfo,
          ...RespondentSessionMock,
          expiresAt: RespondentSessionMock?.expiresAt,
        },
      };

      expect(mockedDispatch).toHaveBeenCalledWith({
        type: "SET_FORMSESSION",
        payload: updatedSession,
      });
      expect(localStorage.setItem).toHaveBeenCalledWith(
        key,
        JSON.stringify(updatedSession),
      );
      expect(formIni.result.current.isInitialized).toBe(true);
      expect(formIni.result.current.isInitializing).toBe(false);
    });

    test("if error occured in the proccess of set it should remove the data back", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const formId = "uniqueForm";
      const key = `${formId}_${RespondentSessionMock?.respondentEmail}_state`;

      const existingSavedSession = {
        isActive: true,
        respondentinfo: RespondentSessionMock,
      };
      localStorage.setItem(key, JSON.stringify(existingSavedSession));

      (useQuery as unknown as jest.Mock).mockReturnValue({
        data: { data: RespondentSessionMock },
        isPending: false,
        isLoading: false,
      });

      (localStorage.setItem as jest.Mock).mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });

      const formIni = renderHook(() =>
        useFormInitialization({
          formId,
          dispatch: mockedDispatch,
        }),
      );

      expect(localStorage.removeItem).toHaveBeenCalledWith(key);
      expect(localStorage.getItem(key)).toBeNull();
      expect(formIni.result.current.isInitialized).toBe(true);
      expect(formIni.result.current.isInitializing).toBe(false);

      consoleSpy.mockRestore();
    });
  });
});
