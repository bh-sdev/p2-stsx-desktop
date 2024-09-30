import { AuthorizedAPI } from './general';
import ENDPOINTS from '../const/endpoints';

const { jobs } = ENDPOINTS;
export const jobsGet = (params) => AuthorizedAPI.get(jobs.root, { params });
export const jobNew = (data) => AuthorizedAPI.post(jobs.root, data);
export const jobById = (id) => AuthorizedAPI.get(`${jobs.root}/${id}`);
export const getDivisions = () => AuthorizedAPI.get(jobs.refDivision);
export const getDefaults = () => AuthorizedAPI.get(jobs.defaults);
export const getLabelNames = () => AuthorizedAPI.get(jobs.labelNames);
export const getLabeLaseNames = () => AuthorizedAPI.get(jobs.labeLaseNames);
export const getAddressesJobs = (id) => AuthorizedAPI.get(`${jobs.root}/${id}/${jobs.addresses}`);
export const getNumbers = (params) => AuthorizedAPI.get(`${jobs.numbers}`, { params });
export const jobDelete = (id, params) => AuthorizedAPI.delete(`${jobs.root}/${id}`, { params });
export const updateJob = (id, data) => AuthorizedAPI.put(`${jobs.root}/${id}`, data);
export const getCustomers = (params) => AuthorizedAPI.get(jobs.customers, { params });
export const getLoads = (params) => AuthorizedAPI.get(jobs.refLoads, { params });
