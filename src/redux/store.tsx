import { configureStore, isPlain } from "@reduxjs/toolkit";
import globalindex from "./globalindex";
import OpenModal from "./openmodal";
import formstore from "./formstore";
import sessionReducer from "./user.store";
import cookieConsentSlice from "./cookieConsent.store";

export const store = configureStore({
  reducer: {
    globalindex: globalindex.reducer,
    openmodal: OpenModal.reducer,
    allform: formstore.reducer,
    usersession: sessionReducer,
    cookieConsent: cookieConsentSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        isSerializable: (value: unknown) =>
          typeof value === "function" ? true : isPlain(value), // Allow functions
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
