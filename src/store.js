import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from './slices/apiSlice'
import rootReducer from './slices/rootReducer'

const store = configureStore({
    reducer: {
        ...rootReducer,
        [apiSlice.reducerPath]: apiSlice.reducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
    devtools: true
})

export default store