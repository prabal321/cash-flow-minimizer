import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { User } from '../../types'

interface AuthState {
  token: string | null
  user: User | null
  isLoading: boolean
}

const initialState: AuthState = {
  token: null,
  user: null,
  isLoading: true,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token
      state.user = action.payload.user
      state.isLoading = false
    },
    clearCredentials(state) {
      state.token = null
      state.user = null
      state.isLoading = false
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
  },
})

export const { setCredentials, clearCredentials, setLoading } = authSlice.actions
export default authSlice.reducer
