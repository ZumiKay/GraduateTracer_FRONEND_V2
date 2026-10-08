import { createSlice } from "@reduxjs/toolkit";

const globalindex = createSlice({
  name: "globalindex",
  initialState: {
    formidx: -1,
    questionidx: -1,
    darkmode: JSON.parse(localStorage.getItem("darkmode") ?? "false"),
    formtitle: "",
    isCondition: false,
  },
  reducers: {
    setformtitle: (state, payload) => {
      state.formtitle = payload.payload;
    },
    setdarkmode: (state, payload) => {
      const newDarkMode = payload.payload;
      localStorage.setItem("darkmode", JSON.stringify(newDarkMode));
      state.darkmode = newDarkMode;
    },
  },
});

export default globalindex;
