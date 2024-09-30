import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI } from './general';

const { addresses } = ENDPOINTS;

export const addressNew = (data) => AuthorizedAPI.post(addresses.root, data);

export const addressUpdate = (id, data) => AuthorizedAPI.put(`${addresses.root}/${id}`, data);

export const addressDelete = (id) => AuthorizedAPI.delete(`${addresses.root}/${id}`);

export const addressGetCollection = (params) => AuthorizedAPI.get(addresses.root, { params });

export const addressGetTypes = (params) => AuthorizedAPI.get(addresses.refTypes, { params });
