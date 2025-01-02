import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  infoDisplayActiveTabIndex: number;
  showRoomSpecific: boolean;
  editRoomLabel: boolean;
}

const initialState: UIState = {
  infoDisplayActiveTabIndex: 0,
  showRoomSpecific: false,
  editRoomLabel: false,
};

const UISlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setInfoDisplayActiveTabIndex(state, action: PayloadAction<number>) {
      state.infoDisplayActiveTabIndex = action.payload;
    },

    setShowRoomSpecific(state, action: PayloadAction<boolean>) {
      state.showRoomSpecific = action.payload;
    },
    toggleShowRoomSpecific(state) {
      state.showRoomSpecific = !state.showRoomSpecific;
    },

    setEditRoomLabel(state, action: PayloadAction<boolean>) {
      state.editRoomLabel = action.payload;
    },
    toggleEditRoomLabel(state) {
      state.editRoomLabel = !state.editRoomLabel;
    },
  },
});

export const {
  setInfoDisplayActiveTabIndex,
  setShowRoomSpecific,
  toggleShowRoomSpecific,
  setEditRoomLabel,
  toggleEditRoomLabel,
} = UISlice.actions;
export default UISlice.reducer;
