import { fetchBaseQuery, createApi } from '@reduxjs/toolkit/query/react'
import { handleLogout } from './authentication' 

import { BASE_URL } from '../constants'

const baseQuery = fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState }) => {
        // Get the token from localStorage
        const userData = JSON.parse(localStorage.getItem('userData'))

        // If we have a token, add it to the headers
        if (userData?.accessToken) {
            headers.set('authorization', `Bearer ${userData.accessToken}`)
        }
        
        return headers
    }
})

async function baseQueryWithAuth(args, api, extra) {
    const result = await baseQuery(args, api, extra)
    // Dispatch the logout action on 401.
    if (result.error && result.error.status === 401) {
        api.dispatch(handleLogout())
    }
    return result
}

export const apiSlice = createApi({
    baseQuery: baseQueryWithAuth,
    tagTypes: ['Product', 'Order', 'Users'],
    endpoints: (builder) => ({}),
})