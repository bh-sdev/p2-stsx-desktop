import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI } from './general';

const { rawMaterials } = ENDPOINTS;

export const createRawMaterial = (data) => AuthorizedAPI.post(rawMaterials.root, data);

export const getPrintedTable = (id, data) => AuthorizedAPI.post(`${rawMaterials.root}/${id}`, data);

export const getJobNumbers = (params) => AuthorizedAPI.get(rawMaterials.refJobs, { params });

export const getPrefs = (params) => AuthorizedAPI.get(rawMaterials.refPrinterPrefs, { params });

export const getRefControls = (params) => AuthorizedAPI.get(rawMaterials.refControls, { params });

export const getRefSerialNumbers = (params) =>
  AuthorizedAPI.get(rawMaterials.refSerialNumbers, { params });

export const getRefLocations = (params) => AuthorizedAPI.get(rawMaterials.refLocations, { params });

export const getRefHeats = (params) => AuthorizedAPI.get(rawMaterials.refHeats, { params });

export const getRefMaterials = (params) => AuthorizedAPI.get(rawMaterials.refMaterials, { params });

export const getRefPrinterLabelLase = (params) =>
  AuthorizedAPI.get(rawMaterials.refLabelaseTemplateNames, { params });

export const getRefLabels = (params) => AuthorizedAPI.get(rawMaterials.refLabelNames, { params });

export const getRefPrinterNames = (params) =>
  AuthorizedAPI.get(rawMaterials.refPrinterNames, { params });

export const removeTable = (id) => AuthorizedAPI.delete(`${rawMaterials.root}/${id}`);
export const print = (data) => AuthorizedAPI.post(rawMaterials.print, data);
export const checkPrinterSettings = (data) =>
  AuthorizedAPI.post(rawMaterials.printerSettings, data);
