import { createAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { permissionMain } from '../api/api.permission';

const initialState = {
  permissions: {},
};
export const setPermissions = createAction('setPermissions');

const applicationPermission = createAsyncThunk(
  'applicationPermission',
  async () => await permissionMain(),
);

export const applicationPermissionSlice = createSlice({
  name: 'permissions',
  initialState,
  extraReducers: (builder) => {
    builder.addCase(setPermissions, (state, action) => {
      state.permissions = action.payload;
    });
    builder.addCase(applicationPermission.fulfilled, (state, action) => {
      state.permissions = action.payload;
    });
  },
});
export const APPLICATION_PERMISSION_ACTIONS = {
  ...applicationPermissionSlice.actions,
  applicationPermission,
  setPermissions,
};

export default applicationPermissionSlice.reducer;
