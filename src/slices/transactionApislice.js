import { TRANSACTION_URL } from "../constants";
import { apiSlice } from "./apiSlice";

export const transactionApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createTransaction: builder.mutation({
      query: (data) => ({
        url: TRANSACTION_URL,
        method: "POST",
        body: data,
      }),
       invalidatesTags: ['LastTransaction'],
    }),

    getAllTransactions: builder.query({
      query: ({ page, limit }) => ({
        url: TRANSACTION_URL,
        method: "GET",
        params: { page, limit },
      }),
    }),

    getTransactionById: builder.query({
      query: (transactionId) => ({
        url: `${TRANSACTION_URL}/${transactionId}`,
        method: "GET",
      }),
    }),

    updateTransaction: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${TRANSACTION_URL}/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ['LastTransaction'],
    }),

    deleteTransaction: builder.mutation({
      query: (transactionId) => ({
        url: `${TRANSACTION_URL}/${transactionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ['LastTransaction'],
    }),
  }),
});

export const {
  useCreateTransactionMutation,
  useGetAllTransactionsQuery,
  useGetTransactionByIdQuery,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} = transactionApiSlice; 