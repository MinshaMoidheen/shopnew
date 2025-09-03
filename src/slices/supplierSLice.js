import { SUPPLIER_URL } from "../constants";
import { apiSlice } from "./apiSlice";

export const supplierApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createSupplier: builder.mutation({
      query: (data) => ({
        url: SUPPLIER_URL,
        method: "POST",
        body: data,
      }),
    }),

    createSupplierTransaction: builder.mutation({
      query: ({ supplierId, amount, paymentDate, modeOfPayment, invoice }) => ({
        url: `${SUPPLIER_URL}/transactions/${supplierId}`,
        method: "POST",
        body: { amount,paymentDate, modeOfPayment, invoice },
      }),
    }),

    updateSupplierTransaction: builder.mutation({
      query: ({ supplierId, index, amount, modeOfPayment, paymentDate, invoice }) => ({
        url: `${SUPPLIER_URL}/transactions/${supplierId}`,
        method: "PUT",
        body: { index, amount, modeOfPayment, paymentDate, invoice },
      }),
    }),

    deleteSupplierTransaction: builder.mutation({
      query: ({ supplierId, index }) => ({
        url: `${SUPPLIER_URL}/transactions/${supplierId}`,
        method: "DELETE",
        body: { index },
      }),
    }),

    getAllSuppliers: builder.query({
      query: ({ page, limit, search, invoice }) => ({
        url: SUPPLIER_URL,
        method: "GET",
        params: { page, limit, search, invoice },
      }),
    }),

    getSupplierById: builder.query({
      query: (supplierId) => ({
        url: `${SUPPLIER_URL}/${supplierId}`,
        method: "GET",
      }),
    }),

    getSupplierTotals: builder.query({
      query: () => ({
        url: `${SUPPLIER_URL}/totals`,
        method: "GET",
      }),
    }),

    updateSupplier: builder.mutation({
      query: ({ supplierId, data }) => ({
        url: `${SUPPLIER_URL}/${supplierId}`,
        method: "PUT",
        body: data,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    }),

    deleteSupplier: builder.mutation({
      query: (supplierId) => ({
        url: `${SUPPLIER_URL}/${supplierId}`,
        method: "DELETE",
      }),
    }),

    searchSuppliers: builder.query({
      query: ({ name, page = 1, limit = 10 }) => ({
        url: `${SUPPLIER_URL}/search/supplierName`,
        method: "GET",
        params: { name, page, limit },
      }),
    }),
  }),
});

export const {
  useCreateSupplierMutation,
  useDeleteSupplierMutation,
  useGetAllSuppliersQuery,
  useGetSupplierByIdQuery,
  useGetSupplierTotalsQuery,
  useUpdateSupplierMutation,
  useCreateSupplierTransactionMutation,
  useUpdateSupplierTransactionMutation,
  useDeleteSupplierTransactionMutation,
  useSearchSuppliersQuery,
} = supplierApiSlice;
