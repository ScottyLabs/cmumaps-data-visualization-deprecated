import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ID } from "../../components/shared/types";

interface LockState {
  /**
   * 0 if unlocked, otherwise locked.
   * The user can write to a node whenver they want.
   * `locked` is used to indicate that a WebSocket patch is being overwritten
   * since the user edited the node without knowing the patch.
   */
  nodeLocks: Record<ID, number>;
}

const initialState: LockState = {
  nodeLocks: {},
};

const lockSlice = createSlice({
  name: "lock",
  initialState,
  reducers: {
    lock(state, action: PayloadAction<string>) {
      state.nodeLocks[action.payload] = state.nodeLocks[action.payload] || 0;
      state.nodeLocks[action.payload]++;
    },
    unlock(state, action: PayloadAction<string>) {
      state.nodeLocks[action.payload]--;
    },
  },
});

export const { lock, unlock } = lockSlice.actions;
export default lockSlice.reducer;
