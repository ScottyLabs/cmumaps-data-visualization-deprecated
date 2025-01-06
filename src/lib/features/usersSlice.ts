import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { PDFCoordinate } from "../../components/shared/types";

interface User {
  userName: string;
  color: string;
}

interface UsersState {
  otherUsers: Record<string, User>;
  liveCursors: PDFCoordinate[];
}

const initialState: UsersState = {
  otherUsers: {},
  liveCursors: [],
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setOtherUsers(state, action: PayloadAction<Record<string, User>>) {
      state.otherUsers = action.payload;
    },
    setLiveCursors(state, action: PayloadAction<PDFCoordinate[]>) {
      state.liveCursors = action.payload;
    },
  },
});

export const { setOtherUsers, setLiveCursors } = usersSlice.actions;
export default usersSlice.reducer;
