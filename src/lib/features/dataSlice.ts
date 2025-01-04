import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { applyPatch, Operation } from "fast-json-patch";

import { toast } from "react-toastify";

import { Graph, Mst } from "../../components/shared/types";

const MAX_UNDO_LIMIT = 50;

interface Query {
  apiPath: string;
  body: string;
}

interface Patch {
  jsonPatch: Operation[];
  reversedJsonPatch: Operation[];
  dbPatch: Query;
  reversedDbPatch: Query;
}

interface DataState {
  floorLevels: string[] | null;
  nodes: Graph | null;
  mst: Mst | null;
  editHistory: Operation[][];
  reversedEditHistory: Operation[][];
  queryHistory: Query[];
  reversedQueyHistory: Query[];
  editIndex: number; // points to the edit to undo
}

const initialState: DataState = {
  floorLevels: null,
  nodes: null,
  mst: null,
  editHistory: [],
  reversedEditHistory: [],
  queryHistory: [],
  reversedQueyHistory: [],
  editIndex: -1,
};

const getUpdatedHistory = <T>(history: T[], patch: T, index: number) => {
  const updatedHistory = [...history.slice(0, index + 1), patch];

  // Trim the history arrays to maintain the maximum undo limit
  return updatedHistory.slice(-MAX_UNDO_LIMIT);
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
    applyPatchToGraph(state, action: PayloadAction<Patch>) {
      try {
        const jsonPatch = action.payload.jsonPatch;
        const reversedPatch = action.payload.reversedJsonPatch;
        const dbPatch = action.payload.dbPatch;
        const reversedDbPatch = action.payload.reversedDbPatch;

        // Apply the patch to the graph
        state.nodes = applyPatch(state.nodes, jsonPatch).newDocument;

        // Update the history arrays with the new patch
        state.editHistory = getUpdatedHistory(
          state.editHistory,
          jsonPatch,
          state.editIndex + 1
        );

        state.reversedEditHistory = getUpdatedHistory(
          state.reversedEditHistory,
          reversedPatch,
          state.editIndex + 1
        );

        state.queryHistory = getUpdatedHistory(
          state.queryHistory,
          dbPatch,
          state.editIndex + 1
        );

        state.reversedQueyHistory = getUpdatedHistory(
          state.reversedQueyHistory,
          reversedDbPatch,
          state.editIndex + 1
        );

        // Update the edit index
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
        const reversedPatch = state.reversedEditHistory[state.editIndex];
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
