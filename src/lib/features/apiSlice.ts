import { UnknownAction } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { toast } from "react-toastify";

import { Graph, Node, Overwrite } from "../../components/shared/types";
import { AWS_API_INVOKE_URL } from "../apiRoutes";
import { RootState } from "../store";
import {
  GRAPH_PATCH,
  GraphPatchMessageAction,
  WEBSOCKET_MESSAGE,
} from "../webSocketMiddleware";
import { addPatchesToHistory } from "./dataSlice";
import { lock, setOverwrite } from "./lockSlice";

interface MoveNodeArgType {
  floorCode: string;
  nodeId: string;
  node: Node;
}

interface GetFileArgType {
  filePath: string;
  token: string;
}

let slow: boolean | null = null;

export const getGraph = async (floorCode, getState, dispatch) => {
  let nodes = apiSlice.endpoints.getGraph.select(floorCode)(getState()).data;

  if (!nodes) {
    nodes = (await dispatch(
      apiSlice.endpoints.getGraph.initiate(floorCode)
    ).unwrap()) as Graph;
  }

  return nodes;
};

const getUserName = (userId: string, getState) => {
  return getState().users.otherUsers[userId].userName;
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
      query: ({ nodeId, node }) => ({
        url: "/api/node/update",
        method: "POST",
        body: { nodeId, node },
      }),
      transformResponse: (response: { updatedAt: string }) =>
        response.updatedAt,
      async onQueryStarted(
        { floorCode, nodeId, node },
        { dispatch, getState, queryFulfilled }
      ) {
        try {
          // lock the node to update
          dispatch(lock(nodeId));

          // optimistic update
          const { patches: jsonPatch, inversePatches: reversedJsonPatch } =
            dispatch(
              apiSlice.util.updateQueryData("getGraph", floorCode, (draft) => {
                draft[nodeId] = { ...node };
              })
            );

          if (slow === null) {
            slow = false;
            // Math.random() > 0.5;
            console.log(slow);
          }

          if (slow) {
            console.log("Waited for 5 seconds");
            await new Promise((resolve) => setTimeout(resolve, 5000));
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
            dispatch(apiSlice.util.invalidateTags(["Graph"]));
            toast.info("Refetching the graph...");
            return;
          }

          const store = getState() as RootState;
          let overwrites = store.lock.overwritesMap[nodeId];

          const applyOverwrites = () => {
            const store = getState() as RootState;
            overwrites = overwrites.sort((a, b) =>
              a.updatedAt.localeCompare(b.updatedAt)
            );

            // if there are other changes by myself that needs to be applied,
            // then apply only patches with lower timestamps, otherwise apply all
            let overwritesToApply: Overwrite[] = overwrites;
            let leftoverOverwrites: Overwrite[] = [];
            if (store.lock.nodeLocks[nodeId].locked !== 1) {
              overwritesToApply = overwrites.filter(
                (overwrite) => overwrite.updatedAt < updatedAt
              );
              leftoverOverwrites = overwrites.filter(
                (overwrite) => overwrite.updatedAt > updatedAt
              );
            }

            console.log(overwrites);
            console.log(overwritesToApply);

            // apply all the patchesToApply
            for (const overwrite of overwritesToApply) {
              // check if you overwrite the node without knowing someone's change
              if (overwrite.updatedAt < updatedAt) {
                const name = getUserName(overwrite.senderId, getState);
                toast.warn(`You overwrote ${name}'s change on node ${nodeId}`, {
                  autoClose: false,
                });
              }

              dispatch(
                apiSlice.util.patchQueryData(
                  "getGraph",
                  floorCode,
                  overwrite.patch
                )
              );
            }

            // set leftover overwrites
            dispatch(
              setOverwrite({
                nodeId,
                overwrites: leftoverOverwrites,
              })
            );
          };

          if (overwrites) {
            applyOverwrites();
          }

          // create db patches
          const nodes: Graph = await getGraph(floorCode, getState, dispatch);
          const apiPath = "/api/node/update";
          const body = JSON.stringify({ nodeId, node });
          const reversedBody = JSON.stringify({ nodeId, node: nodes[nodeId] });
          const dbPatch = { apiPath, body };
          const reversedDbPatch = { apiPath, body: reversedBody };

          // create the patch, add to history, and send to other users
          const patch = {
            jsonPatch,
            reversedJsonPatch,
            dbPatch,
            reversedDbPatch,
          };
          dispatch(addPatchesToHistory(patch));
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
