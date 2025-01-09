import { UnknownAction } from "@reduxjs/toolkit";

import { toast } from "react-toastify";

import { NodeInfo } from "../../components/shared/types";
import { RootState } from "../store";
import {
  GRAPH_PATCH,
  GraphPatchMessageAction,
  WEBSOCKET_MESSAGE,
} from "../webSocketMiddleware";
import { apiSlice, getNodes } from "./apiSlice";
import { addEditToHistory, EditPair } from "./historySlice";
import { lockGraph, unlockGraph } from "./lockSlice";

export interface MoveNodeArgType {
  floorCode: string;
  nodeId: string;
  newNode: NodeInfo;
  addToHistory?: boolean;
}

export const nodeApiSlice = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    updateNode: builder.mutation<string, MoveNodeArgType>({
      query: ({ nodeId, newNode }) => ({
        url: "/api/node/update",
        method: "POST",
        body: { nodeId, node: newNode },
      }),
      transformResponse: (response: { updatedAt: string }) =>
        response.updatedAt,
      async onQueryStarted(
        { floorCode, nodeId, newNode, addToHistory = true },
        { dispatch, getState, queryFulfilled }
      ) {
        try {
          // lock the graph to update
          dispatch(lockGraph());

          // retrive old node
          const nodes = await getNodes(floorCode, getState, dispatch);
          const oldNode = nodes[nodeId];

          // optimistic update
          dispatch(
            apiSlice.util.updateQueryData("getNodes", floorCode, (draft) => {
              draft[nodeId] = newNode;
            })
          );

          // create edit and add to history
          if (addToHistory) {
            const endpoint = "moveNode";
            const edit: EditPair = {
              edit: {
                endpoint,
                arg: {
                  floorCode,
                  nodeId,
                  newNode,
                  addToHistory: false,
                },
              },
              reverseEdit: {
                endpoint,
                arg: {
                  floorCode,
                  nodeId,
                  newNode: oldNode,
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
            dispatch(apiSlice.util.invalidateTags(["Nodes"]));
            toast.info("Refetching the graph...");
            return;
          }

          // update timestamp
          // reapply change if no more change by myself
          const store = getState() as RootState;
          dispatch(
            apiSlice.util.updateQueryData("getNodes", floorCode, (draft) => {
              if (store.lock[nodeId] === 1) {
                draft[nodeId] = { ...newNode, updatedAt };
              } else {
                draft[nodeId].updatedAt = updatedAt;
              }
            })
          );

          // unlock the graph after update
          dispatch(unlockGraph());

          // send patch to others
          const graphPatchAction: GraphPatchMessageAction = {
            type: WEBSOCKET_MESSAGE,
            payload: {
              type: GRAPH_PATCH,
              nodeId,
              newNode: { ...newNode, updatedAt },
            },
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

export const { useUpdateNodeMutation } = nodeApiSlice;
