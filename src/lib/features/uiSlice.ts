import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  infoDisplayActiveTabIndex: number;
}

const initialState: UIState = {
  infoDisplayActiveTabIndex: 0,
};

const UISlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setInfoDisplayActiveTabIndex(state, action: PayloadAction<number>) {
      state.infoDisplayActiveTabIndex = action.payload;
    },
  },
});

export const { setInfoDisplayActiveTabIndex } = UISlice.actions;
export default UISlice.reducer;
