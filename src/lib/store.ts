import { configureStore } from "@reduxjs/toolkit";

import { apiSlice } from "./features/apiSlice";
import dataSlice from "./features/dataSlice";
import floorSlice from "./features/floorSlice";
import modeSlice from "./features/modeSlice";
import mouseEventSlice from "./features/mouseEventSlice";
import outlineSlice from "./features/outlineSlice";
import statusSlice from "./features/statusSlice";
import uiSlice from "./features/uiSlice";
import usersSlice from "./features/usersSlice";
import visibilitySlice from "./features/visibilitySlice";
import { listenerMiddleware } from "./listenerMiddleware";
import { socketMiddleware } from "./webSocketMiddleware";

export const makeStore = () => {
  return configureStore({
    reducer: {
      mode: modeSlice,
      mouseEvent: mouseEventSlice,
      ui: uiSlice,
      status: statusSlice,
      data: dataSlice,
      visibility: visibilitySlice,
      outline: outlineSlice,
      floor: floorSlice,
      users: usersSlice,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .prepend(listenerMiddleware.middleware)
        .concat(socketMiddleware)
        .concat(apiSlice.middleware),
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
