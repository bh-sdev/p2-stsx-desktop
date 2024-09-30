import { HISTORY_ACTIONS } from './historySlice';
import { PREFERENCES_ACTIONS } from './preferencesSlice';
import { REFERENCES_ACTIONS } from './referencesSlice';
import { APPLICATION_PERMISSION_ACTIONS } from './applicationPermissionSlice';

export default {
  ...HISTORY_ACTIONS,
  ...PREFERENCES_ACTIONS,
  ...REFERENCES_ACTIONS,
  ...APPLICATION_PERMISSION_ACTIONS,
};
