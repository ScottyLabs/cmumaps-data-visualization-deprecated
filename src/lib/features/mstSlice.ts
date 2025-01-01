import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Mst } from "../../components/shared/types";

interface mstState {
  mst: Mst | null;
}

const initialState: mstState = {
  mst: null,
};

const mstSlice = createSlice({
  name: "mst",
  initialState,
  reducers: {
    setMst(state, action: PayloadAction<Mst>) {
      state.mst = action.payload;
    },
  },
});

export const { setMst } = mstSlice.actions;
export default mstSlice.reducer;
