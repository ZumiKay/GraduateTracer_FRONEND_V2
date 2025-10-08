import { accessModeType } from "../hooks/usePaginatedFormData";
import { RespondentInfoType, RespondentSessionType } from "../Response.type";
import { LoginData, GuestData } from "../../../types/PublicFormAccess.types";

export interface FormState {
  accessMode: accessModeType;
  showGuestForm: boolean;
  formsession?: Partial<RespondentSessionType>;
  respondentInfo?: RespondentInfoType;
  loginData: LoginData;
  guestData: GuestData;
}

export type FormAction =
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

export const initialFormState: FormState = {
  accessMode: "login",
  showGuestForm: false,
  loginData: { email: "", password: "", rememberMe: false },
  guestData: { name: "", email: "", rememberMe: false, isActive: false },
};
