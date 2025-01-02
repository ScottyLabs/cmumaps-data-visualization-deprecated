import { configureStore } from "@reduxjs/toolkit";

import modeSlice from "./features/modeSlice";
import mouseEventSlice from "./features/mouseEventSlice";
import mstSlice from "./features/mstSlice";
import nodeSizeSlice from "./features/nodeSizeSlice";
import statusSlice from "./features/statusSlice";
import uiSlice from "./features/uiSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      mode: modeSlice,
      nodeSize: nodeSizeSlice,
      mst: mstSlice,
      mouseEvent: mouseEventSlice,
      ui: uiSlice,
      status: statusSlice,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
