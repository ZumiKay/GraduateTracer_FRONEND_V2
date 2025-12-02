import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ROLE } from "../types/User.types";
import ApiRequest from "../hooks/ApiHook";
import SuccessToast, { ErrorToast } from "../component/Modal/AlertModal";

interface Usersessiontype {
  _id: string;
  name: string;
  email: string;
  role: ROLE;
}

export interface SessionState {
  user: Usersessiontype | null;
  isAuthenticated: boolean;
}

const initialState: SessionState = {
  user: null,
  isAuthenticated: false,
};

export const AsyncLoggout = async () => {
  const response = await ApiRequest({
    url: "/logout",
    cookie: true,
    method: "DELETE",
  });
  if (!response.success) {
    ErrorToast({
      title: "Error",
      content: response.error ?? "Error Occured",
    });
    return false;
  }
  SuccessToast({ title: "Success", content: "Logged Out" });
  return true;
};

const userstore = createSlice({
  name: "usersession",
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<{
        user: Usersessiontype | null;
        isAuthenticated: boolean;
      }>
    ) => {
      state.user = action.payload.user;
      state.isAuthenticated = action.payload.isAuthenticated;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, logout } = userstore.actions;
export default userstore.reducer;
