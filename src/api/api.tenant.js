import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI } from './general';

const { tenant } = ENDPOINTS;

export const updateTenant = (data) => AuthorizedAPI.put(tenant, data);
