import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { toast } from "react-toastify";

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
      query: ({ nodeId, node }) => ({
        url: "/node/update",
        method: "POST",
        body: { nodeId, node },
      }),
      async onQueryStarted(
        { floorCode, nodeId, node },
        { dispatch, getState, queryFulfilled }
      ) {
        try {
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
        } catch (e) {
          toast.error("Check the Console for detailed error.");
          console.error(e);
        }

        try {
          await queryFulfilled;
        } catch (e) {
          toast.error("Failed to save! Check the Console for detailed error.");
          const error = e as { error: { data: { error: string } } };
          console.error(error.error.data.error);
        }
      },
    }),
  }),
});

// Export the auto-generated hook for the `getPosts` query endpoint
export const { useGetGraphQuery, useMoveNodeMutation } = apiSlice;
