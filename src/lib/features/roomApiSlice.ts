import { UnknownAction } from "@reduxjs/toolkit";

import { toast } from "react-toastify";

import { RoomInfo } from "../../components/shared/types";
import { RootState } from "../store";
import {
  ROOM_EDIT,
  RoomEditMessageAction,
  WEBSOCKET_MESSAGE,
} from "../webSocketMiddleware";
import { apiSlice, getRooms } from "./apiSlice";
import { addEditToHistory, EditPair } from "./historySlice";
import { lock, unlock } from "./lockSlice";

export interface UpdateRoomArgType {
  floorCode: string;
  roomId: string;
  newRoom: RoomInfo;
  oldRoom: RoomInfo;
  addToHistory?: boolean;
}

export const RoomApiSlice = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    upsertRoom: builder.mutation<string, UpdateRoomArgType>({
      query: ({ roomId, newRoom }) => ({
        url: "/api/room/upsert",
        method: "POST",
        body: { roomId, room: newRoom },
      }),
      transformResponse: (response: { updatedAt: string }) =>
        response.updatedAt,
      async onQueryStarted(
        { floorCode, roomId, oldRoom, newRoom, addToHistory = true },
        { dispatch, getState, queryFulfilled }
      ) {
        try {
          // lock the Room to update
          dispatch(lock(roomId));

          // first reset to old pos
          dispatch(
            apiSlice.util.updateQueryData("getRooms", floorCode, (draft) => {
              draft[roomId] = oldRoom;
            })
          );

          // optimistic update
          dispatch(
            apiSlice.util.updateQueryData("getRooms", floorCode, (draft) => {
              draft[roomId] = newRoom;
            })
          );

          // create edit and add to history
          if (addToHistory) {
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

          // different error handling for queryFulfilled
          let updatedAt: string;
          try {
            const res = await queryFulfilled;
            updatedAt = res.data;
          } catch (e) {
            toast.error(
              "Failed to save! Check the Console for detailed error."
            );
            const error = e as { error: { data: { error: string } } };
            console.error(error.error.data.error);

            // invalidate the cache
            dispatch(apiSlice.util.invalidateTags(["Rooms"]));
            toast.info("Refetching rooms...");
            return;
          }

          // very rare case of receiving a patch with a later update timestamp,
          // but this does mean that I shouldn't overwrite all changes.
          const store = getState() as RootState;
          const rooms = await getRooms(floorCode, getState, dispatch);
          if (rooms[roomId].updatedAt > updatedAt) {
            toast.error("Very rare concurrency case!");
            dispatch(apiSlice.util.invalidateTags(["Rooms"]));
            toast.info("Refetching rooms...");
            return;
          }

          // update timestamp
          // reapply change if no more change by myself
          dispatch(
            apiSlice.util.updateQueryData("getRooms", floorCode, (draft) => {
              if (store.lock[roomId] === 1) {
                draft[roomId] = { ...newRoom, updatedAt };
              } else {
                draft[roomId].updatedAt = updatedAt;
              }
            })
          );

          // unlock the Room after update
          dispatch(unlock(roomId));

          // send patch to others
          const graphPatchAction: RoomEditMessageAction = {
            type: WEBSOCKET_MESSAGE,
            payload: { type: ROOM_EDIT, roomId, newRoom, updatedAt },
          };
          dispatch(graphPatchAction as unknown as UnknownAction);
        } catch (e) {
          toast.error("Check the Console for detailed error.");
          console.error(e);
        }
      },
    }),
  }),
});

export const { useUpsertRoomMutation } = RoomApiSlice;
