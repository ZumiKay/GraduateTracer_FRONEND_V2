import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsentState {
  hasConsent: boolean;
  preferences: CookiePreferences;
  isModalOpen: boolean;
}

const initialState: CookieConsentState = {
  hasConsent: false,
  preferences: {
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  },
  isModalOpen: false,
};

const cookieConsentSlice = createSlice({
  name: "cookieConsent",
  initialState,
  reducers: {
    setCookieConsent: (state, action: PayloadAction<boolean>) => {
      state.hasConsent = action.payload;
    },
    setConsentPreferences: (
      state,
      action: PayloadAction<CookiePreferences>
    ) => {
      state.preferences = action.payload;
    },
    updateConsentPreferences: (
      state,
      action: PayloadAction<CookiePreferences>
    ) => {
      state.preferences = action.payload;
    },
    resetCookieConsent: (state) => {
      state.hasConsent = false;
      state.preferences = {
        necessary: true,
        functional: false,
        analytics: false,
        marketing: false,
      };
    },
    openCookieModal: (state) => {
      state.isModalOpen = true;
    },
    closeCookieModal: (state) => {
      console.log("Redux: closeCookieModal action dispatched");
      state.isModalOpen = false;
    },
  },
});

export const {
  setCookieConsent,
  setConsentPreferences,
  updateConsentPreferences,
  resetCookieConsent,
  openCookieModal,
  closeCookieModal,
} = cookieConsentSlice.actions;

export default cookieConsentSlice;
