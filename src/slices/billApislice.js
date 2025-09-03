import { BILL_URL } from "../constants";
import { apiSlice } from "./apiSlice";

export const billApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    
    createBill: builder.mutation({
      query: (data) => ({
        url: BILL_URL,
        method: "POST",
        body: data,
      }),
    }),

    getAllBills: builder.query({
      query: ({ page, limit }) => ({
        url: BILL_URL,
        method: "GET",
        params: { page, limit },
      }),
    }),

    getBillById: builder.query({
      query: (billId) => ({
        url: `${BILL_URL}/${billId}`,
        method: "GET",
      }),
    }),

    updateBill: builder.mutation({
      query: ({ billId, data }) => ({
        url: `${BILL_URL}/${billId}`,
        method: "PUT",
        body: data,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),

    deleteBill: builder.mutation({
      query: (billId) => ({
        url: `${BILL_URL}/${billId}`,
        method: "DELETE",
      }),
    }),

    searchBills: builder.query({
      query: ({ name, page = 1, limit = 10 }) => ({
        url: `${BILL_URL}/search/customerName`,
        method: "GET",
        params: { name, page, limit },
      }),
    }),
  }),
});

export const {
  useCreateBillMutation,
  useGetAllBillsQuery,
  useGetBillByIdQuery,
  useUpdateBillMutation,
  useDeleteBillMutation,
  useSearchBillsQuery,
} = billApiSlice;
