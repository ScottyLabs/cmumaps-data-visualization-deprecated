import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Mst } from "../../components/shared/types";

interface DataState {
  floorLevels: string[] | null;
  mst: Mst | null;
}

const initialState: DataState = {
  floorLevels: null,
  mst: null,
};

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    setFloorLevels(state, action: PayloadAction<string[]>) {
      state.floorLevels = action.payload;
    },

    setMst(state, action: PayloadAction<Mst | null>) {
      state.mst = action.payload;
    },
  },
});

export const { setFloorLevels, setMst } = dataSlice.actions;
export default dataSlice.reducer;
