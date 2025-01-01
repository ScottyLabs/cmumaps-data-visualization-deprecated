import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface NodeSizeState {
  nodeSize: number;
}

const initialState: NodeSizeState = {
  nodeSize: 2,
};

const nodeSizeSlice = createSlice({
  name: "nodeSize",
  initialState,
  reducers: {
    setNodeSize(state, action: PayloadAction<number>) {
      state.nodeSize = action.payload;
    },
  },
});

export const { setNodeSize } = nodeSizeSlice.actions;
export default nodeSizeSlice.reducer;
