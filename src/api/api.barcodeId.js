import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI } from './general';

const { idLabels } = ENDPOINTS;

export const barcodeId = (data) => AuthorizedAPI.post(idLabels.root, data);
export const getJobNumber = (params) => AuthorizedAPI.get(idLabels.numbers, { params });
export const barcodeRefSequenceNumbers = (params) =>
  AuthorizedAPI.get(idLabels.refsSqcNumbers, { params });
export const barcodeRefSheetNumbers = (params) =>
  AuthorizedAPI.get(idLabels.refsSheetNumbers, { params });

export const barcodeRefStatuses = (params) => AuthorizedAPI.get(idLabels.refStatuses, { params });
export const barcodeRefShopOrderNumbers = (params) =>
  AuthorizedAPI.get(idLabels.refsShopOrderNumbers, { params });
export const barcodeRefLotNumbers = (params) =>
  AuthorizedAPI.get(idLabels.refsLotNumbers, { params });
export const barcodeRefLoadNumbers = (params) =>
  AuthorizedAPI.get(idLabels.refsLoadNumbers, { params });
export const barcodeRefPkgNumbers = (params) =>
  AuthorizedAPI.get(idLabels.refsPkgNumbers, { params });
export const barcodeRefLoadReleases = (params) =>
  AuthorizedAPI.get(idLabels.refsLoadReleases, { params });
export const barcodeRefLocations = (params) =>
  AuthorizedAPI.get(idLabels.refsLocations, { params });
export const barcodeRefBatches = (params) => AuthorizedAPI.get(idLabels.refsBatches, { params });
export const barcodeRefMaterials = (params) =>
  AuthorizedAPI.get(idLabels.refsMaterials, { params });
export const barcodeRefSerialNumbers = (params) =>
  AuthorizedAPI.get(idLabels.refsIdSerialNumbers, { params });
export const barcodeRefBundleNumbers = (params) =>
  AuthorizedAPI.get(idLabels.refsBundleNumbers, { params });
export const barcodeRefPiecemarks = (params) =>
  AuthorizedAPI.get(idLabels.refsParentPiecemarks, { params });
export const barcodeRefPcReleases = (params) =>
  AuthorizedAPI.get(idLabels.refsPcReleases, { params });
export const getPrintedTable = (data) => AuthorizedAPI.post(idLabels.tables, data);
export const getPrintedTableTop = (id, data) =>
  AuthorizedAPI.post(`${idLabels.tableTop}/${id}`, data);
export const getPrintedTableBottom = (data) => AuthorizedAPI.post(idLabels.tableBottom, data);
export const getPrefs = (params) => AuthorizedAPI.get(idLabels.printerPrefs, params);
export const getRefPrinterLabelLase = (params) =>
  AuthorizedAPI.get(idLabels.printerLabelLase, params);
export const getRefLabels = (params) => AuthorizedAPI.get(idLabels.printerLabels, params);
export const getRefPrinterNames = (params) => AuthorizedAPI.get(idLabels.printerNames, params);
export const removeTable = (id) => AuthorizedAPI.delete(`${idLabels.root}/${id}`);
export const print = (data) => AuthorizedAPI.post(idLabels.printer, data);
export const checkPrinterSettings = (data) => AuthorizedAPI.post(idLabels.printerSettings, data);
