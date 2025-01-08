import { Action, Middleware } from "@reduxjs/toolkit";
import { Patch } from "immer";

import { toast } from "react-toastify";

import { WEBSOCKET_ENABLED } from "../settings";
import { apiSlice, getGraph } from "./features/apiSlice";
import { setFloorCode } from "./features/floorSlice";
import { setOtherUsers, updateCursorInfoList } from "./features/usersSlice";
import { AppDispatch, RootState } from "./store";
import { getUserName, toastOverwriteOnNode } from "./utils/overwriteUtils";

export const WEBSOCKET_JOIN = "socket/join";
export const WEBSOCKET_MESSAGE = "socket/message";

// Message types
export const GRAPH_PATCH = "patch";
export const CURSOR = "cursor";
const LEAVE_FLOOR = "leaveFloor";
const USERS = "users";

interface WebSocketConnectAction {
  type: string;
  payload: {
    floorCode: string;
    url: string;
  };
}

interface GraphPatch {
  patch: Patch[];
  nodeId: string;
  updatedAt: string;
  sender: string;
}

export interface GraphPatchMessageAction {
  type: typeof WEBSOCKET_MESSAGE;
  payload: {
    type: typeof GRAPH_PATCH;
    patch: Patch[];
    nodeId: string;
    updatedAt: string;
  };
}

interface WebSocketMessageAction {
  type: string;
  payload;
}

let socket: WebSocket | null = null;

/**
 * Handles a graph patch
 */
const handleGraphPatch = async (
  message: GraphPatch,
  floorCode: string,
  getStore: () => RootState,
  dispatch: AppDispatch
) => {
  try {
    const nodeId = message.nodeId;
    const unlocked = getStore().lock.nodeLocks[nodeId] !== 0;

    // update timestamp
    apiSlice.util.updateQueryData("getGraph", floorCode, (draft) => {
      if (message.updatedAt > draft[nodeId].updatedAt) {
        draft[nodeId].updatedAt = message.updatedAt;
      }
    });

    // toast a warning about overwriting change if lock
    if (!unlocked) {
      // const name = getUserName(message.sender, getStore());
      toastOverwriteOnNode("LOCK Toast", nodeId);
      return;
    }

    // apply change if patch not outdated
    // otherwise toast a warning about overwriting change
    const nodes = await getGraph(floorCode, getStore, dispatch);
    if (nodes[nodeId].updatedAt < message.updatedAt) {
      dispatch(
        apiSlice.util.patchQueryData("getGraph", floorCode, message.patch)
      );
    } else {
      const name = getUserName(message.sender, getStore());
      toastOverwriteOnNode(name, nodeId);
    }
  } catch (e) {
    toast.error("Error handling graph patch!");
    console.error(e);
  }
};

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
    const floorCode = getStore().floor.floorCode;
    if (!floorCode) {
      return;
    }

    switch (message.type) {
      case GRAPH_PATCH:
        handleGraphPatch(message, floorCode, getStore, dispatch);
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

      // update cursor
      case CURSOR:
        dispatch(updateCursorInfoList(message));
        break;

      // for now just set other users
      case USERS:
        dispatch(setOtherUsers(message.otherUsers));
        break;
    }
  };

  socket.onerror = (error) => {
    toast.error("WebSocket error! Check the Console for detailed error.");
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

  if (!WEBSOCKET_ENABLED) {
    return next(action);
  }

  switch (type) {
    case WEBSOCKET_JOIN:
      handleWebSocketJoin(action as WebSocketConnectAction, getState, dispatch);
      break;

    case WEBSOCKET_MESSAGE:
      if (socket && socket.readyState === WebSocket.OPEN) {
        const { payload } = action as WebSocketMessageAction;
        const floorCode = getState().floor.floorCode;
        socket.send(JSON.stringify({ action: "message", floorCode, payload }));
      } else {
        console.error("WebSocket is not open. Cannot send message.");
      }
      break;

    default:
      break;
  }

  return next(action);
};
