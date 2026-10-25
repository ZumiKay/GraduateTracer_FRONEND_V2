export interface Logindatatype {
  name?: string;
  email: string;
  password: string;
  confirmpassword?: string;
  agree?: boolean;
}

export interface ForgotPasswordType {
  email?: string;
  code?: string;
  ty?: "vfy" | "confirm" | "change";
}
