import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI } from './general';

const { routingCodes } = ENDPOINTS;

export const routingCodesGetCollection = (params) =>
  AuthorizedAPI.get(routingCodes.root, { params });

export const routingCodeGetById = (id) => AuthorizedAPI.get(`${routingCodes.root}/${id}`);

export const routingCodeCreate = (data) => AuthorizedAPI.post(routingCodes.root, data);

export const routingCodeUpdate = (id, data) =>
  AuthorizedAPI.put(`${routingCodes.root}/${id}`, data);

export const routingCodeDelete = (id, params) =>
  AuthorizedAPI.delete(`${routingCodes.root}/${id}`, { params });

export const routingCodeGetRefStatusCodes = () => AuthorizedAPI.get(routingCodes.refStatusCodes);
