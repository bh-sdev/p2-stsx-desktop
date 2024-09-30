import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI, removeEmptyParams } from './general';

const { employeeClass } = ENDPOINTS;

export const getEmployeeClasses = () => AuthorizedAPI.get(employeeClass.root);
export const employeeClassById = (id) => AuthorizedAPI.get(`${employeeClass.root}/${id}`);
export const employeeClassNumbers = (params = {}) =>
  AuthorizedAPI.get(employeeClass.numbers, { params: removeEmptyParams(params) });
export const employeeClassDelete = (id, params) =>
  AuthorizedAPI.delete(`${employeeClass.root}/${id}`, { params });
export const employeeClassNew = (data) => AuthorizedAPI.post(employeeClass.root, data);
export const employeeClassUpdate = (id, data) =>
  AuthorizedAPI.put(`${employeeClass.root}/${id}`, data);
export const employeeClassOrdersGet = () => AuthorizedAPI.get(employeeClass.orders);
