import { SALES_URL } from "../constants"
import { apiSlice } from "./apiSlice"



export const salesApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({


        createSale: builder.mutation({
        query: (data) => ({
          url: SALES_URL,
          method: "POST",
          body: data,
        }),
      }),
  
      getAllSales: builder.query({
        query: ({ page, limit }) => ({
          url: SALES_URL,
          method: "GET",
          params: { page, limit },
        }),
      }),
  
      getSaleById: builder.query({
        query: (salesId) => ({
          url: `${SALES_URL}/${salesId}`,
          method: "GET",
        }),
      }),
  
      updateSale: builder.mutation({
        query: ({ salesId, data }) => ({
          url: `${SALES_URL}/${salesId}`,
          method: "PUT",
          body: data,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      }),
  
      deleteSale: builder.mutation({
        query: (salesId) => ({
          url: `${SALES_URL}/${salesId}`,
          method: "DELETE",
        }),
      }),
  
    }),
  });


export const {
  useCreateSaleMutation,
  useDeleteSaleMutation,
  useGetAllSalesQuery,
  useGetSaleByIdQuery,useUpdateSaleMutation
} = salesApiSlice