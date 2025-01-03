import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { applyPatch, Operation } from "fast-json-patch";

import { Graph, Mst } from "../../components/shared/types";

interface DataState {
  floorLevels: string[] | null;
  nodes: Graph | null;
  mst: Mst | null;
}

const initialState: DataState = {
  floorLevels: null,
  nodes: null,
  mst: null,
};

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    setFloorLevels(state, action: PayloadAction<string[]>) {
      state.floorLevels = action.payload;
    },

    setNodes(state, action) {
      state.nodes = action.payload;
    },
    applyPatchToGraph(state, action: PayloadAction<Operation[]>) {
      state.nodes = applyPatch(state.nodes, action.payload).newDocument;
    },

    setMst(state, action: PayloadAction<Mst | null>) {
      state.mst = action.payload;
    },
  },
});

export const { setFloorLevels, setNodes, applyPatchToGraph, setMst } =
  dataSlice.actions;
export default dataSlice.reducer;
