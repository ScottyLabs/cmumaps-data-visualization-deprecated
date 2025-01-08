import {
  createApi,
  fetchBaseQuery,
  RootState,
} from "@reduxjs/toolkit/query/react";

import { Nodes } from "../../components/shared/types";
import { AWS_API_INVOKE_URL } from "../apiRoutes";
import { AppDispatch } from "../store";

interface GetFileArgType {
  filePath: string;
  token: string;
}

export const getNodes = async (
  floorCode: string,
  getState: () => RootState<any, any, "api">,
  dispatch: AppDispatch
) => {
  let nodes = apiSlice.endpoints.getNodes.select(floorCode)(getState()).data;

  if (!nodes) {
    nodes = (await dispatch(
      apiSlice.endpoints.getNodes.initiate(floorCode)
    ).unwrap()) as Nodes;
  }

  return nodes;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/",
  }),
  tagTypes: ["Nodes"],
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
    getNodes: builder.query<Nodes, string>({
      query: (floorCode) => `/api/getGraph?floorCode=${floorCode}`,
      transformResponse: (response: { data: Nodes }) => response.data,
      providesTags: ["Nodes"],
    }),
  }),
});

export const { useGetFileQuery, useGetNodesQuery } = apiSlice;
