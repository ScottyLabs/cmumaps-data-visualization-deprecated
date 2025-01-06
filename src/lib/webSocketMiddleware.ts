import { Action, Middleware } from "@reduxjs/toolkit";
import { Patch } from "immer";

import { apiSlice } from "./features/apiSlice";
import { setFloorCode } from "./features/floorSlice";
import { AppDispatch, RootState } from "./store";

export const WEBSOCKET_JOIN = "socket/join";
export const WEBSOCKET_MESSAGE = "socket/message";

// Message types
export const PATCH_TYPE = "patch";
const LEAVE_FLOOR = "leaveFloor";

interface WebSocketConnectAction {
  type: string;
  payload: {
    floorCode: string;
    url: string;
  };
}

interface WebSocketMessageAction {
  type: string;
  payload: {
    patch: Patch;
  };
}

let socket: WebSocket | null = null;

const handleWebSocketJoin = (
  action: WebSocketConnectAction,
  getStore: () => RootState,
  dispatch: AppDispatch
) => {
  const { payload } = action;
  const { floorCode, url } = payload;
  dispatch(setFloorCode(floorCode));

  // switch floor if socket already connected
  if (socket) {
    socket.send(JSON.stringify({ action: "switchFloor", floorCode }));
    return;
  }

  // otherwise create new socket and set up event listeners for the WebSocket
  socket = new WebSocket(url);

  // refresh user count when socket is connected
  socket.onopen = () => {
    console.log("WebSocket connection established");
    if (floorCode) {
      socket?.send(JSON.stringify({ action: "refreshUserCount", floorCode }));
    }
  };

  // handle messages
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log(message);

    const floorCode = getStore().floor.floorCode;
    if (!floorCode) {
      return;
    }

    switch (message.type) {
      // patch the graph
      case PATCH_TYPE:
        dispatch(
          apiSlice.util.patchQueryData("getGraph", floorCode, message.patch)
        );
        break;

      // refresh user count in both floors when leaving a floor
      case LEAVE_FLOOR:
        socket?.send(
          JSON.stringify({
            action: "refreshUserCount",
            floorCode: message.oldFloorCode,
          })
        );
        socket?.send(JSON.stringify({ action: "refreshUserCount", floorCode }));
        break;
    }
  };

  socket.onerror = (error) => {
    console.log("WebSocket error:", error);
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
  };

  // close WebSocket connection when closing window
  window.addEventListener("beforeunload", () => {
    if (socket) {
      socket.close();
      socket = null;
    }
  });
};

interface ParamsType {
  getState: () => RootState;
  dispatch: AppDispatch;
}

export const socketMiddleware: Middleware = (params) => (next) => (action) => {
  const { getState, dispatch } = params as ParamsType;
  const { type } = action as Action;

  switch (type) {
    case WEBSOCKET_JOIN:
      handleWebSocketJoin(action as WebSocketConnectAction, getState, dispatch);
      break;

    case WEBSOCKET_MESSAGE:
      if (socket && socket.readyState === WebSocket.OPEN) {
        const { payload } = action as WebSocketMessageAction;
        const { patch } = payload;
        const floorCode = getState().floor.floorCode;
        socket.send(
          JSON.stringify({
            action: "message",
            floorCode,
            payload: { type: PATCH_TYPE, patch },
          })
        );
      } else {
        console.error("WebSocket is not open. Cannot send message.");
      }
      break;

    default:
      break;
  }

  return next(action);
};
