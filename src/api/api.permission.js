import { AuthorizedAPI } from './general';
import ENDPOINTS from '../const/endpoints';

const { permission } = ENDPOINTS;

export const permissionGet = () => AuthorizedAPI.get(permission.root);
export const permissionMain = () => AuthorizedAPI.get(permission.main);
export const permissionGetById = (id) => AuthorizedAPI.get(`${permission.root}/${id}`);
export const updatePermission = (id, data) => AuthorizedAPI.put(`${permission.root}/${id}`, data);
export const deletePermission = (id, params) =>
  AuthorizedAPI.delete(`${permission.root}/${id}`, { params });
export const permissionNew = (data) => AuthorizedAPI.post(`${permission.root}`, data);
export const permissionMainGetId = (id) => AuthorizedAPI.get(`${permission.main}/${id}`);
