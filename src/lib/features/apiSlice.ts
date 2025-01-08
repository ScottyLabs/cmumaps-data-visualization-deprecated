import { UnknownAction } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { toast } from "react-toastify";

import { Graph, Node } from "../../components/shared/types";
import { AWS_API_INVOKE_URL } from "../apiRoutes";
import { RootState } from "../store";
import {
  GRAPH_PATCH,
  GraphPatchMessageAction,
  WEBSOCKET_MESSAGE,
} from "../webSocketMiddleware";
import { addPatchesToHistory } from "./dataSlice";
import { lock, unlock } from "./lockSlice";

interface MoveNodeArgType {
  floorCode: string;
  nodeId: string;
  newNode: Node;
  oldNode: Node;
}

interface GetFileArgType {
  filePath: string;
  token: string;
}

export const getGraph = async (floorCode, getState, dispatch) => {
  let nodes = apiSlice.endpoints.getGraph.select(floorCode)(getState()).data;

  if (!nodes) {
    nodes = (await dispatch(
      apiSlice.endpoints.getGraph.initiate(floorCode)
    ).unwrap()) as Graph;
  }

  return nodes;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/",
  }),
  tagTypes: ["Graph"],
  endpoints: (builder) => ({
    getFile: builder.query<string, GetFileArgType>({
      query: ({ filePath, token }) => ({
        url: `${AWS_API_INVOKE_URL}/get-floorplan?filePath=${filePath}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      transformResponse: (response: { data: string }) => response.data,
    }),
    getGraph: builder.query<Graph, string>({
      query: (floorCode) => `/api/getGraph?floorCode=${floorCode}`,
      transformResponse: (response: { data: Graph }) => response.data,
      providesTags: ["Graph"],
    }),
    moveNode: builder.mutation<string, MoveNodeArgType>({
      query: ({ nodeId, newNode }) => ({
        url: "/api/node/update",
        method: "POST",
        body: { nodeId, node: newNode },
      }),
      transformResponse: (response: { updatedAt: string }) =>
        response.updatedAt,
      async onQueryStarted(
        { floorCode, nodeId, oldNode, newNode },
        { dispatch, getState, queryFulfilled }
      ) {
        try {
          // lock the node to update
          dispatch(lock(nodeId));

          // first reset to old pos
          dispatch(
            apiSlice.util.updateQueryData("getGraph", floorCode, (draft) => {
              draft[nodeId] = oldNode;
            })
          );

          // optimistic update
          const { patches: jsonPatch, inversePatches: reversedJsonPatch } =
            dispatch(
              apiSlice.util.updateQueryData("getGraph", floorCode, (draft) => {
                draft[nodeId] = newNode;
              })
            );

          // create db patches
          const apiPath = "/api/node/update";
          const body = JSON.stringify({ nodeId, node: newNode });
          const reversedBody = JSON.stringify({ nodeId, node: oldNode });
          const dbPatch = { apiPath, body };
          const reversedDbPatch = { apiPath, body: reversedBody };

          // create the patch and add to history
          const patch = {
            jsonPatch,
            reversedJsonPatch,
            dbPatch,
            reversedDbPatch,
          };
          dispatch(addPatchesToHistory(patch));

          const store = getState() as RootState;
          // if (store.visibility.showEdges) {
          //   console.log("Waited for 5 seconds");
          //   await new Promise((resolve) => setTimeout(resolve, 5000));
          // } else {
          //   console.log("Waited for 1 seconds");
          //   await new Promise((resolve) => setTimeout(resolve, 1000));
          // }

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
            dispatch(apiSlice.util.invalidateTags(["Graph"]));
            toast.info("Refetching the graph...");
            return;
          }

          // unlock the node after update
          dispatch(unlock(nodeId));

          // very rare case of receiving a patch with a later update timestamp,
          // but this does mean that I shouldn't overwrite all changes.
          const nodes = getGraph(floorCode, getState, dispatch);
          if (nodes[nodeId]?.updateAt > updatedAt) {
            toast.error("Very rare concurrency case!");
            dispatch(apiSlice.util.invalidateTags(["Graph"]));
            toast.info("Refetching the graph...");
            return;
          }

          // update timestamp
          // reapply change if no more change by myself
          dispatch(
            apiSlice.util.updateQueryData("getGraph", floorCode, (draft) => {
              if (store.lock[nodeId] === 1) {
                draft[nodeId] = { ...newNode, updatedAt };
              } else {
                draft[nodeId].updatedAt = updatedAt;
              }
            })
          );

          // send patch to others
          const graphPatchAction: GraphPatchMessageAction = {
            type: WEBSOCKET_MESSAGE,
            payload: { type: GRAPH_PATCH, patch: jsonPatch, nodeId, updatedAt },
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

export const { useGetFileQuery, useGetGraphQuery, useMoveNodeMutation } =
  apiSlice;
