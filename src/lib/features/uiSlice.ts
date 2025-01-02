import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  infoDisplayActiveTabIndex: number;
  showRoomSpecific: boolean;
  editPolygon: boolean;
  editRoomLabel: boolean;
}

const initialState: UIState = {
  infoDisplayActiveTabIndex: 0,
  showRoomSpecific: false,
  editPolygon: false,
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

    setEditPolygon(state, action: PayloadAction<boolean>) {
      state.editPolygon = action.payload;
    },
    toggleEditPolygon(state) {
      state.editPolygon = !state.editPolygon;
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
  setEditPolygon,
  toggleEditPolygon,
  setEditRoomLabel,
  toggleEditRoomLabel,
} = UISlice.actions;
export default UISlice.reducer;
