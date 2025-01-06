import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { PDFCoordinate } from "../../components/shared/types";

interface User {
  userName: string;
  color: string;
}

interface UsersState {
  users: Record<string, User>;
  liveCursors: PDFCoordinate[];
}

const initialState: UsersState = {
  users: {},
  liveCursors: [],
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUsers(state, action: PayloadAction<Record<string, User>>) {
      state.users = action.payload;
    },
    setLiveCursors(state, action: PayloadAction<PDFCoordinate[]>) {
      state.liveCursors = action.payload;
    },
  },
});

export const { setUsers, setLiveCursors } = usersSlice.actions;
export default usersSlice.reducer;
