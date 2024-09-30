import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { associationGetCollection } from 'api';

const initialState = {
  associations: {},
};

const referenceAssociations = createAsyncThunk(
  'reference/associations',
  async (params, thunkApi) => {
    const associations = thunkApi.getState().references.associations;
    if (!Object.values(associations).length) {
      const res = await associationGetCollection(params);
      return res;
    }
  },
);

export const referencesSlice = createSlice({
  name: 'reference',
  initialState,
  reducers: {
    setAssociations: (state, { payload }) => {
      state.associations = payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(referenceAssociations.fulfilled, (state, action) => {
      state.associations = {
        ...action.payload,
        Entries: action.payload?.Entries?.sort((a, b) => (a.Name < b.Name ? -1 : 1)),
      };
    });
  },
});
export const REFERENCES_ACTIONS = {
  ...referencesSlice.actions,
  referenceAssociations,
};

export default referencesSlice.reducer;
