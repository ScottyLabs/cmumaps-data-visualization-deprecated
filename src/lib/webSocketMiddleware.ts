import { Action, Middleware } from "@reduxjs/toolkit";

import { toast } from "react-toastify";

import { NodeInfo, RoomInfo } from "../components/shared/types";
import { WEBSOCKET_ENABLED } from "../settings";
import { apiSlice, getRooms } from "./features/apiSlice";
import { setFloorCode } from "./features/floorSlice";
import { updateGraphUpdatedAt } from "./features/lockSlice";
import { setOtherUsers, updateCursorInfoList } from "./features/usersSlice";
import { AppDispatch, RootState } from "./store";
import { getUserName } from "./utils/overwriteUtils";

export const WEBSOCKET_JOIN = "socket/join";
export const WEBSOCKET_MESSAGE = "socket/message";

// Message types
export const ROOM_EDIT = "room edit";
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
  type: typeof GRAPH_PATCH;
  nodeId: string;
  newNode: NodeInfo;
  sender: string;
}

export interface GraphPatchMessageAction {
  type: typeof WEBSOCKET_MESSAGE;
  payload: Omit<GraphPatch, "sender">;
}

interface RoomEdit {
  type: typeof ROOM_EDIT;
  roomId: string;
  newRoom: RoomInfo;
  sender: string;
}

export interface RoomEditMessageAction {
  type: typeof WEBSOCKET_MESSAGE;
  payload: Omit<RoomEdit, "sender">;
}

interface WebSocketMessageAction {
  type: string;
  payload;
}

let socket: WebSocket | null = null;

/**
 * Handles a room edit
 */
const handleRoomEdit = async (
  message: RoomEdit,
  floorCode: string,
  getStore: () => RootState,
  dispatch: AppDispatch
) => {
  try {
    const roomId = message.roomId;
    const locked = !!getStore().lock.roomLocks[roomId];

    // update timestamp
    dispatch(
      apiSlice.util.updateQueryData("getRooms", floorCode, (draft) => {
        if (message.newRoom.updatedAt > draft[roomId].updatedAt) {
          draft[roomId].updatedAt = message.newRoom.updatedAt;
        }
      })
    );

    // toast warning about overwriting if locked or receiving an outdated edit
    const rooms = await getRooms(floorCode, getStore, dispatch);
    if (locked || message.newRoom.updatedAt < rooms[roomId].updatedAt) {
      const name = getUserName(message.sender, getStore());
      toast.warn(`You overwrote ${name}'s change on room ${roomId}`, {
        autoClose: false,
      });
      return;
    }

    // otherwise apply the change
    dispatch(
      apiSlice.util.updateQueryData("getRooms", floorCode, (draft) => {
        draft[roomId] = message.newRoom;
      })
    );
  } catch (e) {
    toast.error("Error handling room edit!");
    console.error(e);
  }
};

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
    const locked = !!getStore().lock.graphLock;
    const graphUpdatedAt = getStore().lock.graphUpdatedAt;
    const outdated =
      graphUpdatedAt && message.newNode.updatedAt < graphUpdatedAt;

    // update timestamp
    if (!outdated) {
      dispatch(updateGraphUpdatedAt(message.newNode.updatedAt));
    }

    // toast warning about overwriting if locked or receiving an outdated patch
    if (locked || outdated) {
      const name = getUserName(message.sender, getStore());
      toast.warn(`You might have overwrote ${name}'s change on the graph`, {
        autoClose: false,
      });
      return;
    }

    // otherwise apply the change
    dispatch(
      apiSlice.util.updateQueryData("getNodes", floorCode, (draft) => {
        draft[nodeId] = message.newNode;
      })
    );
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

      case ROOM_EDIT:
        handleRoomEdit(message, floorCode, getStore, dispatch);
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
