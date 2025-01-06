import { Action, Middleware } from "@reduxjs/toolkit";

export const WEBSOCKET_CONNECT = "socket/connect";
export const WEBSOCKET_DISCONNECT = "socket/disconnect";
export const WEBSOCKET_MESSAGE = "socket/message";

interface WebSocketConnectAction {
  type: string;
  payload: {
    url: string;
    floorCode?: string;
  };
}

let socket: WebSocket | null = null;

export const socketMiddleware: Middleware = (params) => (next) => (action) => {
  const {} = params;
  const { type } = action as Action;

  switch (type) {
    case WEBSOCKET_CONNECT:
      if (socket) {
        console.log("WebSocket already connected, skipping reconnect.");
        return next(action);
      }
      const { payload } = action as WebSocketConnectAction;
      const { url, floorCode } = payload;

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
        console.log("Received message:", event.data);
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
        // Send message if WebSocket is open
        socket.send(JSON.stringify({ action: "sendMessage", floorCode }));
        console.log("Message sent:", { action: "sendMessage", floorCode });
      } else {
        console.error("WebSocket is not open. Cannot send message.");
      }
      break;

    default:
      break;
  }

  return next(action);
};
