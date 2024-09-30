import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI, removeEmptyParams } from './general';

const { carriers } = ENDPOINTS;

export const carrierNew = (data) => AuthorizedAPI.post(carriers.root, data);

export const carrierById = (id) => AuthorizedAPI.get(`${carriers.root}/${id}`);

export const carrierUpdate = (id, data) => AuthorizedAPI.put(`${carriers.root}/${id}`, data);

export const carrierDelete = (id, params) =>
  AuthorizedAPI.delete(`${carriers.root}/${id}`, { params });

export const carrierGetCollection = (params) => AuthorizedAPI.get(carriers.root, { params });

export const carrierNumbers = (params = {}) =>
  AuthorizedAPI.get(carriers.refNumbers, { params: removeEmptyParams(params) });
