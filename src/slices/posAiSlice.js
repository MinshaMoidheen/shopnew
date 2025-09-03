import { POS_URL } from "../constants";
import { apiSlice } from "./apiSlice";

export const posApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    
    createPOS: builder.mutation({
      query: (data) => ({
        url: POS_URL,
        method: "POST",
        body: data,
      }),
    }),

    getAllPOS: builder.query({
      query: ({ page, limit }) => ({
        url: POS_URL,
        method: "GET",
        params: { page, limit },
      }),
    }),


    deletePOS: builder.mutation({
      query: (billId) => ({
        url: `${POS_URL}/${billId}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useCreatePOSMutation,
  useDeletePOSMutation,
  useGetAllPOSQuery
} = posApiSlice;
