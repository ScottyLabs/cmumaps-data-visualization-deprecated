import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PolygonState {
  vertexIndexOnDrag: number | null;
}

const initialState: PolygonState = {
  vertexIndexOnDrag: null,
};

const polygonSlice = createSlice({
  name: "polygon",
  initialState,
  reducers: {
    dragVertex(state, action: PayloadAction<number>) {
      state.vertexIndexOnDrag = action.payload;
    },
    releaseVertex(state) {
      state.vertexIndexOnDrag = null;
    },
  },
});

export const { dragVertex, releaseVertex } = polygonSlice.actions;
export default polygonSlice.reducer;
