import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  selectedGroupId: string | null
}

const initialState: UIState = {
  selectedGroupId: null,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSelectedGroup(state, action: PayloadAction<string | null>) {
      state.selectedGroupId = action.payload
    },
  },
})

export const { setSelectedGroup } = uiSlice.actions
export default uiSlice.reducer
