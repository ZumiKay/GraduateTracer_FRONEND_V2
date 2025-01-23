export interface Logindatatype {
  email: string;
  password: string;
  confirmpassword?: string;
  recapcha?: boolean;
  agree?: boolean;
}

export interface ForgotPasswordType {
  email?: string;
  code?: string;
  ty?: "vfy" | "confirm" | "change";
}
