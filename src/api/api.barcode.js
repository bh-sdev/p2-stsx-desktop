import ENDPOINTS from 'const/endpoints';
import { AuthorizedAPI } from './general';

const { barcode } = ENDPOINTS;

export const getPrefs = (params) => AuthorizedAPI.get(barcode.root, params);
export const getPrinterLabelLase = (params) => AuthorizedAPI.get(barcode.printerLabelLase, params);
export const getLabels = (params) => AuthorizedAPI.get(barcode.printerLabels, params);
export const getPrinterNames = (params) => AuthorizedAPI.get(barcode.printerNames, params);
export const updatePrefs = (data) => AuthorizedAPI.put(barcode.root, data);
export const getLocalPaths = (params) => AuthorizedAPI.get(barcode.locPath, params);
