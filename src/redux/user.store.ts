import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ROLE } from "../types/User.types";
import ApiRequest from "../hooks/APIHook/ApiHook";
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
  expiresAt?: string;
}

import {
  getStoredUserSession,
  setStoredUserSession,
  clearStoredUserSession,
} from "../utils/userSessionStorage";

;

const getInitialState = (): SessionState => {
  const stored = getStoredUserSession();
  if (!stored) {
    return {
      user: null,
      isAuthenticated: false,
    };
  }

  // If existing stored session is expired, mark as unauthenticated but retain expiresAt for detection
  const isExpired = stored.expiresAt
    ? new Date(stored.expiresAt).getTime() <= Date.now()
    : false;

  return {
    user: isExpired ? null : stored.user,
    isAuthenticated: isExpired ? false : stored.isAuthenticated,
    expiresAt: stored.expiresAt,
  };
};

const initialState: SessionState = getInitialState();

export const AsyncLoggout = async () => {
  clearStoredUserSession();
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
        expiresAt?: string;
      }>,
    ) => {
      state.user = action.payload.user;
      state.isAuthenticated = action.payload.isAuthenticated;
      state.expiresAt = action.payload.expiresAt;
      setStoredUserSession({
        user: action.payload.user,
        isAuthenticated: action.payload.isAuthenticated,
        expiresAt: action.payload.expiresAt,
      });
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.expiresAt = undefined;
      clearStoredUserSession();
    },
  },
});

export const { setUser, logout } = userstore.actions;
export default userstore.reducer;
