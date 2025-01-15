import { UnknownAction } from "@reduxjs/toolkit";

import { toast } from "react-toastify";

import { NodeInfo } from "../../components/shared/types";
import {
  GRAPH_PATCH,
  GraphPatchMessageAction,
  WEBSOCKET_MESSAGE,
} from "../webSocketMiddleware";
import { apiSlice, getNodes } from "./apiSlice";
import { addEditToHistory, EditPair } from "./historySlice";

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
          // retrive old node
          const nodes = await getNodes(floorCode, getState, dispatch);
          const oldNode = nodes[nodeId];

          // optimistic update
          const { patches } = dispatch(
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
          try {
            await queryFulfilled;
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

          // send patch to others
          const graphPatchAction: GraphPatchMessageAction = {
            type: WEBSOCKET_MESSAGE,
            payload: {
              type: GRAPH_PATCH,
              patches,
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
