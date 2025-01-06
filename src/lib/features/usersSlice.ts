import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UsersState {
  userCount: number;
}

const initialState: UsersState = {
  userCount: 0,
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUserCount(state, action: PayloadAction<number>) {
      state.userCount = action.payload;
    },
  },
});

export const { setUserCount } = usersSlice.actions;
export default usersSlice.reducer;
