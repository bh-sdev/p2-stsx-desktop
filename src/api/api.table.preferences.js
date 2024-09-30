import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI } from './general';

const { tablePrefs } = ENDPOINTS;

export const tablePreferencesGet = (id) => AuthorizedAPI.get(`${tablePrefs.root}/${id}`);

export const tablePreferencesUpdate = (id, data) =>
  AuthorizedAPI.post(`${tablePrefs.root}/${id}`, data);
