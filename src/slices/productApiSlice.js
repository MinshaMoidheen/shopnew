import { PRODUCTS_URL } from "../constants"
import { apiSlice } from "./apiSlice"



export const productApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({


    createProduct: builder.mutation({
      query: (data) => ({
        url: PRODUCTS_URL,
        method: "POST",
        body: data,
      }),
    }),

    getProducts: builder.query({
      query: ({ page, limit, keyword, barcode }) => ({
        url: PRODUCTS_URL,
        method: "GET",
        params: {
          page,
          limit,
          ...(keyword && { keyword }),
          ...(barcode && { barcode })
        },
      }),
    }),

    getProductById: builder.query({
      query: (productId) => ({
        url: `${PRODUCTS_URL}/${productId}`,
        method: "GET",
      }),
    }),

    updateProduct: builder.mutation({
      query: ({ productId, data }) => ({
        url: `${PRODUCTS_URL}/${productId}`,
        method: "PUT",
        body: data,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),

    deleteProduct: builder.mutation({
      query: (productId) => ({
        url: `${PRODUCTS_URL}/${productId}`,
        method: "DELETE",
        params: { id: productId },
      }),
    }),

    getCategories: builder.query({
      query: (search) => ({
        url: `${PRODUCTS_URL}/categories`,
        method: "GET",
        params: { search },
      }),
    }),

    searchProducts: builder.query({
      query: ({ name, page = 1, limit = 10 }) => ({
        url: `${PRODUCTS_URL}/search/productName`,
        method: "GET",
        params: { name, page, limit },
      }),
    }),


  }),
})


export const {
  useCreateProductMutation,
  useGetProductsQuery,
  useGetProductByIdQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useSearchProductsQuery
} = productApiSlice