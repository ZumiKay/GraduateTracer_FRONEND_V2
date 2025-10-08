import {
  FormState,
  FormAction,
  initialFormState,
} from "../types/PublicFormAccessTypes";

export function formStateReducer(
  state: FormState,
  action: FormAction
): FormState {
  switch (action.type) {
    case "SET_ACCESS_MODE":
      return { ...state, accessMode: action.payload };

    case "SET_SHOW_GUEST_FORM":
      return { ...state, showGuestForm: action.payload };

    case "SET_FORMSESSION":
      return { ...state, formsession: action.payload };

    case "SET_RESPONDENT_INFO":
      return { ...state, respondentInfo: action.payload };

    case "UPDATE_LOGIN_DATA":
      return {
        ...state,
        loginData: { ...state.loginData, ...action.payload },
      };

    case "UPDATE_GUEST_DATA":
      return {
        ...state,
        guestData: { ...state.guestData, ...action.payload },
      };

    case "RESET_LOGIN_DATA":
      return {
        ...state,
        loginData: initialFormState.loginData,
      };

    case "INIT_AUTHENTICATED_USER":
      return {
        ...state,
        loginData: { ...state.loginData, email: action.payload.email },
        formsession: action.payload.session,
        accessMode: "authenticated",
      };

    case "INIT_GUEST_USER":
      return {
        ...state,
        guestData: { ...state.guestData, ...action.payload },
        accessMode: "guest",
      };

    default:
      return state;
  }
}
