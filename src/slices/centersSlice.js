import { CENTER_URL } from "../constants"
import { apiSlice } from "./apiSlice"



export const centersApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({


      createCenter: builder.mutation({
        query: (data) => ({
          url: CENTER_URL,
          method: "POST",
          body: data,
        }),
      }),
  
      getCenters: builder.query({
        query: ({ page, limit }) => ({
          url: CENTER_URL,
          method: "GET",
          params: { page, limit },
        }),
      }),
  
      getCenterById: builder.query({
        query: (centerId) => ({
          url: `${CENTER_URL}/${centerId}`,
          method: "GET",
        }),
      }),
  
      updateCenter: builder.mutation({
        query: ({ centerId, data }) => ({
          url: `${CENTER_URL}/${centerId}`,
          method: "PATCH",
          body: data,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      }),
  
      deleteCenter: builder.mutation({
        query: (centerId) => ({
          url: `${CENTER_URL}/${centerId}`,
          method: "DELETE",
        }),
      }),
  
    }),
  });


export const {
    useCreateCenterMutation,
    useGetCenterByIdQuery,
    useGetCentersQuery,
    useUpdateCenterMutation,
    useDeleteCenterMutation
} = centersApi