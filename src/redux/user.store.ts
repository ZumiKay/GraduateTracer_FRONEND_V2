import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { ROLE } from "../types/User.types";
import ApiRequest from "../hooks/ApiHook";
import SuccessToast, { ErrorToast } from "../component/Modal/AlertModal";

interface Usersessiontype {
  _id: string;
  name: string;
  email: string;
  role: ROLE;
}

interface SessionState {
  user: Usersessiontype | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: SessionState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};
export const AsyncGetUser = createAsyncThunk(
  "session/check",
  async (_  ,  { rejectWithValue }) => {
    try {
      const response = await ApiRequest({
        method: "GET",
        cookie: true,
        url: "/checksession",
        refreshtoken:  true,
      });
      if (!response.success) {
        throw response.error;
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

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
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(AsyncGetUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.isAuthenticated = true;
      })
      .addCase(AsyncGetUser.fulfilled, (state, action) => {
        const val = action.payload as unknown as SessionState;
        state.loading = false;
        state.user = val.user;
        state.isAuthenticated = true;
      })
      .addCase(AsyncGetUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });
  },
});
export const { logout } = userstore.actions;
export default userstore.reducer;
