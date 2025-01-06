import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { Graph } from "../../components/shared/types";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: (builder) => ({
    getGraph: builder.query<Graph, string>({
      query: (floorCode) => `/getGraph?floorCode=${floorCode}`,
      transformResponse: (response: { data: Graph }) => response.data,
    }),
  }),
});

// Export the auto-generated hook for the `getPosts` query endpoint
export const { useGetGraphQuery } = apiSlice;
