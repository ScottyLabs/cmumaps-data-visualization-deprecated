import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Mode =
  | "Graph Select"
  | "Graph Add Edge"
  | "Graph Delete Edge"
  | "Graph Add Node"
  | "Polygon Select"
  | "Polygon Add Vertex"
  | "Polygon Delete Vertex"
  | "Graph Add Door Node";

export const GRAPH_SELECT: Mode = "Graph Select";
export const ADD_EDGE: Mode = "Graph Add Edge";
export const DELETE_EDGE: Mode = "Graph Delete Edge";
export const ADD_NODE: Mode = "Graph Add Node";
export const ADD_DOOR_NODE: Mode = "Graph Add Door Node";

export const POLYGON_SELECT: Mode = "Polygon Select";
export const POLYGON_ADD_VERTEX: Mode = "Polygon Add Vertex";
export const POLYGON_DELETE_VERTEX: Mode = "Polygon Delete Vertex";

interface ModeState {
  mode: Mode;
  editPolygon: boolean;
}

const initialState: ModeState = {
  mode: GRAPH_SELECT,
  editPolygon: false,
};

const modeSlice = createSlice({
  name: "mode",
  initialState,
  reducers: {
    setMode(state, action: PayloadAction<Mode>) {
      state.mode = action.payload;
      if (state.mode === GRAPH_SELECT) {
        state.editPolygon = false;
      } else if (state.mode === POLYGON_SELECT) {
        state.editPolygon = true;
      }
    },
  },
});

export const { setMode } = modeSlice.actions;
export default modeSlice.reducer;
