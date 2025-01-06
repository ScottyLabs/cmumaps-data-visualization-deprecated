import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type LoadingStatus = "Loaded" | "Loading" | "Failed";
export const LOADED: LoadingStatus = "Loaded";
export const LOADING: LoadingStatus = "Loading";
export const FAILED_LOAD: LoadingStatus = "Failed";

export type ErrorType =
  | "InvalidBuildingCode"
  | "InvalidFloorLevel"
  | "NoDefaultFloor"
  | "FullFloor"
  | null;
export const INVALID_BUILDING_CODE: ErrorType = "InvalidBuildingCode";
export const INVALID_FLOOR_LEVEL: ErrorType = "InvalidFloorLevel";
export const NO_DEFAULT_FLOOR: ErrorType = "NoDefaultFloor";
export const FULL_FLOOR: ErrorType = "FullFloor";

interface StatusState {
  loadingStatus: LoadingStatus;
  loadingText: string;
  shortcutsDisabled: boolean;
  error: ErrorType;
}

const initialState: StatusState = {
  loadingStatus: "Loading",
  loadingText: "",
  shortcutsDisabled: false,
  error: null,
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

    setShortcutsDisabled(state, action: PayloadAction<boolean>) {
      state.shortcutsDisabled = action.payload;
    },

    setError(state, action: PayloadAction<ErrorType>) {
      state.error = action.payload;
    },
  },
});

export const {
  startLoading,
  finishLoading,
  failedLoading,
  setShortcutsDisabled,
  setError,
} = statusSlice.actions;
export default statusSlice.reducer;
