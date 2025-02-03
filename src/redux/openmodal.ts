import { createSlice } from "@reduxjs/toolkit";

export type ConfirmModalDataType = {
  open: boolean;
  data?: {
    question?: string;
    onAgree?: () => Promise<void> | void;
    onClose?: () => void;
  };
};

const OpenModal = createSlice({
  name: "openmodal",
  initialState: {
    setting: false,
    createform: false,
    confirm: {
      open: false,
    } as ConfirmModalDataType,
  },
  reducers: {
    setopenmodal: (
      state,
      action: {
        payload: {
          state: keyof typeof state;
          value: boolean | ConfirmModalDataType;
        };
      }
    ) => {
      state[action.payload.state] = action.payload.value as never;
    },
  },
});

export const { setopenmodal } = OpenModal.actions;
export default OpenModal;
