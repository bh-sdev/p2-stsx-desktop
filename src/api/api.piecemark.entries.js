import { AuthorizedAPI } from './general';
import ENDPOINTS from '../const/endpoints';

const { piecemarkEntries } = ENDPOINTS;

export const piecemarkEntryListGet = (params) =>
  AuthorizedAPI.get(piecemarkEntries.root, { params });

export const piecemarkEntryCreate = (data) => AuthorizedAPI.post(piecemarkEntries.root, data);

export const piecemarkEntryUpdate = (id, data) =>
  AuthorizedAPI.put(`${piecemarkEntries.root}/${id}`, data);

export const piecemarkEntryGet = (id) => AuthorizedAPI.get(`${piecemarkEntries.root}/${id}`);

export const piecemarkFillInfoGet = (id, params) =>
  AuthorizedAPI.get(`${piecemarkEntries.refFillInfo}/${id}`, { params });

export const piecemarkEntryDelete = (id, params) =>
  AuthorizedAPI.delete(`${piecemarkEntries.root}/${id}`, { params });

export const piecemarkEntryPiecemarkInfo = (id) =>
  AuthorizedAPI.get(`${piecemarkEntries.piecemarks}/${id}`);

export const piecemarkEntryPiecemarkInfoUpdate = (id, data) =>
  AuthorizedAPI.put(`${piecemarkEntries.piecemarks}/${id}`, data);

export const piecemarkEntryJobs = (params) =>
  AuthorizedAPI.get(piecemarkEntries.refJobs, { params });

export const piecemarkEntryJob = (id) => AuthorizedAPI.get(`${piecemarkEntries.refJobs}/${id}`);

export const piecemarkEntryJobInfo = (id) => AuthorizedAPI.get(`${piecemarkEntries.jobs}/${id}`);

export const piecemarkEntryIDInfo = (id) => AuthorizedAPI.get(`${piecemarkEntries.refID}/${id}`);

export const piecemarkEntryIDInfoUpdate = (id, data) =>
  AuthorizedAPI.put(`${piecemarkEntries.refID}/${id}`, data);

export const piecemarkEntryCowCodes = (params) =>
  AuthorizedAPI.get(piecemarkEntries.refCowCodes, { params });

export const piecemarkEntryLoadNumbers = (params) =>
  AuthorizedAPI.get(piecemarkEntries.refLoadNumbers, { params });

export const piecemarkEntryLotNumbers = (params) =>
  AuthorizedAPI.get(piecemarkEntries.refLotNumbers, { params });

export const piecemarkEntryRoutingCodes = (params) =>
  AuthorizedAPI.get(piecemarkEntries.refRoutingCodes, { params });

export const piecemarkEntrySequenceNumbers = (params) =>
  AuthorizedAPI.get(piecemarkEntries.refSequenceNumbers, { params });

export const piecemarkEntrySheetNumbers = (params) =>
  AuthorizedAPI.get(piecemarkEntries.refSheetNumbers, { params });

export const piecemarkEntryShopOrders = (params) =>
  AuthorizedAPI.get(piecemarkEntries.refShopOrders, { params });

export const piecemarkEntryMaterials = (params) =>
  AuthorizedAPI.get(piecemarkEntries.refMaterials, { params });

export const piecemarkEntryFinishes = (params) =>
  AuthorizedAPI.get(piecemarkEntries.refFinishes, { params });

export const piecemarkEntryGrades = (params) =>
  AuthorizedAPI.get(piecemarkEntries.refGrades, { params });
