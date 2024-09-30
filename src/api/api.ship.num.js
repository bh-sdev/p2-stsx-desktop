import { AuthorizedAPI } from './general';
import ENDPOINTS from '../const/endpoints';

const { shipping } = ENDPOINTS;

export const getJobNumber = (params) => AuthorizedAPI.get(shipping.jobs, { params });
export const getLoadNumber = (params) => AuthorizedAPI.get(shipping.load_numbers, { params });
export const getInterimLoad = (params) => AuthorizedAPI.get(shipping.interim_load, { params });
export const generateTable = (data) => AuthorizedAPI.post(shipping.table, data);
export const loadCreate = (data) => AuthorizedAPI.post(shipping.loadCreate, data);
export const getTable = (id, data) => AuthorizedAPI.post(`${shipping.table}/${id}`, data);
export const getStatusCodes = (params) => AuthorizedAPI.get(shipping.status_codes, { params });
export const getLoads = (params) => AuthorizedAPI.get(shipping.loads_get, { params });
export const loadStatistic = (params) => AuthorizedAPI.get(shipping.statistic, { params });
export const createShipping = (data) => AuthorizedAPI.post(shipping.shipping, data);
