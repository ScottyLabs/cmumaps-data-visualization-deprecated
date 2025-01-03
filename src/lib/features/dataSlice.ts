import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { applyPatch, Operation } from "fast-json-patch";

import { toast } from "react-toastify";

import { Graph, Mst } from "../../components/shared/types";
import { reversePatch } from "../../components/utils/editHistoryUtils";

interface DataState {
  floorLevels: string[] | null;
  nodes: Graph | null;
  mst: Mst | null;
  editHistory: Operation[][];
  editIndex: number;
}

const initialState: DataState = {
  floorLevels: null,
  nodes: null,
  mst: null,
  editHistory: [],
  editIndex: -1, // points to the edit to undo
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
      try {
        const reversedPatch = reversePatch(state.nodes, action.payload);
        state.nodes = applyPatch(state.nodes, action.payload).newDocument;
        state.editHistory = [
          ...state.editHistory.slice(0, state.editIndex + 1),
          reversedPatch,
        ];
        state.editIndex = state.editHistory.length - 1;
      } catch (error) {
        console.error("Error applying patch:", error);
        toast.error("Failed to apply patch.");
      }
    },

    undo(state) {
      if (state.editIndex == -1) {
        toast.error("Can't undo anymore!");
        return;
      }

      try {
        const reversedPatch = state.editHistory[state.editIndex];
        state.nodes = applyPatch(state.nodes, reversedPatch).newDocument;
        state.editIndex -= 1;
      } catch (error) {
        console.error("Error undoing patch:", error);
        toast.error("Failed to undo change.");
      }
    },

    setMst(state, action: PayloadAction<Mst | null>) {
      state.mst = action.payload;
    },
  },
});

export const { setFloorLevels, setNodes, applyPatchToGraph, setMst, undo } =
  dataSlice.actions;
export default dataSlice.reducer;
