import { createSlice } from "@reduxjs/toolkit";

import { createAppAsyncThunk } from "../withTypes";

interface WebSocketState {
  socket: WebSocket | null;
  messages: any[];
}

const initialState: WebSocketState = {
  socket: null,
  messages: [],
};

export const connectWebSocket = createAppAsyncThunk(
  "webSocket/connect",
  async ({ url, floorCode }: { url: string; floorCode: string }, {}) => {
    const socket = new WebSocket(url);

    // Set up event listeners for the WebSocket
    socket.onopen = () => {
      console.log("WebSocket connection established");
      socket.send(JSON.stringify({ action: "refreshUserCount", floorCode }));
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

    return socket;
  }
);

const webSocketSlice = createSlice({
  name: "webSocket",
  initialState,
  reducers: {
    disconnectWebSocket(state) {
      if (state.socket) {
        state.socket.close();
        state.socket = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(connectWebSocket.fulfilled, (state, action) => {
      state.socket = action.payload;
    });
  },
});

export const { disconnectWebSocket } = webSocketSlice.actions;
export const webSocketReducer = webSocketSlice.reducer;
