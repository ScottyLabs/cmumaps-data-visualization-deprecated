import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Patch } from "immer";

import { toast } from "react-toastify";

import { Graph, Mst } from "../../components/shared/types";
import { createAppAsyncThunk } from "../withTypes";
import { apiSlice } from "./apiSlice";

const MAX_UNDO_LIMIT = 50;

interface Query {
  apiPath: string;
  body: string;
}

interface Patches {
  jsonPatch: Patch[];
  reversedJsonPatch: Patch[];
  dbPatch: Query;
  reversedDbPatch: Query;
}

interface DataState {
  floorLevels: string[] | null;
  nodes: Graph | null;
  mst: Mst | null;
  editHistory: Patch[][];
  reversedEditHistory: Patch[][];
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

export const undo = createAppAsyncThunk(
  "data/undo",
  async (floorCode: string, { dispatch, getState }) => {
    try {
      const dataState = getState().data;
      const editIndex = dataState.editIndex;
      if (editIndex == -1) {
        toast.error("Can't undo anymore!");
        return;
      }

      // undo locally
      const reversedPatch = dataState.reversedEditHistory[editIndex];
      dispatch(
        apiSlice.util.patchQueryData("getGraph", floorCode, reversedPatch)
      );

      // undo in database
      const reversedQuery = dataState.reversedQueyHistory[editIndex];
      const response = await fetch(reversedQuery.apiPath, {
        method: "POST",
        body: reversedQuery.body,
      });

      const body = await response.json();
      if (!response.ok) {
        toast.error("Failed to save undone change!");
        console.error(body.error);
      }
    } catch (error) {
      toast.error("Failed to undo change!");
      console.error("Error undoing:", error);
    }
  }
);

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
    addPatchesToHistory(state, action: PayloadAction<Patches>) {
      const jsonPatch = action.payload.jsonPatch;
      const reversedPatch = action.payload.reversedJsonPatch;
      const dbPatch = action.payload.dbPatch;
      const reversedDbPatch = action.payload.reversedDbPatch;

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
    },
    undo(state, action: PayloadAction<string>) {
      if (state.editIndex == -1) {
        toast.error("Can't undo anymore!");
        return;
      }

      try {
        const floorCode = action.payload;
        const reversedPatch = state.reversedEditHistory[state.editIndex];
        apiSlice.util.patchQueryData("getGraph", floorCode, reversedPatch);
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
        // const patch = state.editHistory[state.editIndex];
        // state.nodes = applyPatch(state.nodes, patch).newDocument;
      } catch (error) {
        console.error("Error redoing patch:", error);
        toast.error("Failed to redo change!");
      }
    },

    setMst(state, action: PayloadAction<Mst | null>) {
      state.mst = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(undo.fulfilled, (state) => {
      state.editIndex--;
    });
  },
});

export const { setFloorLevels, setNodes, addPatchesToHistory, setMst, redo } =
  dataSlice.actions;
export default dataSlice.reducer;
