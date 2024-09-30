import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI, removeEmptyParams } from './general';

const { references } = ENDPOINTS;

export const getCities = (params) =>
  AuthorizedAPI.get(references.cities, { params: removeEmptyParams(params) });

export const getZipCodes = (params) =>
  AuthorizedAPI.get(references.zip, { params: removeEmptyParams(params) });

export const getZipCodeById = (id) => AuthorizedAPI.get(`${references.zip}/${id}`);
