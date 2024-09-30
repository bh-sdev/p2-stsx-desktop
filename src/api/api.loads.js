import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI } from './general';

const { loads } = ENDPOINTS;

export const createReport = (data) => AuthorizedAPI.post(loads.loads, data);

export const deleteReport = (id) => AuthorizedAPI.delete(`${loads.loads}/${id}`);

export const reportsTop = (id, params) => AuthorizedAPI.post(`${loads.reportsTop}/${id}`, params);

export const reportsBottom = (data) => AuthorizedAPI.post(loads.reportsBottom, data);

export const loadRefJobs = (params) => AuthorizedAPI.get(loads.refsJobs, { params });

export const loadRefLocations = (params) => AuthorizedAPI.get(loads.refsLocations, { params });

export const loadRefPiecemarks = (params) =>
  AuthorizedAPI.get(loads.refsParentPiecemarks, { params });

export const loadRefStatuses = (params) => AuthorizedAPI.get(loads.refsStatuses, { params });

export const loadRefSheetNumbers = (params) =>
  AuthorizedAPI.get(loads.refsSheetNumbers, { params });

export const loadRefSequenceNumbers = (params) =>
  AuthorizedAPI.get(loads.refsSqcNumbers, { params });

export const loadRefLotNumbers = (params) => AuthorizedAPI.get(loads.refsLotNumbers, { params });

export const loadRefBundleNumbers = (params) =>
  AuthorizedAPI.get(loads.refsBundleNumbers, { params });

export const loadRefLoadNumbers = (params) => AuthorizedAPI.get(loads.refsLoadNumbers, { params });

export const loadRefLoadReleases = (params) =>
  AuthorizedAPI.get(loads.refsLoadReleases, { params });

export const loadRefShopOrderNumbers = (params) =>
  AuthorizedAPI.get(loads.refsShopOrderNumbers, { params });

export const loadRefPcReleases = (params) => AuthorizedAPI.get(loads.refsPcReleases, { params });

export const loadRefPkgNumbers = (params) =>
  AuthorizedAPI.get(loads.refsPkgNumbers, { params }).then(({ Entries }) => ({
    Entries: Entries.map((value) => ({ Name: value, ID: value })),
  }));

export const loadRefBatches = (params) => AuthorizedAPI.get(loads.refsBatches, { params });

export const loadRefCowCodes = (params) => AuthorizedAPI.get(loads.refsCowCodes, { params });

export const loadRefSerialNumbers = (params) =>
  AuthorizedAPI.get(loads.refsIdSerialNumbers, { params });

export const loadReportPiecemerks = (id, params) =>
  AuthorizedAPI.post(`${loads.piecemarks}/${id}`, params);

export const loadStatusSummary = (id, params) =>
  AuthorizedAPI.get(`${loads.statusSummary}/${id}`, params);
