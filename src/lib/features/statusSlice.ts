import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type LoadingStatus = "Succeeded" | "Loading" | "Failed";
export const LOADED: LoadingStatus = "Succeeded";
const LOADING: LoadingStatus = "Loading";
export const FAILED_LOAD: LoadingStatus = "Failed";

export type SaveStatus = "Saved" | "Saving..." | "Failed to Save!";
export const SAVED: SaveStatus = "Saved";
const SAVING: SaveStatus = "Saving...";
const FAILED_SAVE: SaveStatus = "Failed to Save!";

interface StatusState {
  loadingStatus: LoadingStatus;
  loadingText: string;
  saveStatus: SaveStatus;
}

const initialState: StatusState = {
  loadingStatus: "Loading",
  loadingText: "",
  saveStatus: SAVED,
};

const statusSlice = createSlice({
  name: "status",
  initialState,
  reducers: {
    startLoading(state, action: PayloadAction<string>) {
      state.loadingStatus = LOADING;
      state.loadingText = action.payload;
    },
    finishLoading(state) {
      state.loadingStatus = LOADED;
      state.loadingText = "";
    },
    failedLoading(state, action: PayloadAction<string>) {
      state.loadingStatus = FAILED_LOAD;
      state.loadingText = action.payload;
    },

    startSaving(state) {
      state.saveStatus = SAVING;
    },
    finishSaving(state) {
      state.saveStatus = SAVED;
    },
    failedSaving(state) {
      state.saveStatus = FAILED_SAVE;
    },
  },
});

export const {
  startLoading,
  finishLoading,
  failedLoading,
  startSaving,
  finishSaving,
  failedSaving,
} = statusSlice.actions;
export default statusSlice.reducer;
