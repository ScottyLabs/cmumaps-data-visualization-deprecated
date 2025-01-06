import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { PDFCoordinate } from "../../components/shared/types";

interface User {
  userName: string;
  color: string;
}

interface UsersState {
  otherUsers: Record<string, User>;
  liveCursors: Record<string, PDFCoordinate[]>;
}

const initialState: UsersState = {
  otherUsers: {},
  liveCursors: {},
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setOtherUsers(state, action: PayloadAction<Record<string, User>>) {
      state.otherUsers = action.payload;
    },
    updateLiveCursors(state, action) {
      state.liveCursors[action.payload.sender] = action.payload.cursorPos;
    },
  },
});

export const { setOtherUsers, updateLiveCursors } = usersSlice.actions;
export default usersSlice.reducer;
