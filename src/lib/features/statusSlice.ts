import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type LoadingStatus = "Succeeded" | "Loading" | "Failed";
export const SUCCEEDED_LOAD: LoadingStatus = "Succeeded";
export const LOADING: LoadingStatus = "Loading";
export const FAILED_LOAD: LoadingStatus = "Failed";

export type SaveStatus = "Saved" | "Saving..." | "Failed to Save!";
export const SAVED: SaveStatus = "Saved";
export const SAVING: SaveStatus = "Saving...";
export const FAILED_SAVE: SaveStatus = "Failed to Save!";

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
    finishedLoading(state) {
      state.loadingStatus = SUCCEEDED_LOAD;
    },
    failedLoading(state, action: PayloadAction<string>) {
      state.loadingStatus = FAILED_LOAD;
      state.loadingText = action.payload;
    },

    startSaving(state) {
      state.saveStatus = SAVING;
    },
    finishedSaving(state) {
      state.saveStatus = SAVED;
    },
    failedSaving(state) {
      state.saveStatus = FAILED_SAVE;
    },
  },
});

export const {
  startLoading,
  finishedLoading,
  failedLoading,
  startSaving,
  finishedSaving,
  failedSaving,
} = statusSlice.actions;
export default statusSlice.reducer;
