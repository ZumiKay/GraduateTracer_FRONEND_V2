import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/** Someone who has the form editor open (one entry per open tab). */
export interface Collaborator {
  connectionId: string;
  userId: string;
  name: string;
}

/** A question another editor tab is currently working on. */
export interface QuestionLock extends Collaborator {
  questionId: string;
}

export interface CollabState {
  // This tab's connection to the form's collaboration stream
  connectionId: string | null;
  users: Collaborator[];
  locks: QuestionLock[];
}

const initialState: CollabState = {
  connectionId: null,
  users: [],
  locks: [],
};

const collabSlice = createSlice({
  name: "collab",
  initialState,
  reducers: {
    setCollabConnection: (state, action: PayloadAction<string | null>) => {
      state.connectionId = action.payload;
    },
    setCollabPresence: (
      state,
      action: PayloadAction<{ users: Collaborator[]; locks: QuestionLock[] }>,
    ) => {
      state.users = action.payload.users;
      state.locks = action.payload.locks;
    },
    resetCollab: () => initialState,
  },
});

export const { setCollabConnection, setCollabPresence, resetCollab } =
  collabSlice.actions;
export default collabSlice;
