import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ContentType, DefaultContentType } from "../types/Form.types";

const formstore = createSlice({
  name: "formstore",
  initialState: {
    allquestion: [DefaultContentType] as Array<ContentType>,
  },
  reducers: {
    setallquestion: (
      state,
      action: PayloadAction<
        Array<ContentType> | ((prev: Array<ContentType>) => Array<ContentType>)
      >
    ) => {
      if (typeof action.payload === "function") {
        state.allquestion = action.payload(state.allquestion as ContentType[]);
      } else {
        state.allquestion = action.payload;
      }
    },
  },
});
export const { setallquestion } = formstore.actions;
export default formstore;
