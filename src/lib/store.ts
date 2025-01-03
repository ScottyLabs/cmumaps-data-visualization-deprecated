import { configureStore } from "@reduxjs/toolkit";

import dataSlice from "./features/dataSlice";
import modeSlice from "./features/modeSlice";
import mouseEventSlice from "./features/mouseEventSlice";
import nodeSizeSlice from "./features/nodeSizeSlice";
import outlineSlice from "./features/outlineSlice";
import statusSlice from "./features/statusSlice";
import uiSlice from "./features/uiSlice";
import visibilitySlice from "./features/visibilitySlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      mode: modeSlice,
      nodeSize: nodeSizeSlice,
      mouseEvent: mouseEventSlice,
      ui: uiSlice,
      status: statusSlice,
      data: dataSlice,
      visibility: visibilitySlice,
      outline: outlineSlice,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
