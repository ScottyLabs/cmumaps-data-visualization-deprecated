import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ID } from "../../components/shared/types";

export type IdSelectedType = "Node" | "Door" | "None";
export const NODE: IdSelectedType = "Node";
export const DOOR: IdSelectedType = "Door";
export const NONE: IdSelectedType = "None";

export interface IdSelectedInfo {
  id: ID;
  type: IdSelectedType;
}

const DEFAULT: IdSelectedInfo = { id: "", type: NONE };

interface MouseEventState {
  idSelected: IdSelectedInfo;
  nodeIdHovered: ID | null;
}

const initialState: MouseEventState = {
  idSelected: DEFAULT,
  nodeIdHovered: null,
};

const mouseEventSlice = createSlice({
  name: "mouseEvent",
  initialState,
  reducers: {
    selectNode(state, action: PayloadAction<string>) {
      state.idSelected = { id: action.payload, type: NODE };
    },
    selectDoor(state, action: PayloadAction<string>) {
      state.idSelected = { id: action.payload, type: DOOR };
    },
    deselect(state) {
      state.idSelected = DEFAULT;
    },

    setNodeIdHovered(state, action: PayloadAction<string | null>) {
      state.nodeIdHovered = action.payload;
    },
    unHoverNode(state) {
      state.nodeIdHovered = null;
    },
  },
});

export const getNodeIdSelected = (state: MouseEventState) => {
  const idSelected = state.idSelected;
  return idSelected.type == NODE ? idSelected.id : "";
};

export const getDoorIdSelected = (state: MouseEventState) => {
  const idSelected = state.idSelected;
  return idSelected.type == DOOR ? idSelected.id : "";
};

export const {
  selectNode,
  selectDoor,
  deselect,
  setNodeIdHovered,
  unHoverNode,
} = mouseEventSlice.actions;
export default mouseEventSlice.reducer;
