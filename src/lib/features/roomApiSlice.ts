import { UnknownAction } from "@reduxjs/toolkit";

import { toast } from "react-toastify";

import { RoomInfo } from "../../components/shared/types";
import {
  ROOM_EDIT,
  RoomEditMessageAction,
  WEBSOCKET_MESSAGE,
} from "../webSocketMiddleware";
import { apiSlice, getRooms } from "./apiSlice";
import { addEditToHistory, EditPair } from "./historySlice";
import { lockRoom, unlockRoom } from "./lockSlice";

export interface UpdateRoomArgType {
  floorCode: string;
  roomId: string;
  newRoom: RoomInfo;
  oldRoom: RoomInfo | null;
  addToHistory?: boolean;
}

export const RoomApiSlice = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    upsertRoom: builder.mutation<string, UpdateRoomArgType>({
      query: ({ roomId, newRoom, oldRoom }) => ({
        url: "/api/room/upsert",
        method: "POST",
        body: { roomId, newRoom, oldRoom },
      }),
      transformResponse: (response: { updatedAt: string }) =>
        response.updatedAt,
      async onQueryStarted(
        { floorCode, roomId, oldRoom, newRoom, addToHistory = true },
        { dispatch, getState, queryFulfilled }
      ) {
        try {
          // lock the room to update
          dispatch(lockRoom(roomId));

          // optimistic update
          dispatch(
            apiSlice.util.updateQueryData("getRooms", floorCode, (draft) => {
              draft[roomId] = newRoom;
            })
          );

          // create edit and add to history
          if (addToHistory) {
            // can't undo create room
            if (!oldRoom) {
              const edit: EditPair = {
                edit: { endpoint: "createRoom" },
                reverseEdit: { endpoint: "deleteRoom" },
              };
              dispatch(addEditToHistory(edit));
            } else {
              const endpoint = "upsertRoom";
              const edit: EditPair = {
                edit: {
                  endpoint,
                  arg: {
                    floorCode,
                    roomId,
                    oldRoom,
                    newRoom,
                    addToHistory: false,
                  },
                },
                reverseEdit: {
                  endpoint,
                  arg: {
                    floorCode,
                    roomId,
                    oldRoom: newRoom,
                    newRoom: oldRoom,
                    addToHistory: false,
                  },
                },
              };
              dispatch(addEditToHistory(edit));
            }
          }

          // different error handling for queryFulfilled
          let updatedAt: string;
          try {
            const res = await queryFulfilled;
            updatedAt = res.data;
          } catch (e) {
            const error = e as {
              error: { data: { error: string; errorMessage?: string } };
            };
            // known error
            if (error.error.data.errorMessage) {
              toast.error(error.error.data.errorMessage);
              return;
            } else {
              toast.error(
                "Failed to save! Check the Console for detailed error."
              );
            }
            console.error(error.error.data.error);

            // invalidate the cache
            dispatch(apiSlice.util.invalidateTags(["Rooms"]));
            toast.info("Refetching rooms...");
            return;
          }

          // very rare case of receiving a patch with a later update timestamp,
          // but this does mean that I shouldn't overwrite all changes.
          const rooms = await getRooms(floorCode, getState, dispatch);
          console.log(rooms[roomId].updatedAt);
          console.log(updatedAt);
          if (rooms[roomId].updatedAt > updatedAt) {
            toast.error("Very rare concurrency case!");
            dispatch(apiSlice.util.invalidateTags(["Rooms"]));
            toast.info("Refetching rooms...");
            return;
          }

          // update timestamp
          dispatch(
            apiSlice.util.updateQueryData("getRooms", floorCode, (draft) => {
              draft[roomId].updatedAt = updatedAt;
            })
          );

          // unlock the room after update
          dispatch(unlockRoom(roomId));

          // send edit to others
          const roomEditAction: RoomEditMessageAction = {
            type: WEBSOCKET_MESSAGE,
            payload: {
              type: ROOM_EDIT,
              roomId,
              newRoom: { ...newRoom, updatedAt },
            },
          };
          dispatch(roomEditAction as unknown as UnknownAction);
        } catch (e) {
          toast.error("Check the Console for detailed error.");
          console.error(e);
        }
      },
    }),
  }),
});

export const { useUpsertRoomMutation } = RoomApiSlice;
