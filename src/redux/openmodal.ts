import { createSlice } from "@reduxjs/toolkit";

const OpenModal = createSlice({
  name: "openmodal",
  initialState: {
    setting: false,
    createform: false,
  },
  reducers: {
    setopenmodal: (
      state,
      action: { payload: { state: keyof typeof state; value: boolean } }
    ) => {
      state[action.payload.state] = action.payload.value;
    },
  },
});

export default OpenModal;
