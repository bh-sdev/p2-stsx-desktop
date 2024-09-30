import { AuthorizedAPI } from './general';
import ENDPOINTS from '../const/endpoints';

const { loads } = ENDPOINTS;
export const loadGet = (params) => AuthorizedAPI.get(loads.root, { params });
export const loadByIdGet = (params) => AuthorizedAPI.get(`${loads.refs}`, { params });
