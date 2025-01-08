import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ID, NodeLock, Overwrite } from "../../components/shared/types";

interface LockState {
  nodeLocks: Record<ID, NodeLock>;
  overwritesMap: Record<ID, Overwrite[]>;
}

const initialState: LockState = {
  nodeLocks: {},
  overwritesMap: {},
};

interface PushOverwriteAction {
  nodeId: string;
  overwrite: Overwrite;
}

interface SetOverwriteAction {
  nodeId: string;
  overwrites: Overwrite[];
}

const lockSlice = createSlice({
  name: "lock",
  initialState,
  reducers: {
    lock(state, action: PayloadAction<string>) {
      state.nodeLocks[action.payload] = state.nodeLocks[action.payload] || {
        locked: 0,
      };
      state.nodeLocks[action.payload].locked++;
    },
    unlock(state, action: PayloadAction<string>) {
      state.nodeLocks[action.payload].locked--;
    },

    setOverwrite(state, action: PayloadAction<SetOverwriteAction>) {
      const nodeId = action.payload.nodeId;
      state.overwritesMap[nodeId] = action.payload.overwrites;
    },
    pushOverwrite(state, action: PayloadAction<PushOverwriteAction>) {
      const nodeId = action.payload.nodeId;
      state.overwritesMap[nodeId] = state.overwritesMap[nodeId] || [];
      state.overwritesMap[nodeId].push(action.payload.overwrite);
    },
  },
});

export const { lock, unlock, setOverwrite, pushOverwrite } = lockSlice.actions;
export default lockSlice.reducer;
