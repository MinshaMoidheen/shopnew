import { STOCK_URL } from "../constants"
import { apiSlice } from "./apiSlice"



export const stockApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({


        createStock: builder.mutation({
        query: (data) => ({
          url: STOCK_URL,
          method: "POST",
          body: data,
        }),
      }),
  
      getAllStocks: builder.query({
        query: ({ page, limit }) => ({
          url: STOCK_URL,
          method: "GET",
          params: { page, limit },
        }),
      }),
  
      getStockById: builder.query({
        query: (stockId) => ({
          url: `${STOCK_URL}/${stockId}`,
          method: "GET",
        }),
      }),
  
      updateStock: builder.mutation({
        query: ({ stockId, data }) => ({
          url: `${STOCK_URL}/${stockId}`,
          method: "PUT",
          body: data,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      }),
  
      deleteStock: builder.mutation({
        query: (stockId) => ({
          url: `${STOCK_URL}/${stockId}`,
          method: "DELETE",
        }),
      }),

      getStockByProductId: builder.query({
        query: (stockId) => ({
          url: `${STOCK_URL}/product/${stockId}`,
          method: "GET",
        }),
      }),
  
  
    }),
  });


export const {
  useCreateStockMutation,
  useGetAllStocksQuery,
  useGetStockByIdQuery,
  useUpdateStockMutation,
  useDeleteStockMutation,
  useGetStockByProductIdQuery
} = stockApiSlice