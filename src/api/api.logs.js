import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI } from './general';

const { logs } = ENDPOINTS;

export const getLogs = (data) => AuthorizedAPI.post(logs.root, data);
export const getJobNumber = (params) => AuthorizedAPI.get(logs.jobs, { params });
export const getJobLoad = (params) => AuthorizedAPI.get(logs.jobs, { params });
