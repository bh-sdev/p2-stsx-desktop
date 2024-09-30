import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI, removeEmptyParams } from './general';

const { statusCodes } = ENDPOINTS;

export const statusCodesNew = (data) => AuthorizedAPI.post(statusCodes.root, data);

export const statusCodesGetCollection = (params = {}) =>
  AuthorizedAPI.get(statusCodes.root, { params: removeEmptyParams(params) });

export const statusCodesAll = (params = {}) =>
  AuthorizedAPI.get(statusCodes.refCodes, { params: removeEmptyParams(params) });

export const statusCodesProcesses = (params = {}) =>
  AuthorizedAPI.get(statusCodes.refProcesses, { params: removeEmptyParams(params) });

export const statusCodesUpdate = (id, data) => AuthorizedAPI.put(`${statusCodes.root}/${id}`, data);

export const statusCodesDelete = (id, params) =>
  AuthorizedAPI.delete(`${statusCodes.root}/${id}`, { params });

export const statusCodesRefEndFor = (params) =>
  AuthorizedAPI.get(statusCodes.refEndFor, { params });

export const associationsGet = () => AuthorizedAPI.get(statusCodes.refAssociations);
export const employeeStatusCodeGet = () => AuthorizedAPI.get(statusCodes.refEmployeeCodes);
export const statusCodeEndForCustomProcess = (params) =>
  AuthorizedAPI.get(statusCodes.customProcess, { params });
