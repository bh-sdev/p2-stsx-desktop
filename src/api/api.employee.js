import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI, removeEmptyParams } from './general';

const { employee } = ENDPOINTS;

export const employeeNew = (data) => AuthorizedAPI.post(employee.root, data);

export const employeeUpdate = (id, data) => AuthorizedAPI.put(`${employee.root}/${id}`, data);

export const employeeDelete = (id, params) =>
  AuthorizedAPI.delete(`${employee.root}/${id}`, { params });

export const employeeById = (id) => AuthorizedAPI.get(`${employee.root}/${id}`);

export const employeeGetCollection = (params) =>
  AuthorizedAPI.get(employee.root, { params: removeEmptyParams(params) });

export const employeeGetLogins = (id) => AuthorizedAPI.get(`${employee.root}/${id}/logins`);

export const employeeDeleteLogins = (id) => AuthorizedAPI.delete(`${employee.root}/${id}/logins`);

export const employeeNumbers = (params = {}) =>
  AuthorizedAPI.get(employee.refNumbers, { params: removeEmptyParams(params) });

export const employeeAssociations = () => AuthorizedAPI.get(employee.associations);

export const employeeClassIds = (params = {}) =>
  AuthorizedAPI.get(employee.classIds, { params: removeEmptyParams(params) });
