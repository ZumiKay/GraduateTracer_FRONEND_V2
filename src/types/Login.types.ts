export interface Logindatatype {
  email: string;
  password: string;
  confirmpassword?: string;
  recapcha?: boolean;
}

export interface ForgotPasswordType {
  email: string;
  code: string;
  confirm?: boolean;
  vfy?: boolean;
}
