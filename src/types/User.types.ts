export enum ROLE {
  ADMIN = "ADMIN",
  USER = "USER",
}

export interface UserType {
  _id?: string;
  email: string;
  password: string;
  role: ROLE;
  code?: string;
}

export const DefaultUserState: UserType = {
  email: "",
  password: "",
  role: ROLE.USER,
};
