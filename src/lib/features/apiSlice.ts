import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { Nodes, Rooms } from "../../components/shared/types";
import { AWS_API_INVOKE_URL } from "../apiRoutes";

interface GetFileArgType {
  filePath: string;
  token: string;
}

export const getRooms = async (floorCode: string, getState, dispatch) => {
  let rooms = apiSlice.endpoints.getRooms.select(floorCode)(getState()).data;

  if (!rooms) {
    rooms = (await dispatch(
      apiSlice.endpoints.getRooms.initiate(floorCode)
    ).unwrap()) as Rooms;
  }

  return rooms;
};

export const getNodes = async (floorCode: string, getState, dispatch) => {
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
  tagTypes: ["Nodes", "Rooms"],
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
      query: (floorCode) => `/api/getNodes?floorCode=${floorCode}`,
      transformResponse: (response: { data: Nodes }) => response.data,
      providesTags: ["Nodes"],
    }),
    getRooms: builder.query<Rooms, string>({
      query: (floorCode) => `/api/getRooms?floorCode=${floorCode}`,
      transformResponse: (response: { data: Rooms }) => response.data,
      providesTags: ["Rooms"],
    }),
    invalidateCache: builder.mutation<unknown, void>({
      queryFn: () => ({ data: null }),
      invalidatesTags: ["Nodes", "Rooms"],
    }),
  }),
});

export const {
  useGetFileQuery,
  useGetNodesQuery,
  useGetRoomsQuery,
  useInvalidateCacheMutation,
} = apiSlice;
