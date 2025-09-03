import { DASHBOARD_URL } from "../constants";
import { apiSlice } from "./apiSlice";

export const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    dashboard: builder.query({
      query: ({ from, to }) => ({
        url: DASHBOARD_URL,
        method: "GET",
        params: { from, to },
      }),
    }),

  }),
});

export const { useDashboardQuery } = dashboardApiSlice;
