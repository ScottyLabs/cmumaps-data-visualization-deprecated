import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DataState {
  floorLevels: string[] | null;
}

const initialState: DataState = {
  floorLevels: null,
};

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    setFloorLevels(state, action: PayloadAction<string[]>) {
      state.floorLevels = action.payload;
    },
  },
});

export const { setFloorLevels } = dataSlice.actions;
export default dataSlice.reducer;
