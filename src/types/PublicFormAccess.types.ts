export interface LoginData {
  email: string;
  password: string;
  name?: string;
  isGuest?: boolean;
  rememberMe: boolean;
}
