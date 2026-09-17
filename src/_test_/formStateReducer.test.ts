import { act, renderHook } from "@testing-library/react";
import { useReducer } from "react";
import { formStateReducer } from "../component/Response/reducers/formStateReducer";
import {
  FormState,
  initialFormState,
} from "../component/Response/types/PublicFormAccessTypes";
import { RespondentSessionType } from "../component/Response/Response.type";

describe("formStateReducer", () => {
  test("should return current state when unhandled action type is passed", () => {
    const state = formStateReducer(initialFormState, {
      type: "UNKNOWN_ACTION" as never,
    });
    expect(state).toBe(initialFormState);
  });

  describe("SET_ACCESS_MODE", () => {
    test("should update accessMode and preserve other state fields", () => {
      const nextState = formStateReducer(initialFormState, {
        type: "SET_ACCESS_MODE",
        payload: "authenticated",
      });

      expect(nextState.accessMode).toBe("authenticated");
      expect(nextState.showGuestForm).toBe(initialFormState.showGuestForm);
      expect(nextState.loginData).toEqual(initialFormState.loginData);
      expect(nextState.formsession).toBe(initialFormState.formsession);
    });
  });

  describe("SET_SHOW_GUEST_FORM", () => {
    test("should update showGuestForm to true and false", () => {
      const stateTrue = formStateReducer(initialFormState, {
        type: "SET_SHOW_GUEST_FORM",
        payload: true,
      });
      expect(stateTrue.showGuestForm).toBe(true);

      const stateFalse = formStateReducer(stateTrue, {
        type: "SET_SHOW_GUEST_FORM",
        payload: false,
      });
      expect(stateFalse.showGuestForm).toBe(false);
      expect(stateFalse.accessMode).toBe(initialFormState.accessMode);
    });
  });

  describe("SET_FORMSESSION", () => {
    test("should update formsession and preserve other state properties", () => {
      const mockSession: Partial<RespondentSessionType> = {
        isActive: true,
        expiresAt: "2026-09-10T14:30:00Z",
        respondentinfo: {
          respondentEmail: "test@example.com",
          respondentName: "Test User",
        },
      };

      const nextState = formStateReducer(initialFormState, {
        type: "SET_FORMSESSION",
        payload: mockSession,
      });

      expect(nextState.formsession).toEqual(mockSession);
      expect(nextState.accessMode).toBe(initialFormState.accessMode);
      expect(nextState.showGuestForm).toBe(initialFormState.showGuestForm);
      expect(nextState.loginData).toEqual(initialFormState.loginData);
    });
  });

  describe("UPDATE_LOGIN_DATA", () => {
    test("should partially update loginData while preserving existing fields", () => {
      const step1 = formStateReducer(initialFormState, {
        type: "UPDATE_LOGIN_DATA",
        payload: { email: "user@example.com" },
      });

      expect(step1.loginData).toEqual({
        email: "user@example.com",
        password: "",
        rememberMe: false,
      });

      const step2 = formStateReducer(step1, {
        type: "UPDATE_LOGIN_DATA",
        payload: { password: "securePassword123", rememberMe: true },
      });

      expect(step2.loginData).toEqual({
        email: "user@example.com",
        password: "securePassword123",
        rememberMe: true,
      });
    });
  });

  describe("RESET_LOGIN_DATA", () => {
    test("should reset loginData to initial values and keep other state intact", () => {
      const modifiedState: FormState = {
        accessMode: "authenticated",
        showGuestForm: true,
        formsession: { isActive: true },
        loginData: {
          email: "custom@example.com",
          password: "mySecretPassword",
          rememberMe: true,
        },
      };

      const resetState = formStateReducer(modifiedState, {
        type: "RESET_LOGIN_DATA",
      });

      expect(resetState.loginData).toEqual(initialFormState.loginData);
      expect(resetState.accessMode).toBe("authenticated");
      expect(resetState.showGuestForm).toBe(true);
      expect(resetState.formsession).toEqual({ isActive: true });
    });
  });

  describe("useReducer integration", () => {
    test("should update state sequentially when dispatched from useReducer", () => {
      const { result } = renderHook(() =>
        useReducer(formStateReducer, initialFormState),
      );

      expect(result.current[0]).toEqual(initialFormState);

      // Dispatch SET_ACCESS_MODE
      act(() => {
        result.current[1]({ type: "SET_ACCESS_MODE", payload: "authenticated" });
      });
      expect(result.current[0].accessMode).toBe("authenticated");

      // Dispatch UPDATE_LOGIN_DATA
      act(() => {
        result.current[1]({
          type: "UPDATE_LOGIN_DATA",
          payload: { email: "hook@example.com" },
        });
      });
      expect(result.current[0].loginData.email).toBe("hook@example.com");

      // Dispatch RESET_LOGIN_DATA
      act(() => {
        result.current[1]({ type: "RESET_LOGIN_DATA" });
      });
      expect(result.current[0].loginData).toEqual(initialFormState.loginData);
      expect(result.current[0].accessMode).toBe("authenticated");
    });
  });
});
