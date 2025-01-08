import {
  createApi,
  fetchBaseQuery,
  RootState,
} from "@reduxjs/toolkit/query/react";

import { Graph } from "../../components/shared/types";
import { AWS_API_INVOKE_URL } from "../apiRoutes";
import { AppDispatch } from "../store";

interface GetFileArgType {
  filePath: string;
  token: string;
}

export const getGraph = async (
  floorCode: string,
  getState: () => RootState<any, any, "api">,
  dispatch: AppDispatch
) => {
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
  }),
});

export const { useGetFileQuery, useGetGraphQuery } = apiSlice;
