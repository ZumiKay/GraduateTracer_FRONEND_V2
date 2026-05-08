import { GuestData, LoginData } from "../../../types/PublicFormAccess.types";
import { accessModeType } from "../hooks/usePaginatedFormData";
import { RespondentInfoType, RespondentSessionType } from "../Response.type";
import { initialFormState } from "../types/PublicFormAccessTypes";

export interface FormState {
  accessMode: accessModeType;
  showGuestForm: boolean;
  formsession?: Partial<RespondentSessionType>;
  respondentInfo?: RespondentInfoType;
  loginData: LoginData;
  guestData: GuestData;
}

type FormAction =
  | { type: "SET_ACCESS_MODE"; payload: accessModeType }
  | { type: "SET_SHOW_GUEST_FORM"; payload: boolean }
  | { type: "SET_FORMSESSION"; payload: Partial<RespondentSessionType> }
  | { type: "SET_RESPONDENT_INFO"; payload: RespondentInfoType }
  | { type: "UPDATE_LOGIN_DATA"; payload: Partial<LoginData> }
  | { type: "UPDATE_GUEST_DATA"; payload: Partial<GuestData> }
  | { type: "RESET_LOGIN_DATA" }
  | {
      type: "INIT_AUTHENTICATED_USER";
      payload: { email: string; session: Partial<RespondentSessionType> };
    }
  | { type: "INIT_GUEST_USER"; payload: GuestData };

export function formStateReducer(
  state: FormState,
  action: FormAction,
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
        guestData: action.payload,
        accessMode: "guest",
        formsession: { isActive: true },
      };

    default:
      return state;
  }
}
