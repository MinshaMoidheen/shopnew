import { PRODUCTS_URL, IMPORT_URL } from "../constants"
import { apiSlice } from "./apiSlice"

export const importApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    importProducts: builder.mutation({
      query: (formData) => ({
        url: `${IMPORT_URL}/products`,
        method: "POST",
        body: formData,
        // Don't set Content-Type header for FormData
        prepareHeaders: (headers) => {
          headers.delete('Content-Type')
          return headers
        },
      }),
    }),

    importData: builder.mutation({
      query: (formData) => ({
        url: IMPORT_URL,
        method: "POST",
        body: formData,
        // Don't set Content-Type header for FormData
        prepareHeaders: (headers) => {
          headers.delete('Content-Type')
          return headers
        },
      }),
    }),
  }),
})

export const {
  useImportProductsMutation,
  useImportDataMutation,
} = importApiSlice 