import { LOGS_URL } from "../constants";
import { apiSlice } from "./apiSlice";

export const logsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    getLogs: builder.query({
      query: ({ page, limit }) => ({
        url: LOGS_URL,
        method: "GET",
        params: { page, limit },
      }),
    }),


  }),
});

export const {
    useGetLogsQuery
} = logsApiSlice;
