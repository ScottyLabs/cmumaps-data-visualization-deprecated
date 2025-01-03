import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { applyPatch, Operation } from "fast-json-patch";

import { toast } from "react-toastify";

import { Graph, Mst } from "../../components/shared/types";
import { reversePatch } from "../../components/utils/editHistoryUtils";

interface DataState {
  floorLevels: string[] | null;
  nodes: Graph | null;
  mst: Mst | null;
  // all operations <= editIndex are reversed operations
  // all operations >  editIndex are original operations
  editHistory: Operation[][];
  editIndex: number; // points to the edit to undo
}

const initialState: DataState = {
  floorLevels: null,
  nodes: null,
  mst: null,
  editHistory: [],
  editIndex: -1,
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
        toast.error("Failed to apply change!");
      }
    },

    undo(state) {
      if (state.editIndex == -1) {
        toast.error("Can't undo anymore!");
        return;
      }

      try {
        const reversedPatch = state.editHistory[state.editIndex];
        // replace with the orig patch
        const orig = reversePatch(state.nodes, reversedPatch);
        state.editHistory[state.editIndex] = orig;
        // apply the reveresed patch to nodes
        state.nodes = applyPatch(state.nodes, reversedPatch).newDocument;
        state.editIndex -= 1;
      } catch (error) {
        console.error("Error undoing patch:", error);
        toast.error("Failed to undo change!");
      }
    },
    redo(state) {
      if (state.editIndex == state.editHistory.length - 1) {
        toast.error("Can't redo anymore!");
        return;
      }

      try {
        state.editIndex += 1;
        const patch = state.editHistory[state.editIndex];
        // replace with the reversed patch
        const reversedPatch = reversePatch(state.nodes, patch);
        state.editHistory[state.editIndex] = reversedPatch;
        // redo by applying the orig patch
        state.nodes = applyPatch(state.nodes, patch).newDocument;
      } catch (error) {
        console.error("Error redoing patch:", error);
        toast.error("Failed to redo change!");
      }
    },

    setMst(state, action: PayloadAction<Mst | null>) {
      state.mst = action.payload;
    },
  },
});

export const {
  setFloorLevels,
  setNodes,
  applyPatchToGraph,
  setMst,
  undo,
  redo,
} = dataSlice.actions;
export default dataSlice.reducer;
