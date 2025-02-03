import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ContentType,
  DefaultContentType,
  DefaultFormState,
  FormDataType,
} from "../types/Form.types";
import ApiRequest from "../hooks/ApiHook";
import { ErrorToast } from "../component/Modal/AlertModal";

const AsyncSaveForm = createAsyncThunk(
  "form/save",
  async (_, { rejectWithValue }) => {
    try {
      const response = await ApiRequest({
        url: "/editform",
        method: "PUT",
        cookie: true,
        refreshtoken: true,
      });

      if (!response.success) {
        ErrorToast({ title: "Failed", content: "Can't Save Form" });
        throw response.error;
      }
      return response.data;
    } catch (error) {
      console.log("Save Form", error);
      return rejectWithValue(error);
    }
  }
);

const formstore = createSlice({
  name: "formstore",
  initialState: {
    allquestion: [DefaultContentType] as Array<ContentType>,
    formstate: DefaultFormState,
    prevAllQuestion: [DefaultContentType] as Array<ContentType>,
    allformstate: [] as Array<FormDataType>,
    loading: false,
    isFormEdit: false,
  },
  reducers: {
    setformstate: (state, action: PayloadAction<FormDataType>) => {
      state.formstate = action.payload;
    },
    setisFormEdit: (state, action: PayloadAction<boolean>) => {
      state.isFormEdit = action.payload;
    },
    setallformstate: (state, action: PayloadAction<Array<FormDataType>>) => {
      state.allformstate = action.payload;
    },
    setallquestion: (
      state,
      action: PayloadAction<
        Array<ContentType> | ((prev: Array<ContentType>) => Array<ContentType>)
      >
    ) => {
      const prevAllQuestion = state.allquestion;
      if (typeof action.payload === "function") {
        state.allquestion = action.payload(state.allquestion as ContentType[]);
      } else {
        state.allquestion = action.payload;
      }
      state.prevAllQuestion = prevAllQuestion;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(AsyncSaveForm.fulfilled, (state, action) => {
      state.loading = false;
      state.formstate = action.payload as FormDataType;
    });
    builder.addCase(AsyncSaveForm.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(AsyncSaveForm.rejected, (state) => {
      state.loading = false;
    });
  },
});
export const { setallquestion, setformstate, setallformstate } =
  formstore.actions;
export default formstore;
