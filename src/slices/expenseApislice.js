import { EXPENSE_URL } from "../constants";
import { apiSlice } from "./apiSlice";

export const expenseApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    addExpense: builder.mutation({
      query: (data) => ({
        url: EXPENSE_URL,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['LastTransaction'],
    }),

    addInitialCashInHand: builder.mutation({
      query: (data) => ({
        url: `${EXPENSE_URL}/initial`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['LastTransaction'],
    }),
    

    getExpenses: builder.query({
      query: ({ date, center }) => ({
        url: EXPENSE_URL,
        method: "GET",
        params: { date, center },
      }),
    }),

    getAllExpenses: builder.query({
      query: () => ({
        url: `${EXPENSE_URL}/all`,
        method: "GET",
      }),
    }),

    getCashInHand: builder.query({
      query: () => ({
        url: `${EXPENSE_URL}/cash`,
        method: "GET",
      }),
    }),

    getLastTransaction: builder.query({
      query: () => ({
        url: `${EXPENSE_URL}/last-transaction`,
        method: "GET",
      }),
      providesTags: ['LastTransaction'],
    }),

      updateExpense: builder.mutation({
            query: ({ id, description, amount, expenseType, mode }) => ({
              url: `${EXPENSE_URL}/${id}`,
              method: "PUT",
              body: { description, amount, expenseType, mode },
              headers: {
                'Content-Type': 'application/json',
              },
            }),
            invalidatesTags: ['LastTransaction'],
          }),
      
          deleteExpense: builder.mutation({
            query: (id) => ({
              url: `${EXPENSE_URL}/${id}`,
              method: "DELETE",
            }),
            invalidatesTags: ['LastTransaction'],
          }),
  }),
});

export const {
  useAddExpenseMutation,
  useGetExpensesQuery,
  useGetAllExpensesQuery,
  useGetCashInHandQuery,
  useDeleteExpenseMutation,
  useUpdateExpenseMutation,
  useAddInitialCashInHandMutation,
  useGetLastTransactionQuery
} = expenseApiSlice;
