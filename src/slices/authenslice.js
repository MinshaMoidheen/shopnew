import { AUTH_URL } from "../constants";
import { apiSlice } from "./apiSlice";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    loginUser: builder.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/login`,
        method: "POST",
        body: data,
        credentials: "include",
      }),
    }),

   

    createUser: builder.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/register`,
        method: "POST",
        body: data,
        credentials: "include",
      }),
    }),

    verifyOtp: builder.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/verify-otp`,
        method: "POST",
        body: data,
        credentials: "include",
      }),
    }),

    logoutUser: builder.mutation({
      query: () => ({
        url: `${AUTH_URL}/logout`,
        method: "POST",
        credentials: "include",
      }),
    }),

    getUsersByCenter: builder.query({
      query: ({ centerId, page = 1, limit = 10 }) => ({
        url: `${AUTH_URL}/center/${centerId}`,
        method: "GET",
        params: {
          page,
          limit,
        },
        credentials: "include",
      }),
      providesTags: ["Users"],
    }),

    updateUser: builder.mutation({
      query: ({ id, body }) => ({
        url: `${AUTH_URL}/update/${id}`,
        method: "PATCH",
        body,
        credentials: "include",
      }),
      invalidatesTags: ["Users"],
    }),

    deleteUser: builder.mutation({
      query: ({ id }) => ({
        url: `${AUTH_URL}/delete/${id}`,
        method: "DELETE",
        credentials: "include",
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useCreateUserMutation,
  useLoginUserMutation,
  useVerifyOtpMutation,
  useLogoutUserMutation,
 
  useGetUsersByCenterQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = authApiSlice;
