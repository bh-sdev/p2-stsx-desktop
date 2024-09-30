import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI } from './general';

const { viewLogonLicense } = ENDPOINTS;

export const viewLogsLicenseGet = () => AuthorizedAPI.get(viewLogonLicense.root);

export const viewLogsLicenseSessionDelete = (ID) =>
  AuthorizedAPI.delete(`${viewLogonLicense.session}/${ID}`);
