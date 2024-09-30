import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI, removeEmptyParams } from './general';

const { customers } = ENDPOINTS;

export const customerNew = (data) => AuthorizedAPI.post(customers.root, data);

export const customerUpdate = (id, data) => AuthorizedAPI.put(`${customers.root}/${id}`, data);

export const customerDelete = (id, params) =>
  AuthorizedAPI.delete(`${customers.root}/${id}`, { params });

export const customerById = (id) => AuthorizedAPI.get(`${customers.root}/${id}`);

export const customerGetCollection = (params = {}) =>
  AuthorizedAPI.get(customers.root, { params: removeEmptyParams(params) });

export const customerNumbers = (params = {}) =>
  AuthorizedAPI.get(customers.refNumbers, { params: removeEmptyParams(params) });

export const customerNames = (params = {}) =>
  AuthorizedAPI.get(customers.refNames, { params: removeEmptyParams(params) });
