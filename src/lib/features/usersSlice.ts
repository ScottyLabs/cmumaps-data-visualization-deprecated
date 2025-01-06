import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { PDFCoordinate } from "../../components/shared/types";

interface UsersState {
  userCount: number;
  liveCursors: PDFCoordinate[];
}

const initialState: UsersState = {
  userCount: 0,
  liveCursors: [],
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUserCount(state, action: PayloadAction<number>) {
      state.userCount = action.payload;
    },
    setLiveCursors(state, action: PayloadAction<PDFCoordinate[]>) {
      state.liveCursors = action.payload;
    },
  },
});

export const { setUserCount, setLiveCursors } = usersSlice.actions;
export default usersSlice.reducer;
