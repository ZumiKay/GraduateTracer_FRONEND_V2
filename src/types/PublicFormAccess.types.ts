export type PublicFormAccessProps = Record<string, never>;

export interface LoginData {
  email: string;
  password: string;
  name?: string;
  rememberMe: boolean;
}

export interface GuestData extends Partial<LoginData> {
  name: string;
  isActive: boolean;
}

export interface CheckRequestReturnType {
  status: "success" | "error";
  message: string;
  isActive?: boolean;
}
