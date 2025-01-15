import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { toast } from "react-toastify";

import { AppDispatch } from "../store";
import { createAppAsyncThunk } from "../withTypes";
import { AddNodeArgType, MoveNodeArgType, nodeApiSlice } from "./nodeApiSlice";
import { RoomApiSlice, UpdateRoomArgType } from "./roomApiSlice";

const MAX_UNDO_LIMIT = 50;

interface UpdateRoomEdit {
  endpoint: "upsertRoom";
  arg: UpdateRoomArgType;
}

interface MoveNodeEdit {
  endpoint: "moveNode";
  arg: MoveNodeArgType;
}

interface AddNodeEdit {
  endpoint: "addNode";
  arg: AddNodeArgType;
}

interface DeleteNodeEdit {
  endpoint: "deleteNode";
  // arg: AddNodeArgType;
}

interface DeleteRoomEdit {
  endpoint: "deleteRoom";
}
interface CreateRoomEdit {
  endpoint: "createRoom";
}

type Edit =
  | MoveNodeEdit
  | UpdateRoomEdit
  | DeleteRoomEdit
  | CreateRoomEdit
  | AddNodeEdit
  | DeleteNodeEdit;

export interface EditPair {
  edit: Edit;
  reverseEdit: Edit;
}

interface HistoryState {
  editHistory: Edit[];
  reversedEditHistory: Edit[];
  editIndex: number; // points to the edit to undo
}

const initialState: HistoryState = {
  editHistory: [],
  reversedEditHistory: [],
  editIndex: -1,
};

const applyEdit = (edit: Edit, dispatch: AppDispatch) => {
  switch (edit.endpoint) {
    case "moveNode":
      dispatch(nodeApiSlice.endpoints.updateNode.initiate(edit.arg)).unwrap();
      break;
    case "upsertRoom":
      dispatch(RoomApiSlice.endpoints.upsertRoom.initiate(edit.arg)).unwrap();
      break;
    case "deleteRoom":
      toast.warn("Can't undo create room!");
      break;
    case "createRoom":
      toast.warn("Can't redo create room!");
      break;
  }
};

export const undo = createAppAsyncThunk(
  "history/undo",
  (_, { dispatch, getState }) => {
    try {
      const historyState = getState().history;
      const editIndex = historyState.editIndex;
      if (editIndex == -1) {
        toast.warn("Can't undo anymore!");
        return Promise.reject();
      }
      // apply the reversed edit
      const reversedEdit = historyState.reversedEditHistory[editIndex];
      applyEdit(reversedEdit, dispatch);
    } catch (error) {
      toast.error("Failed to undo change!");
      console.error("Error undoing:", error);
      return Promise.reject();
    }
  }
);

export const redo = createAppAsyncThunk(
  "history/redo",
  (_, { dispatch, getState }) => {
    try {
      const historyState = getState().history;
      const editIndex = historyState.editIndex;
      if (editIndex === historyState.editHistory.length) {
        toast.warn("Can't redo anymore!");
        return Promise.reject();
      }
      // apply the edit
      const edit = historyState.editHistory[editIndex];
      applyEdit(edit, dispatch);
    } catch (error) {
      toast.error("Failed to redo change!");
      console.error("Error redoing:", error);
      return Promise.reject();
    }
  }
);

const getUpdatedHistory = <T>(history: T[], patch: T, index: number) => {
  const updatedHistory = [...history.slice(0, index + 1), patch];
  // Trim the history arrays to maintain the maximum undo limit
  return updatedHistory.slice(-MAX_UNDO_LIMIT);
};

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    addEditToHistory(state, action: PayloadAction<EditPair>) {
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
  },
  extraReducers: (builder) => {
    builder.addCase(undo.fulfilled, (state) => {
      state.editIndex--;
    });
    builder.addCase(redo.pending, (state) => {
      state.editIndex++;
    });
    builder.addCase(redo.rejected, (state) => {
      state.editIndex--;
    });
  },
});

export const { addEditToHistory } = historySlice.actions;
export default historySlice.reducer;
