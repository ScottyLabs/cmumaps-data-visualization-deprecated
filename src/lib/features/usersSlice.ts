import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ID, PDFCoordinate } from "../../components/shared/types";
import { createAppAsyncThunk } from "../withTypes";
import { apiSlice } from "./apiSlice";

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
  roomId: ID;
  holeIndex: number;
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

interface UpdatePayload {
  sender: string;
  cursorInfoList: CursorInfo[];
}

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setOtherUsers(state, action: PayloadAction<Record<string, User>>) {
      state.otherUsers = action.payload;
    },
    updateCursorInfoList(state, action: PayloadAction<UpdatePayload>) {
      state.liveCursors[action.payload.sender] = action.payload.cursorInfoList;
    },
  },
  selectors: {
    selectCursorInfoList(state, userId: string) {
      return state.liveCursors[userId];
    },
  },
});

interface MoveNodeWithCursorArgType {
  cursorInfo: CursorInfoOnDragNode;
  floorCode: string;
}

// only changes the cache; used for syncing with cursor position
export const moveNodeWithCursor = createAppAsyncThunk(
  "users/moveNodeWithCursor",
  ({ cursorInfo, floorCode }: MoveNodeWithCursorArgType, { dispatch }) => {
    dispatch(
      apiSlice.util.updateQueryData("getGraph", floorCode, (draft) => {
        draft[cursorInfo.nodeId].pos = cursorInfo.nodePos;
      })
    );
  }
);

export const { selectCursorInfoList } = usersSlice.selectors;
export const { setOtherUsers, updateCursorInfoList } = usersSlice.actions;
export default usersSlice.reducer;
