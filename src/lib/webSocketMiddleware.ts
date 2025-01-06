import { Action, Middleware } from "@reduxjs/toolkit";
import { Patch } from "immer";

import { apiSlice } from "./features/apiSlice";
import { AppDispatch } from "./store";

export const WEBSOCKET_CONNECT = "socket/connect";
export const WEBSOCKET_DISCONNECT = "socket/disconnect";
export const WEBSOCKET_MESSAGE = "socket/message";

// message types
export const PATCH_TYPE = "patch";

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
    floorCode: string;
    patch: Patch;
  };
}

let socket: WebSocket | null = null;

export const socketMiddleware: Middleware = (params) => (next) => (action) => {
  const { dispatch } = params as { dispatch: AppDispatch };
  const { type } = action as Action;

  switch (type) {
    case WEBSOCKET_CONNECT:
      if (socket) {
        console.log("WebSocket already connected, skipping reconnect.");
        return next(action);
      }
      const { payload } = action as WebSocketConnectAction;
      const { floorCode, url } = payload;

      socket = new WebSocket(url);

      // Set up event listeners for the WebSocket
      socket.onopen = () => {
        if (socket) {
          console.log("WebSocket connection established");
          socket.send(
            JSON.stringify({ action: "refreshUserCount", floorCode })
          );
        }
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === PATCH_TYPE) {
          dispatch(
            apiSlice.util.patchQueryData("getGraph", floorCode, message.patch)
          );
        }
      };

      socket.onerror = (error) => {
        console.log("WebSocket error:", error);
      };

      socket.onclose = () => {
        console.log("WebSocket connection closed");
      };
      break;

    case WEBSOCKET_DISCONNECT:
      if (socket) {
        socket.close();
        socket = null;
      }
      break;

    case WEBSOCKET_MESSAGE:
      if (socket && socket.readyState === WebSocket.OPEN) {
        const { payload } = action as WebSocketMessageAction;
        const { floorCode, patch } = payload;
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
