import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { toast } from "react-toastify";

import { Graph, Node } from "../../components/shared/types";
import { AWS_API_INVOKE_URL } from "../apiRoutes";
import { GRAPH_PATCH, WEBSOCKET_MESSAGE } from "../webSocketMiddleware";
import { addPatchesToHistory } from "./dataSlice";

interface MoveNodeArgType {
  floorCode: string;
  nodeId: string;
  node: Node;
}

interface GetFileArgType {
  filePath: string;
  token: string;
}

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
    moveNode: builder.mutation<Date, MoveNodeArgType>({
      query: ({ nodeId, node }) => ({
        url: "/api/node/update",
        method: "POST",
        body: { nodeId, node },
      }),
      transformResponse: (response: { updatedAt: Date }) => response.updatedAt,
      async onQueryStarted(
        { floorCode, nodeId, node },
        { dispatch, getState, queryFulfilled }
      ) {
        try {
          // different error handling for queryFulfilled
          try {
            const res = await queryFulfilled;
            node.updatedAt = res.data;
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

          let nodes =
            apiSlice.endpoints.getGraph.select(floorCode)(getState()).data;

          if (!nodes) {
            nodes = await dispatch(
              apiSlice.endpoints.getGraph.initiate(floorCode)
            ).unwrap();
          }

          const { patches: jsonPatch, inversePatches: reversedJsonPatch } =
            dispatch(
              apiSlice.util.updateQueryData("getGraph", floorCode, (draft) => {
                draft[nodeId] = node;
              })
            );

          // create db patches
          const apiPath = "/api/node/update";
          const body = JSON.stringify({ nodeId, node });
          const reversedBody = JSON.stringify({ nodeId, node: nodes[nodeId] });
          const dbPatch = { apiPath, body };
          const reversedDbPatch = { apiPath, body: reversedBody };

          const patch = {
            jsonPatch,
            reversedJsonPatch,
            dbPatch,
            reversedDbPatch,
          };

          dispatch(addPatchesToHistory(patch));
          dispatch({
            type: WEBSOCKET_MESSAGE,
            payload: { type: GRAPH_PATCH, patch: jsonPatch },
          });
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
