import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI } from './general';

const { delActiveRecords } = ENDPOINTS;

export const createReport = (data) => AuthorizedAPI.post(delActiveRecords.loads, data);

export const deleteReport = (id) => AuthorizedAPI.delete(`${delActiveRecords.loads}/${id}`);

export const reportsTop = (id, params) =>
  AuthorizedAPI.post(`${delActiveRecords.reportsTop}/${id}`, params);

export const reportsBottom = (data) => AuthorizedAPI.post(delActiveRecords.reportsBottom, data);

export const loadRefJobs = (params) => AuthorizedAPI.get(delActiveRecords.refsJobs, { params });

export const loadRefLocations = (params) =>
  AuthorizedAPI.get(delActiveRecords.refsLocations, { params });

export const loadRefPiecemarks = (params) =>
  AuthorizedAPI.get(delActiveRecords.refsParentPiecemarks, { params });

export const loadRefStatuses = (params) =>
  AuthorizedAPI.get(delActiveRecords.refsStatuses, { params });

export const loadRefSheetNumbers = (params) =>
  AuthorizedAPI.get(delActiveRecords.refsSheetNumbers, { params });

export const loadRefSequenceNumbers = (params) =>
  AuthorizedAPI.get(delActiveRecords.refsSqcNumbers, { params });

export const loadRefLotNumbers = (params) =>
  AuthorizedAPI.get(delActiveRecords.refsLotNumbers, { params });

export const loadRefBundleNumbers = (params) =>
  AuthorizedAPI.get(delActiveRecords.refsBundleNumbers, { params });

export const loadRefLoadNumbers = (params) =>
  AuthorizedAPI.get(delActiveRecords.refsLoadNumbers, { params });

export const loadRefLoadReleases = (params) =>
  AuthorizedAPI.get(delActiveRecords.refsLoadReleases, { params });

export const loadRefShopOrderNumbers = (params) =>
  AuthorizedAPI.get(delActiveRecords.refsShopOrderNumbers, { params });

export const loadRefPcReleases = (params) =>
  AuthorizedAPI.get(delActiveRecords.refsPcReleases, { params });

export const loadRefPkgNumbers = (params) =>
  AuthorizedAPI.get(delActiveRecords.refsPkgNumbers, { params }).then(({ Entries }) => ({
    Entries: Entries.map((value) => ({ Name: value, ID: value })),
  }));

export const loadRefBatches = (params) =>
  AuthorizedAPI.get(delActiveRecords.refsBatches, { params });

export const loadRefCowCodes = (params) =>
  AuthorizedAPI.get(delActiveRecords.refsCowCodes, { params });

export const loadRefSerialNumbers = (params) =>
  AuthorizedAPI.get(delActiveRecords.refsIdSerialNumbers, { params });

export const loadStatusSummary = (id, params) =>
  AuthorizedAPI.get(`${delActiveRecords.statusSummary}/${id}`, { params });

export const recordDeleteJob = (params) =>
  AuthorizedAPI.delete(delActiveRecords.recordDeleteableJob, { params });

export const recordDelete = (data) => AuthorizedAPI.put(delActiveRecords.recordDeleteable, data);

export const recordDeleteTransactions = (data) =>
  AuthorizedAPI.put(delActiveRecords.recordDeleteableTransaction, data);
