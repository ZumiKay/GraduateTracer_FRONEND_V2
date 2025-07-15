import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ContentType,
  DefaultFormState,
  FormDataType,
} from "../types/Form.types";
import ApiRequest from "../hooks/ApiHook";
import SuccessToast, { ErrorToast } from "../component/Modal/AlertModal";
import { ShowLinkedQuestionType } from "../types/Global.types";

export const AsyncSaveForm = createAsyncThunk(
  "form/save",
  async (
    data: {
      data: Array<ContentType> | Partial<FormDataType>;
      formID?: string;
      onSuccess?: () => void;
      notoast?: boolean;
      type: "save" | "edit";
      page?: number;
    },
    { rejectWithValue }
  ) => {
    const url = data.type === "save" ? "/savecontent" : "/editform";
    try {
      const response = await ApiRequest({
        url,
        method: "PUT",
        cookie: true,
        data: { data: data.data, formID: data.formID, page: data.page },
        refreshtoken: true,
      });

      if (!response.success) {
        ErrorToast({
          toastid: "autosave",
          title: "Failed",
          content: "Can't Save Form",
        });
        throw response.error;
      }
      if (data.onSuccess) data.onSuccess();
      if (!data.notoast) SuccessToast({ title: "Success", content: "Saved" });
      return response.data;
    } catch (error) {
      console.log("Save Form", error);
      return rejectWithValue(error);
    }
  }
);

const searchParams = new URLSearchParams(window.location.search);
const initialPage = Number(searchParams.get("page")) || 1;

const formstore = createSlice({
  name: "formstore",
  initialState: {
    allquestion: [] as Array<ContentType>,
    formstate: DefaultFormState,
    prevAllQuestion: [] as Array<ContentType>,
    allformstate: [] as Array<FormDataType>,
    loading: false,
    isFormEdit: false,
    page: initialPage,
    fetchloading: false,
    reloaddata: true,
    pauseAutoSave: false,
    debounceQuestion: null as ContentType | null,
    showLinkedQuestions: null as Array<ShowLinkedQuestionType> | null,
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
      if (typeof action.payload === "function") {
        state.allquestion = action.payload(state.allquestion as ContentType[]);
      } else {
        state.allquestion = action.payload;
      }
    },
    setprevallquestion: (state, action: PayloadAction<Array<ContentType>>) => {
      state.prevAllQuestion = action.payload;
    },
    setpage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setfetchloading: (state, action: PayloadAction<boolean>) => {
      state.fetchloading = action.payload;
    },
    setreloaddata: (state, action: PayloadAction<boolean>) => {
      state.reloaddata = action.payload;
    },
    setpauseAutoSave: (state, action: PayloadAction<boolean>) => {
      state.pauseAutoSave = action.payload;
    },
    setdisbounceQuestion: (state, action: PayloadAction<ContentType>) => {
      state.debounceQuestion = action.payload;
    },
    setshowLinkedQuestion: (
      state,
      action: PayloadAction<Array<ShowLinkedQuestionType>>
    ) => {
      state.showLinkedQuestions = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(AsyncSaveForm.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(AsyncSaveForm.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(AsyncSaveForm.rejected, (state) => {
      state.loading = false;
    });
  },
});
export const {
  setallquestion,
  setformstate,
  setallformstate,
  setpage,
  setprevallquestion,
  setfetchloading,
  setreloaddata,
  setpauseAutoSave,
  setdisbounceQuestion,
  setshowLinkedQuestion,
} = formstore.actions;
export default formstore;
