import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI } from './general';

const { associations } = ENDPOINTS;

export const associationCreate = (data) => AuthorizedAPI.post(associations, data);

export const associationUpdate = (id, data) => AuthorizedAPI.put(`${associations}/${id}`, data);

export const associationDelete = (id, params) =>
  AuthorizedAPI.delete(`${associations}/${id}`, { params });

export const associationGetCollection = () => AuthorizedAPI.get(associations);
