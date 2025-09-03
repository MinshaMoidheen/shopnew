import { createSlice } from '@reduxjs/toolkit'


const initialState = {
    userInfo: localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')) : null
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            state.userInfo = action.payload
            localStorage.setItem('userData', JSON.stringify(action.payload))
        },
        logout: (state, action) => {
            state.userInfo = null
            localStorage.clear();
        }
    }
})


export const { setCredentials, logout } = authSlice.actions

export default authSlice.reducer