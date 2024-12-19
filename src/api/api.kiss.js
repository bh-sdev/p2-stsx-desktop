import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI } from './general';

const { kiss } = ENDPOINTS;

export const kissImport = (data) => AuthorizedAPI.post(kiss.root, data);

export const kissImportUpdate = (data) => AuthorizedAPI.post(kiss.import, data);

export const kissJobById = (params) => AuthorizedAPI.get(kiss.job, { params });

export const kissJobRecords = (params) => AuthorizedAPI.get(kiss.records, { params });

export const kissJobRecordsUpdateCache = (data) => AuthorizedAPI.post(kiss.records, data);

export const kissJobNumbers = (params) => AuthorizedAPI.get(kiss.jobNumbers, { params });

export const kissRoutingCodes = (params) => AuthorizedAPI.get(kiss.routingCodes, { params });

export const kissFiles = (data) => AuthorizedAPI.get(kiss.files, data);

export const kissSaveDiscardTypes = (data) => AuthorizedAPI.post(kiss.saveDiscardTypes, data);

export const kissPreferences = (params) => AuthorizedAPI.get(kiss.preferences, { params });

export const kissShopOrders = (params) => AuthorizedAPI.get(kiss.shopOrders, { params });

export const kissReportsLoads = (data) => AuthorizedAPI.post(kiss.importReportsLoads, data);

export const kissDeleteIdFiles = (data) => AuthorizedAPI.put(kiss.deleteIdFiles, data);

export const kissDeleteTransactions = (data) => AuthorizedAPI.put(kiss.deleteTransactions, data);

export const kissImportReportsLoadsIdFiles = (id, params) =>
  AuthorizedAPI.post(`${kiss.importReportsLoadsIdFiles}/${id}`, params);

export const kissImportReportsLoadsIdFileTransactions = (params) =>
  AuthorizedAPI.post(kiss.importReportsLoadsIdFileTransactions, params);

export const kissSavePreferences = (data, params) =>
  AuthorizedAPI.post(kiss.preferences, data, { params });

export const uploadKissFile = (data) =>
  AuthorizedAPI.post(kiss.files, data, {
    Headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
