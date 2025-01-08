import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { toast } from "react-toastify";

import { Graph, Mst } from "../../components/shared/types";
import { AppDispatch } from "../store";
import { createAppAsyncThunk } from "../withTypes";
import { apiSlice, MoveNodeArgType } from "./apiSlice";

const MAX_UNDO_LIMIT = 50;

interface MoveNodeEdit {
  endpoint: "moveNode";
  arg: MoveNodeArgType;
}

type Edit = MoveNodeEdit;

export interface EditArg {
  edit: Edit;
  reverseEdit: Edit;
}

interface DataState {
  nodes: Graph | null;
  mst: Mst | null;
  editHistory: Edit[];
  reversedEditHistory: Edit[];
  editIndex: number; // points to the edit to undo
}

const initialState: DataState = {
  nodes: null,
  mst: null,
  editHistory: [],
  reversedEditHistory: [],
  editIndex: -1,
};

const applyEdit = (edit: Edit, dispatch: AppDispatch) => {
  switch (edit.endpoint) {
    case "moveNode":
      dispatch(apiSlice.endpoints.moveNode.initiate(edit.arg)).unwrap();
      break;
  }
};

export const undo = createAppAsyncThunk(
  "data/undo",
  (_, { dispatch, getState }) => {
    try {
      const dataState = getState().data;
      const editIndex = dataState.editIndex;
      if (editIndex == -1) {
        toast.warn("Can't undo anymore!");
        return Promise.reject();
      }
      // apply the reversed edit
      const reversedEdit = dataState.reversedEditHistory[editIndex];
      console.log(reversedEdit);
      applyEdit(reversedEdit, dispatch);
    } catch (error) {
      toast.error("Failed to undo change!");
      console.error("Error undoing:", error);
      return Promise.reject();
    }
  }
);

// export const redo = createAppAsyncThunk(
//   "data/redo",
//   async (floorCode: string, { dispatch, getState }) => {
//     try {
//       const dataState = getState().data;
//       const editIndex = dataState.editIndex;
//       if (editIndex == dataState.editHistory.length) {
//         toast.error("Can't redo anymore!");
//         return;
//       }

//       // redo locally
//       const patch = dataState.editHistory[editIndex];
//       dispatch(apiSlice.util.patchQueryData("getGraph", floorCode, patch));

//       // redo in database
//       const query = dataState.queryHistory[editIndex];
//       await applyQuery(query);
//     } catch (error) {
//       toast.error("Failed to redo change!");
//       console.error("Error redoing patch:", error);
//     }
//   }
// );

const getUpdatedHistory = <T>(history: T[], patch: T, index: number) => {
  const updatedHistory = [...history.slice(0, index + 1), patch];
  // Trim the history arrays to maintain the maximum undo limit
  return updatedHistory.slice(-MAX_UNDO_LIMIT);
};

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    setNodes(state, action) {
      state.nodes = action.payload;
    },
    addEditToHistory(state, action: PayloadAction<EditArg>) {
      const edit = action.payload.edit;
      const reverseEdit = action.payload.reverseEdit;

      // Update the history arrays with the new patch
      state.editHistory = getUpdatedHistory(
        state.editHistory,
        edit,
        state.editIndex + 1
      );

      state.reversedEditHistory = getUpdatedHistory(
        state.reversedEditHistory,
        reverseEdit,
        state.editIndex + 1
      );

      // Update the edit index
      state.editIndex = state.editHistory.length - 1;
    },

    setMst(state, action: PayloadAction<Mst | null>) {
      state.mst = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(undo.fulfilled, (state) => {
      state.editIndex--;
    });
    // builder.addCase(redo.pending, (state) => {
    //   if (state.editIndex !== state.editHistory.length - 1) {
    //     state.editIndex++;
    //   }
    // });
  },
});

export const { setNodes, addEditToHistory, setMst } = dataSlice.actions;
export default dataSlice.reducer;
