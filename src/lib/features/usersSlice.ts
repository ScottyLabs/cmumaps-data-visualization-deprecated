import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ID, PDFCoordinate } from "../../components/shared/types";

export interface User {
  userName: string;
  color: string;
}

interface BaseCursorInfo {
  cursorPos: PDFCoordinate;
}

interface CursorInfoOnDragNode extends BaseCursorInfo {
  nodeId: ID;
  nodePos: PDFCoordinate;
}

interface CursorInfoOnDragVertex extends BaseCursorInfo {
  vertexIndex: number;
  vertexPos: PDFCoordinate;
  cursorPos: PDFCoordinate;
}

type CursorInfoOnMove = BaseCursorInfo;

export type CursorInfo =
  | CursorInfoOnDragNode
  | CursorInfoOnDragVertex
  | CursorInfoOnMove;

interface UsersState {
  otherUsers: Record<string, User>;
  liveCursors: Record<string, CursorInfo[]>;
}

const initialState: UsersState = {
  otherUsers: {},
  liveCursors: {},
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setOtherUsers(state, action: PayloadAction<Record<string, User>>) {
      state.otherUsers = action.payload;
    },
    updateLiveCursors(state, action) {
      state.liveCursors[action.payload.sender] = action.payload.cursorPos;
    },
  },
});

export const { setOtherUsers, updateLiveCursors } = usersSlice.actions;
export default usersSlice.reducer;
