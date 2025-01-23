import { createSlice } from "@reduxjs/toolkit";

const globalindex = createSlice({
  name: "globalindex",
  initialState: {
    formidx: -1,
    questionidx: -1,
    darkmode: JSON.parse(localStorage.getItem("darkmode") ?? "false"),
    formtitle: "",
    isCondition: false,
    autosave: false,
  },
  reducers: {
    setformtitle: (state, payload) => {
      state.formtitle = payload.payload;
    },

    setformidx: (state, payload) => {
      state.formidx = payload.payload;
    },
    setquestionidx: (state, payload) => {
      state.questionidx = payload.payload;
    },
    setdarkmode: (state, payload) => {
      const isDark = localStorage.getItem("darkmode");

      if (isDark) {
        localStorage.removeItem("darkmode");
      } else {
        localStorage.setItem("darkmode", JSON.stringify(payload.payload));
      }
      state.darkmode = payload.payload;
    },
    setsavetype: (state, payload) => {
      state.autosave = payload.payload;
    },
  },
});

export const { setformidx, setquestionidx, setsavetype } = globalindex.actions;
export default globalindex;
