import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { Graph, Node } from "../../components/shared/types";
import { addPatchesToHistory } from "./dataSlice";

interface MoveNodeArgType {
  floorCode: string;
  nodeId: string;
  node: Node;
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: (builder) => ({
    getGraph: builder.query<Graph, string>({
      query: (floorCode) => `/getGraph?floorCode=${floorCode}`,
      transformResponse: (response: { data: Graph }) => response.data,
    }),
    moveNode: builder.mutation<Graph, MoveNodeArgType>({
      query: ({ node }) => ({
        url: "/node/update",
        method: "POST",
        body: node,
      }),
      onQueryStarted({ floorCode, nodeId, node }, { dispatch, getState }) {
        try {
          const nodes =
            apiSlice.endpoints.getGraph.select(floorCode)(getState()).data;

          if (!nodes) {
            console.error("Invalid cache!");
            return;
          }

          const { patches: jsonPatch, inversePatches: reversedJsonPatch } =
            dispatch(
              apiSlice.util.updateQueryData("getGraph", floorCode, (draft) => {
                draft[nodeId] = node;
              })
            );

          // create db patches
          const apiPath = "/api/node/update";
          const body = JSON.stringify({
            nodeId: nodeId,
            nodeData: node,
          });
          const reversedBody = JSON.stringify({
            nodeId: nodeId,
            nodeData: nodes[nodeId],
          });
          const dbPatch = { apiPath, body };
          const reversedDbPatch = { apiPath, body: reversedBody };

          const patch = {
            jsonPatch,
            reversedJsonPatch,
            dbPatch,
            reversedDbPatch,
          };

          dispatch(addPatchesToHistory(patch));
        } catch (e) {
          console.error(e);
        }
      },
    }),
  }),
});

// Export the auto-generated hook for the `getPosts` query endpoint
export const { useGetGraphQuery, useMoveNodeMutation } = apiSlice;
