import { REPORT_URL } from "../constants"
import { apiSlice } from "./apiSlice"

export const reportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({


    generateReport: builder.mutation({
      query: ({ fromDate, toDate, module, format, center, product, supplier }) => ({
        url: REPORT_URL,
        method: "GET",
        params: { from: fromDate, to: toDate, module, format, center, product, supplier },
        responseHandler: async (response) => {
          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(errorText)
          }
          return response.blob()
        },
      }),
    }),

  }),
})

export const {
  useGenerateReportMutation
} = reportApiSlice
