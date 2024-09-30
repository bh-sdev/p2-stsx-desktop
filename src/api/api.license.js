import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI } from './general';

const { license } = ENDPOINTS;

export const licenseUpdate = (data) => AuthorizedAPI.post(license, data);

export const licenseCheck = (data) => AuthorizedAPI.put(license, data);

export const licenseGetInfo = () => AuthorizedAPI.get(license);
