import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI, removeEmptyParams } from './general';

const { users } = ENDPOINTS;

export const userNew = (data) => AuthorizedAPI.post(users.root, data);

export const userUpdate = (id, data) => AuthorizedAPI.put(`${users.root}/${id}`, data);

export const userDelete = (id) => AuthorizedAPI.delete(`${users.root}/${id}`);

export const userById = (id) => AuthorizedAPI.get(`${users.root}/${id}`);

export const userGetCollection = (params) =>
  AuthorizedAPI.get(users.root, { params: removeEmptyParams(params) });

export const userSetMCLabels = (id, data) =>
  AuthorizedAPI.post(`${users.root}/${id}/mclabels`, data);

export const userGetMCLabels = (id) => AuthorizedAPI.get(`${users.root}/${id}/mclabels`);

export const userGetDuplicateUsers = (id) =>
  AuthorizedAPI.get(`${users.root}/${id}/duplicate_users`);

export const getRefsEmployee = (params) => AuthorizedAPI.get(users.refEmployees, { params });

export const getRefsAssociations = () => AuthorizedAPI.get(users.refAssociations);

export const getRefsNames = (params) =>
  AuthorizedAPI.get(users.refNames, { params: removeEmptyParams(params) });

export const getRefsPrinters = () => AuthorizedAPI.get(users.refPrinters);

export const getRefsTemplates = () => AuthorizedAPI.get(users.refTemplates);

export const getRefsMobileScreens = () => AuthorizedAPI.get(users.refMobileScrees);

export const getRefsMobileScreenLabels = () => AuthorizedAPI.get(users.refMobileScreenLabels);

export const getRefsPermissionGroups = () => AuthorizedAPI.get(users.refPermissionGroups);

export const getFoxFire = () => AuthorizedAPI.get(users.foxFire);
