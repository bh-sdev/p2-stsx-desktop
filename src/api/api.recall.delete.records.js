import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI } from './general';

const { recallDeleteRecords } = ENDPOINTS;

export const createReport = (data) => AuthorizedAPI.post(recallDeleteRecords.loads, data);

export const deleteReport = (id) => AuthorizedAPI.delete(`${recallDeleteRecords.loads}/${id}`);

export const recallable = (data) => AuthorizedAPI.put(recallDeleteRecords.recallable, data);

export const recordDeleteTransactions = (data) => AuthorizedAPI.put(recallDeleteRecords.root, data);

export const reportsTop = (id, params) =>
  AuthorizedAPI.post(`${recallDeleteRecords.reportsTop}/${id}`, params);

export const reportsBottom = (data) => AuthorizedAPI.post(recallDeleteRecords.reportsBottom, data);

export const loadRefJobs = (params) => AuthorizedAPI.get(recallDeleteRecords.refsJobs, { params });

export const loadRefLocations = (params) =>
  AuthorizedAPI.get(recallDeleteRecords.refsLocations, { params });

export const loadRefPiecemarks = (params) =>
  AuthorizedAPI.get(recallDeleteRecords.refsParentPiecemarks, { params });

export const loadRefStatuses = (params) =>
  AuthorizedAPI.get(recallDeleteRecords.refsStatuses, { params });

export const loadRefSheetNumbers = (params) =>
  AuthorizedAPI.get(recallDeleteRecords.refsSheetNumbers, { params });

export const loadRefSequenceNumbers = (params) =>
  AuthorizedAPI.get(recallDeleteRecords.refsSqcNumbers, { params });

export const loadRefLotNumbers = (params) =>
  AuthorizedAPI.get(recallDeleteRecords.refsLotNumbers, { params });

export const loadRefBundleNumbers = (params) =>
  AuthorizedAPI.get(recallDeleteRecords.refsBundleNumbers, { params });

export const loadRefLoadNumbers = (params) =>
  AuthorizedAPI.get(recallDeleteRecords.refsLoadNumbers, { params });

export const loadRefLoadReleases = (params) =>
  AuthorizedAPI.get(recallDeleteRecords.refsLoadReleases, { params });

export const loadRefShopOrderNumbers = (params) =>
  AuthorizedAPI.get(recallDeleteRecords.refsShopOrderNumbers, { params });

export const loadRefPcReleases = (params) =>
  AuthorizedAPI.get(recallDeleteRecords.refsPcReleases, { params });

export const loadRefPkgNumbers = (params) =>
  AuthorizedAPI.get(recallDeleteRecords.refsPkgNumbers, { params }).then(({ Entries }) => ({
    Entries: Entries.map((value) => ({ Name: value, ID: value })),
  }));

export const loadRefBatches = (params) =>
  AuthorizedAPI.get(recallDeleteRecords.refsBatches, { params });

export const loadRefCowCodes = (params) =>
  AuthorizedAPI.get(recallDeleteRecords.refsCowCodes, { params });

export const loadRefSerialNumbers = (params) =>
  AuthorizedAPI.get(recallDeleteRecords.refsIdSerialNumbers, { params });
