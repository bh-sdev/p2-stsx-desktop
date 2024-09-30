import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  options: {},
};

export const windowSlice = createSlice({
  name: 'window',
  initialState,
});
export const PREFERENCES_ACTIONS = {
  ...windowSlice.actions,
};

export default windowSlice.reducer;
