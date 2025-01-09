import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ID } from "../../components/shared/types";

interface LockState {
  /**
   * Lock for each room. 0 if unlocked, otherwise locked.
   * The user can write to a room whenver they want.
   * `locked` is used to indicate that a WebSocket patch is being overwritten
   * since the user edited (overwrote) the room without knowing the patch.
   */
  roomLocks: Record<ID, number>;

  /**
   * global lock for graph. 0 if unlocked, otherwise locked.
   */
  graphLock: number;

  /**
   * Most recent update timestamp as a string value in ISO format.
   */
  graphUpdatedAt: string | null;
}

const initialState: LockState = {
  roomLocks: {},
  graphLock: 0,
  graphUpdatedAt: null,
};

const lockSlice = createSlice({
  name: "lock",
  initialState,
  reducers: {
    lockRoom(state, action: PayloadAction<string>) {
      state.roomLocks[action.payload] = state.roomLocks[action.payload] || 0;
      state.roomLocks[action.payload]++;
    },
    unlockRoom(state, action: PayloadAction<string>) {
      state.roomLocks[action.payload]--;
    },

    lockGraph(state) {
      state.graphLock++;
    },
    unlockGraph(state) {
      state.graphLock--;
    },

    updateGraphUpdatedAt(state, action: PayloadAction<string>) {
      state.graphUpdatedAt = action.payload;
    },
  },
});

export const {
  lockRoom,
  unlockRoom,
  lockGraph,
  unlockGraph,
  updateGraphUpdatedAt,
} = lockSlice.actions;
export default lockSlice.reducer;
