import { configureStore } from '@reduxjs/toolkit';
import historyReducer from './historySlice';
import preferencesReducer from './preferencesSlice';
import referencesReducer from './referencesSlice';
import applicationPermissionReducer from './applicationPermissionSlice';

export default configureStore({
  reducer: {
    history: historyReducer,
    preferences: preferencesReducer,
    references: referencesReducer,
    permissions: applicationPermissionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
