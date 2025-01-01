import { configureStore } from "@reduxjs/toolkit";

import modeSlice from "./features/modeSlice";
import nodeSizeSlice from "./features/nodeSizeSlice";

export const makeStore = () => {
  return configureStore({
    reducer: { mode: modeSlice, nodeSize: nodeSizeSlice },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
