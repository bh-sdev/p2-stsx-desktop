import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getPreferences } from 'api';

const initialState = {
  options: {},
};

const preferenceCollection = createAsyncThunk(
  'preferences/collection',
  async () => await getPreferences(),
);

export const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  extraReducers: (builder) => {
    builder.addCase(preferenceCollection.fulfilled, (state, action) => {
      state.options = action.payload;
    });
  },
});
export const PREFERENCES_ACTIONS = {
  ...preferencesSlice.actions,
  preferenceCollection,
};

export default preferencesSlice.reducer;
