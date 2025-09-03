import { SHOP_URL } from "../constants"
import { apiSlice } from "./apiSlice"

export const shopApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createShop: builder.mutation({
      query: (data) => ({
        url: SHOP_URL,
        method: "POST",
        body: data,
      }),
    }),

    getAllShops: builder.query({
      query: ({ page, limit, search }) => ({
        url: SHOP_URL,
        method: "GET",
        params: { page, limit, search },
      }),
    }),

    getShopById: builder.query({
      query: (shopId) => ({
        url: `${SHOP_URL}/${shopId}`,
        method: "GET",
      }),
    }),

    updateShop: builder.mutation({
      query: ({ shopId, data }) => ({
        url: `${SHOP_URL}/${shopId}`,
        method: "PUT",
        body: data,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),

    deleteShop: builder.mutation({
      query: (shopId) => ({
        url: `${SHOP_URL}/${shopId}`,
        method: "DELETE",
      }),
    }),

    searchShops: builder.query({
      query: ({ name, page = 1, limit = 10 }) => ({
        url: `${SHOP_URL}/search/name`,
        method: "GET",
        params: { name, page, limit },
      }),
    }),
  }),
})

export const {
  useCreateShopMutation,
  useGetAllShopsQuery,
  useGetShopByIdQuery,
  useUpdateShopMutation,
  useDeleteShopMutation,
  useSearchShopsQuery,
} = shopApiSlice
